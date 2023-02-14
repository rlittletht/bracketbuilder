
import { BracketDefinition, GameDefinition, s_brackets, BracketManager } from "../Brackets/BracketDefinitions";
import { BracketStructureBuilder } from "../Brackets/BracketStructureBuilder";
import { RangeInfo, Ranges } from "../Interop/Ranges";
import { Grid } from "./Grid";
import { AppContext, IAppContext } from "../AppContext";
import { BracketSources } from "../Brackets/BracketSources";
import { GameNum } from "./GameNum";
import { GameId } from "./GameId";
import { OADate } from "../Interop/Dates";
import { GlobalDataBuilder } from "../Brackets/GlobalDataBuilder";
import { TrackingCache } from "../Interop/TrackingCache";
import { JsCtx } from "../Interop/JsCtx";

export interface IBracketGame
{
    // these are the static definitions
    get BracketGameDefinition(): GameDefinition;
    get SwapTopBottom(): boolean;
    get BracketName(): string; // "T2" for 2 team bracket, etc. Can derive table name from it
    get GameId(): GameId; // this is the game id (1 based) in the overall static bracket definition
    get GameNum(): GameNum;

    // the following properties are volatile -- we want editors of the bracket
    // to be able to be able to easily edit them without understanding
    // concepts like abstraction.
    // to do this, we will create a table of "team names" and "game schedules"
    // which define the names of each team and the time/location of each game.
    // the originally inserted games will use these values (via name reference)
    // to populate the teams.
    // if the user types over those formulas and later pushes the game back into
    // the well (in order to move it), then we will dynamically update their change
    // into the definition table. this will "automatically" update their in-place
    // edit and when the game is later inserted with the formula, it will get
    // the new value that they updated.

    get TopTeamName(): string; // if this is the first game, this is the team name
    get BottomTeamName(): string; // if this is the bottom game, this is the team name
    get StartTime(): number; // this is the number of minutes since the start of the day
    get IsChampionship(): boolean;
    get IsIfNecessaryGame(): boolean; // this is true if this game is the 'what-if' game before the championship
    get WinningTeamAdvancesToGameId(): GameId;

    FormatTime(): string;
    FormatLoser(): string;
    Bind(context: JsCtx, appContext: IAppContext, cache: TrackingCache): Promise<IBracketGame>;
    Unbind();
    SetSwapTopBottom(swapped: boolean);
    SetStartTime(time: number);
    SetField(field: string);

    get Field(): string;

    get TopTeamCellName(): string;
    get BottomTeamCellName(): string;
    get GameNumberCellName(): string;
    get IsLinkedToBracket(): boolean;
    get FullGameRange(): RangeInfo;
    get TopTeamRange(): RangeInfo;
    get BottomTeamRange(): RangeInfo;
    get GameIdRange(): RangeInfo;
    get TopSource(): string;
    get BottomSource(): string;
}


export class BracketGame implements IBracketGame
{
    m_bracketGameDefinition: GameDefinition;
    m_swapTopBottom: boolean;
    m_bracketName: string;
    m_gameNum: GameNum;
    m_teamNameTop: string = null;
    m_teamNameBottom: string = null;
    m_startTime: number = GlobalDataBuilder.DefaultStartTime;
    m_field: string = GlobalDataBuilder.DefaultField;
    m_topTeamLocation: RangeInfo;
    m_bottomTeamLocation: RangeInfo;
    m_gameNumberLocation: RangeInfo;
    m_isIfNecessaryGame: boolean;

    SetStartTime(time: number)
    {
        this.m_startTime = time;
    }

    SetField(field: string)
    {
        this.m_field = field;
    }

    get IsIfNecessaryGame(): boolean
    {
        if (this.m_bracketGameDefinition == null)
            throw Error("no BracketGameDefinition available for IsIfNecessaryGame()");

        if (this.m_bracketGameDefinition.topSource.length <= 1
            || this.m_bracketGameDefinition.bottomSource.length <= 1)
        {
            return false;
        }

        if (this.m_bracketGameDefinition.topSource.substring(1) == this.m_bracketGameDefinition.bottomSource.substring(1))
        {
            // a two team bracket can fool our logic here since game 2's sources are both game 1...
            if (this.m_bracketName == "T2" && this.GameId.equals(new GameId(2)))
                return false;

            return true;
        }

        return false;
    }

    get IsChampionship(): boolean
    {
        return (!this.m_bracketGameDefinition.loser
                || this.m_bracketGameDefinition.loser == "")
            && (!this.m_bracketGameDefinition.winner
                || this.m_bracketGameDefinition.winner == "");
    }

    static CreateFromGameSync(bracket: string, gameNumber: GameNum): IBracketGame
    {
        AppContext.checkpoint("cfg.1");
        let game: BracketGame = new BracketGame();

        AppContext.checkpoint("cfg.2");
        return game.LoadSync(bracket, gameNumber);
    }

    static async CreateFromGameNumber(context: JsCtx, appContext: IAppContext, cache: TrackingCache, bracket: string, gameNumber: GameNum): Promise<IBracketGame>
    {
        AppContext.checkpoint("cfg.1");
        let game: BracketGame = new BracketGame();

        AppContext.checkpoint("cfg.2");
        return await game.Load(context, appContext, cache, bracket, gameNumber);
    }


    static async CreateFromGameId(context: JsCtx, cache: TrackingCache, bracket: string, gameId: GameId): Promise<IBracketGame>
    {
        return await this.CreateFromGameNumber(context, null, cache, bracket, gameId.GameNum);
    }

    // getters
    get BracketGameDefinition(): GameDefinition { return this.m_bracketGameDefinition; }
    get SwapTopBottom(): boolean { return this.m_swapTopBottom; }
    get BracketName(): string { return this.m_bracketName;  }
    get GameId(): GameId { return this.m_gameNum.GameId; }
    get GameNum(): GameNum { return this.m_gameNum; }

    get FullGameRange(): RangeInfo
    {
        if (!this.IsLinkedToBracket)
            return null;

        if (this.IsChampionship)
        {
            return new RangeInfo(
                this.m_topTeamLocation.FirstRow,
                3,
                this.m_topTeamLocation.FirstColumn,
                3);
        }
        return new RangeInfo(
            this.m_topTeamLocation.FirstRow,
            this.m_bottomTeamLocation.LastRow - this.m_topTeamLocation.FirstRow + 1,
            this.m_topTeamLocation.FirstColumn,
            3);
    }

    get WinningTeamAdvancesToGameId(): GameId
    {
        // we know what game we want to have
        if (this.BracketGameDefinition.winner == "")
            return null; // winner goes nowhere

        return BracketManager.GameIdFromWinnerLoser(this.BracketGameDefinition.winner);
    }

    get TopTeamRange(): RangeInfo
    {
        return this.m_topTeamLocation;
    }

    get BottomTeamRange(): RangeInfo
    {
        return this.m_bottomTeamLocation;
    }

    get GameIdRange(): RangeInfo
    {
        return this.m_gameNumberLocation;
    }

    SetSwapTopBottom(swapped: boolean)
    {
        this.m_swapTopBottom = swapped;
    }

    /*----------------------------------------------------------------------------
        %%Function: BracketGame.IsTeamSourceStatic
    ----------------------------------------------------------------------------*/
    static IsTeamSourceStatic(source: string): boolean
    {
        if (source.length > 3 || source.length == 1)
            return true;

        if (source[0] === "W" || source[0] === "L")
            return isNaN(+source.substring(1, source.length - 1));

        return false;
    }

    /*----------------------------------------------------------------------------
        %%Function: BracketGame.TopTeamNameInvariant
    ----------------------------------------------------------------------------*/
    get TopTeamNameInvariant(): string
    {
        return (BracketGame.IsTeamSourceStatic(this.BracketGameDefinition.topSource) || this.m_teamNameTop == null)
                   ? this.BracketGameDefinition.topSource
                   : this.m_teamNameTop;
    }

    get TopSource(): string
    {
        return this.m_swapTopBottom ? this.BracketGameDefinition.bottomSource : this.BracketGameDefinition.topSource;
    }

    get BottomSource(): string
    {
        return !this.m_swapTopBottom ? this.BracketGameDefinition.bottomSource : this.BracketGameDefinition.topSource;
    }

    /*----------------------------------------------------------------------------
        %%Function: BracketGame.TopTeamName
    ----------------------------------------------------------------------------*/
    get TopTeamName(): string
    {
        return this.m_swapTopBottom ? this.BottomTeamNameInvariant : this.TopTeamNameInvariant;
    }

    /*----------------------------------------------------------------------------
        %%Function: BracketGame.BottomTeamNameInvariant
    ----------------------------------------------------------------------------*/
    get BottomTeamNameInvariant(): string
    {
        return (BracketGame.IsTeamSourceStatic(this.BracketGameDefinition.bottomSource)
                       || this.m_teamNameBottom == null)
                   ? this.BracketGameDefinition.bottomSource
                   : this.m_teamNameBottom;
    }

    /*----------------------------------------------------------------------------
        %%Function: BracketGame.BottomTeamName
    ----------------------------------------------------------------------------*/
    get BottomTeamName(): string
    {
        return this.m_swapTopBottom ? this.TopTeamNameInvariant : this.BottomTeamNameInvariant;
    }

    /*----------------------------------------------------------------------------
        %%Function: BracketGame.StartTime
    ----------------------------------------------------------------------------*/
    get StartTime(): number { return this.m_startTime; }

    /*----------------------------------------------------------------------------
        %%Function: BracketGame.FormatTime
    ----------------------------------------------------------------------------*/
    FormatTime(): string
    {
        let hours: number = Math.floor(this.m_startTime / 60);
        const mins: number = this.m_startTime - hours * 60;
        const ampm: string = hours >= 12 ? "PM" : "AM";

        hours = hours >= 12 ? hours - 12 : hours;

        return `${hours}:${mins < 10 ? "0" : ""}${mins} ${ampm}`;
    }

    /*----------------------------------------------------------------------------
        %%Function: BracketGame.FormatLoser
    ----------------------------------------------------------------------------*/
    FormatLoser(): string
    {
        if (this.m_bracketGameDefinition.loser == "")
        {
            return "";
        }
        else
        {
            return `L to ${this.m_bracketGameDefinition.loser.substring(1)}`;
        }
    }

    /*----------------------------------------------------------------------------
        %%Function: BracketGame.Field
    ----------------------------------------------------------------------------*/
    get Field(): string { return this.m_field; }

    /*----------------------------------------------------------------------------
        %%Function: BracketGame.Unbind
    ----------------------------------------------------------------------------*/
    async Unbind()
    {
        this.m_bottomTeamLocation = null
        this.m_topTeamLocation = null;
        this.m_gameNumberLocation = null;
    }

    /*----------------------------------------------------------------------------
        %%Function: BracketGame.Bind
    ----------------------------------------------------------------------------*/
    async Bind(context: JsCtx, appContext: IAppContext, cache: TrackingCache): Promise<IBracketGame>
    {
        AppContext.checkpoint("b.1");
        if (this.IsLinkedToBracket)
            return this;

        if (appContext != null)
            appContext.Timer.startAggregatedTimer("namedInner", "getNamedRanges inner");

        AppContext.checkpoint("b.2");
        const test: RangeInfo = await RangeInfo.getRangeInfoForNamedCellFaster(context, cache, this.BottomTeamCellName);

        console.log("got here!");

        this.m_bottomTeamLocation = await RangeInfo.getRangeInfoForNamedCellFaster(context, cache, this.BottomTeamCellName);
        AppContext.checkpoint("b.3");
        this.m_topTeamLocation = await RangeInfo.getRangeInfoForNamedCellFaster(context, cache, this.TopTeamCellName);
        AppContext.checkpoint("b.4");
        this.m_gameNumberLocation = await RangeInfo.getRangeInfoForNamedCellFaster(context, cache, this.GameNumberCellName);
        AppContext.checkpoint("b.5");

        if (appContext != null)
            appContext.Timer.pauseAggregatedTimer("namedInner");

        if (!this.IsChampionship)
        {
            if (this.m_topTeamLocation != null && this.m_bottomTeamLocation != null)
            {
                // we can determine top/bottom swap state by the ranges we are bound to
                this.m_swapTopBottom = this.m_topTeamLocation.FirstRow > this.m_bottomTeamLocation.FirstRow;
                if (this.m_swapTopBottom)
                {
                    const temp: RangeInfo = this.m_topTeamLocation;
                    this.m_topTeamLocation = this.m_bottomTeamLocation;
                    this.m_bottomTeamLocation = temp;
                }

                AppContext.checkpoint("b.6");
            }
            else
            {
                // we didn't bind to a game in the bracket. get the swap state from the source data
                // table

                if (appContext != null)
                    appContext.Timer.startAggregatedTimer("innerBind", "inner bind");

                AppContext.checkpoint("b.7");
                const sheet: Excel.Worksheet =
                    await cache.getTrackedItem(
                        context,
                        BracketSources.SheetName,
                        async (context): Promise<any> =>
                        {
                            const sheetGet: Excel.Worksheet = context.Ctx.workbook.worksheets.getItemOrNullObject(BracketSources.SheetName);
                            await context.sync();
                            return sheetGet;
                        });

//                if (sheet == null)
//                {
//                    sheet = context.Ctx.workbook.worksheets.getItemOrNullObject(BracketSources.SheetName);
//                    await context.sync();
//                }

                AppContext.checkpoint("b.8");

                if (!sheet.isNullObject)
                {
                    const tableName: string = "BracketSourceData";

                    const table: Excel.Table =
                        await cache.getTrackedItem(
                            context,
                            tableName,
                            async (context): Promise<any> =>
                            {
                                const tableGet = sheet.tables.getItemOrNullObject(tableName);
                                await context.sync();
                                return tableGet;
                            }
                        );

                    if (!table.isNullObject)
                    {
                        const range: Excel.Range =
                            await cache.getTrackedItem(
                                context,
                                "tableBodyRange",
                                async (context): Promise<any> =>
                                {
                                    const rangeGet: Excel.Range = table.getDataBodyRange();
                                    rangeGet.load("values");
                                    await context.sync();
                                    return rangeGet;
                                });

                        const data: any[][] = range.values;

                        // sadly we have to go searching for this on our own...
                        for (let i: number = 0; i < data.length; i++)
                        {
                            if (data[i][0] == this.m_gameNum.Value)
                            {
                                this.m_swapTopBottom = data[i][3];
                            }
                        }
                    }
                }
                if (appContext != null)
                    appContext.Timer.pauseAggregatedTimer("innerBind");
            }

            if (this.m_gameNumberLocation != null)
            {
                if (appContext != null)
                    appContext.Timer.startAggregatedTimer("innerGameNum", "gameNumberLocation inner");

                const fieldTimeRange: RangeInfo = this.m_gameNumberLocation.offset(0, 3, -1, 1);

                const sheet: Excel.Worksheet = context.Ctx.workbook.worksheets.getActiveWorksheet();
                const range: Excel.Range = Ranges.rangeFromRangeInfo(sheet, fieldTimeRange);
                range.load("values");

                await context.sync();

                const data: any[][] = range.values;
                this.m_field = data[0][0];
                const time: string = data[2][0];
                const mins = OADate.MinutesFromTimeString(time);
                this.m_startTime = mins;

                if (appContext != null)
                    appContext.Timer.pauseAggregatedTimer("innerGameNum");
            }

        }

        AppContext.checkpoint("b.13");
        return this;
    }

    async Load(context: JsCtx, appContext: IAppContext, cache: TrackingCache, bracketName: string, gameNum: GameNum): Promise<IBracketGame>
    {
        this.LoadSync(bracketName, gameNum);

        // if we don't have a context, then we aren't async and we aren't going to fetch anything from the sheet
        if (context == null)
            return this;

        // ok, try to load the linkage. do this by finding the named ranges
        // for the parts of this game

        AppContext.checkpoint("l.4");
        return await this.Bind(context, appContext, cache);
    }

    /*----------------------------------------------------------------------------
        %%Function: BracketGame.Load

        Load the static portions of this game, and if possible, load its linkage
        into the current bracket schedule
    ----------------------------------------------------------------------------*/
    LoadSync(bracketName: string, gameNum: GameNum): IBracketGame
    {
        AppContext.checkpoint("l.1");

        let bracketDefinition: BracketDefinition = BracketStructureBuilder.getBracketDefinition(`${bracketName}Bracket`);

        AppContext.checkpoint("l.2");
        this.m_gameNum = gameNum;
        this.m_bracketName = bracketName;

        this.m_bracketGameDefinition = bracketDefinition.games[gameNum.Value];
        this.m_swapTopBottom = false;
        this.m_teamNameTop = null;
        this.m_teamNameBottom = null;
        this.m_startTime = 18 * 60;
        this.m_field = "Field #1";

        AppContext.checkpoint("l.3");
        return this;
    }

    /*----------------------------------------------------------------------------
        %%Function: BracketGame.IsLinkedToBracket
    ----------------------------------------------------------------------------*/
    get IsLinkedToBracket(): boolean
    {
        return this.m_topTeamLocation != null
            && (this.IsChampionship
                || (this.m_bottomTeamLocation != null
                    && this.m_gameNumberLocation != null));
    }

    /*----------------------------------------------------------------------------
        %%Function: BracketGame.TopTeamCellNameInvariant
    ----------------------------------------------------------------------------*/
    get TopTeamCellNameInvariant(): string
    {
        return `${this.m_bracketName}_G${this.GameId.Value}_1`;
    }

    /*----------------------------------------------------------------------------
        %%Function: BracketGame.TopTeamCellName
    ----------------------------------------------------------------------------*/
    get TopTeamCellName(): string
    {
        return this.m_swapTopBottom ? this.BottomTeamCellNameInvariant : this.TopTeamCellNameInvariant;
    }

    /*----------------------------------------------------------------------------
        %%Function: BracketGame.BottomTeamCellNameInvariant
    ----------------------------------------------------------------------------*/
    get BottomTeamCellNameInvariant(): string
    {
        return `${this.m_bracketName}_G${this.GameId.Value}_2`;
    }

    /*----------------------------------------------------------------------------
        %%Function: BracketGame.BottomTeamCellName
    ----------------------------------------------------------------------------*/
    get BottomTeamCellName(): string
    {
        return this.m_swapTopBottom ? this.TopTeamCellNameInvariant : this.BottomTeamCellNameInvariant;
    }

    /*----------------------------------------------------------------------------
        %%Function: BracketGame.GameNumberCellName
    ----------------------------------------------------------------------------*/
    get GameNumberCellName(): string
    {
        return `${this.m_bracketName}_Game${this.GameId.Value}`;
    }
}