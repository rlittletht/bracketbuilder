
import { AppContext, IAppContext } from "../AppContext/AppContext";
import { IBracketGameDefinition } from "../Brackets/IBracketGameDefinition";
import { IBracketDefinitionData } from "../Brackets/IBracketDefinitionData";
import { BracketManager, _bracketManager } from "../Brackets/BracketManager";
import { BracketDefBuilder } from "../Brackets/BracketDefBuilder";
import { GameDataSources } from "../Brackets/GameDataSources";
import { GlobalDataBuilder } from "../Brackets/GlobalDataBuilder";
import { OADate } from "../Interop/Dates";
import { FastFormulaAreas } from "../Interop/FastFormulaAreas/FastFormulaAreas";
import { JsCtx } from "../Interop/JsCtx";
import { RangeCaches, RangeCacheItemType } from "../Interop/RangeCaches";
import { RangeInfo, Ranges } from "../Interop/Ranges";
import { ObjectType } from "../Interop/TrackingCache";
import { _TimerStack } from "../PerfTimer";
import { GameId } from "./GameId";
import { GameNum } from "./GameNum";
import { StructureRemove } from "./StructureEditor/StructureRemove";
import { FastFormulaAreasItems } from "../Interop/FastFormulaAreas/FastFormulaAreasItems";
import { IBracketGame } from "./IBracketGame";
import { BracketGameBase } from "./BracketGameBase";


export class BracketGame extends BracketGameBase implements IBracketGame
{
    m_topTeamOverride: string;
    m_bottomTeamOverride: string;
    m_fieldOverride: string;
    m_timeOverride: number;
    m_topTeamNameValue: string;
    m_bottomTeamNameValue: string;
    m_isBroken: boolean = false;

    // getters
    get IsBroken(): boolean
    {
        return this.m_isBroken;
    }

    get NeedsDataPull(): boolean
    {
        if (this.IsChampionship)
            return false;

        if ((this.m_bottomTeamOverride != null && this.m_bottomTeamOverride != "")
            || (this.m_topTeamOverride != null && this.m_topTeamOverride != "")
            || (this.m_fieldOverride != null && this.m_fieldOverride != "" && this.m_fieldOverride[0] != "=")
            || this.m_timeOverride != 0)
        {
            return true;
        }

        return false;
    }

    get IsIfNecessaryGame(): boolean
    {
        if (this.m_bracketGameDefinition == null)
            throw new Error("no BracketGameDefinition available for IsIfNecessaryGame()");

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

    get TopTeamNameValue(): string { return this.m_topTeamNameValue }

    get BottomTeamNameValue(): string {return this.m_bottomTeamNameValue}

    static CreateFromGameSync(bracket: string, gameNumber: GameNum): IBracketGame
    {
        AppContext.checkpoint("cfg.1");
        let game: BracketGame = new BracketGame();

        AppContext.checkpoint("cfg.2");
        game.LoadSync(bracket, gameNumber);

        return game;
    }

    static async CreateFromGameNumber(context: JsCtx, appContext: IAppContext, bracket: string, gameNumber: GameNum): Promise<IBracketGame>
    {
        AppContext.checkpoint("cfg.1");
        let game: BracketGame = new BracketGame();

        AppContext.checkpoint("cfg.2");
        await game.Load(context, appContext, bracket, gameNumber);
        return game;
    }


    static async CreateFromGameId(context: JsCtx, bracket: string, gameId: GameId): Promise<IBracketGame>
    {
        return await this.CreateFromGameNumber(context, null, bracket, gameId.GameNum);
    }

    /*----------------------------------------------------------------------------
        %%Function: BracketGame.Bind
    ----------------------------------------------------------------------------*/
    async Bind(context: JsCtx, appContext: IAppContext): Promise<IBracketGame>
    {
        appContext;
        AppContext.checkpoint("b.1");
        if (this.IsLinkedToBracket)
            return this;

        _TimerStack.startAggregatedTimer("namedInner", "getNamedRanges inner");

        AppContext.checkpoint("b.2");

        this.m_bottomTeamLocation = await RangeInfo.getRangeInfoForNamedCellFaster(context, this.BottomTeamCellName);
        AppContext.checkpoint("b.3");
        this.m_topTeamLocation = await RangeInfo.getRangeInfoForNamedCellFaster(context, this.TopTeamCellName);
        AppContext.checkpoint("b.4");
        this.m_gameNumberLocation = await RangeInfo.getRangeInfoForNamedCellFaster(context, this.GameNumberCellName);
        AppContext.checkpoint("b.5");

        if ((this.m_bottomTeamLocation || this.m_gameNumberLocation)
            && (this.m_gameNumberLocation == null || this.m_topTeamLocation == null))
        {
            this.m_isBroken = true;
            // we will still try to build as much as we can. but very carefully
        }

        if (Ranges.isRangeNotAdjacent(this.m_topTeamLocation, this.m_gameNumberLocation))
        {
            this.m_isBroken = true;
        }

        if (Ranges.isRangeNotAdjacent(this.m_bottomTeamLocation, this.m_gameNumberLocation))
        {
            this.m_isBroken = true;
        }

        _TimerStack.pauseAggregatedTimer("namedInner");

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

                _TimerStack.startAggregatedTimer("innerBind", "inner bind");

                let data = null;

                const { rangeInfo: gameDataRange, formulaCacheType: type } = RangeCaches.getCacheByType(RangeCacheItemType.FieldsAndTimesBody);
                if (gameDataRange != null)
                {
                    const areasCache = FastFormulaAreas.getFastFormulaAreaCacheForType(context, type);
                    if (areasCache != null)
                        data = areasCache.getValuesForRangeInfo(gameDataRange);
                }

                if (data == null)
                {
                    AppContext.checkpoint("b.7");
                    const sheet =
                        await context.getTrackedItemOrPopulate(
                            GameDataSources.SheetName,
                            async (context): Promise<any> =>
                            {
                                const sheetGet: Excel.Worksheet = context.Ctx.workbook.worksheets.getItemOrNullObject(GameDataSources.SheetName);
                                await context.sync("GTI sheet(bracketSrc)");
                                return { type: ObjectType.JsObject, o: sheetGet };
                            });

                    //                if (sheet == null)
                    //                {
                    //                    sheet = context.Ctx.workbook.worksheets.getItemOrNullObject(GameDataSources.SheetName);
                    //                    await context.sync();
                    //                }

                    AppContext.checkpoint("b.8");

                    if (sheet && !sheet.isNullObject)
                    {
                        const tableName: string = "BracketSourceData";

                        const table =
                            await context.getTrackedItemOrPopulate(
                                tableName,
                                async (context): Promise<any> =>
                                {
                                    const tableGet = sheet.tables.getItemOrNullObject(tableName);
                                    await context.sync("GTI brk table");
                                    return { type: ObjectType.JsObject, o: tableGet };
                                }
                            );

                        if (table && !table.isNullObject)
                        {
                            const range =
                                await context.getTrackedItemOrPopulate(
                                    "tableBodyRange",
                                    async (context): Promise<any> =>
                                    {
                                        const rangeGet: Excel.Range = table.getDataBodyRange();
                                        rangeGet.load("values");
                                        await context.sync("GTI brk body");
                                        return { type: ObjectType.JsObject, o: rangeGet };
                                    });

                            if (!range)
                                throw new Error("could not get range from worksheet");

                            data = range.values;
                        }
                    }
                }

                if (data != null)
                {
                    // sadly we have to go searching for this on our own...
                    for (let i: number = 0; i < data.length; i++)
                    {
                        if (data[i][0] == this.m_gameNum.Value)
                        {
                            this.m_swapTopBottom = data[i][3];
                        }
                    }
                }

                _TimerStack.pauseAggregatedTimer("innerBind");
            }

            if (this.m_gameNumberLocation != null)
            {
                _TimerStack.startAggregatedTimer("innerGameNum", "gameNumberLocation inner");

                const fieldTimeRange: RangeInfo = this.m_gameNumberLocation.offset(0, 3, -1, 1);

                const areasCache = FastFormulaAreas.getFastFormulaAreaCacheForType(context, FastFormulaAreasItems.GameGrid);
                let data = null;

                if (areasCache != null)
                {
                    data = areasCache.getValuesForRangeInfo(fieldTimeRange);
                }
                else
                {
                    const sheet: Excel.Worksheet = context.Ctx.workbook.worksheets.getActiveWorksheet();
                    const range: Excel.Range = Ranges.rangeFromRangeInfo(sheet, fieldTimeRange);
                    range.load("values");

                    await context.sync("gamenum loc values");

                    data = range.values;
                }

                this.m_field = data[0][0];
                const time: string = data[2][0];
                const mins = OADate.MinutesFromTimeString(time);
                this.m_startTime = mins;

                _TimerStack.pauseAggregatedTimer("innerGameNum");
            }

            _TimerStack.startAggregatedTimer("innerRepair", "check for repair inner");
            // now figure out if we need to repair this game
            if (BracketGame.IsTeamSourceStatic(this.TopTeamName))
                this.m_topTeamOverride = await StructureRemove.getTeamSourceNameOverrideValueForNamedRange(context, this.TopTeamCellName, this.TopTeamName);

            this.m_topTeamNameValue = await StructureRemove.getTeamSourceNameValueForNamedRange(context, this.TopTeamCellName);

            if (BracketGame.IsTeamSourceStatic(this.BottomTeamName))
                this.m_bottomTeamOverride = await StructureRemove.getTeamSourceNameOverrideValueForNamedRange(context, this.BottomTeamCellName, this.BottomTeamName);

            this.m_bottomTeamNameValue = await StructureRemove.getTeamSourceNameValueForNamedRange(context, this.BottomTeamCellName);
            _TimerStack.pauseAggregatedTimer("innerRepair");

            let timeOverride: number;
            _TimerStack.startAggregatedTimer("innerRepair2", "check for repair inner field/time");

            [this.m_fieldOverride, timeOverride] = await StructureRemove.getFieldAndTimeOverrideValuesForNamedRange(context, this.GameNumberCellName);
            this.m_timeOverride = typeof timeOverride !== "number" ? 0 : timeOverride;
            _TimerStack.pauseAggregatedTimer("innerRepair2");

        }

        AppContext.checkpoint("b.13");
        return this;
    }

    async Load(context: JsCtx, appContext: IAppContext, bracketName: string, gameNum: GameNum): Promise<IBracketGame>
    {
        this.LoadSync(bracketName, gameNum);

        // if we don't have a context, then we aren't async and we aren't going to fetch anything from the sheet
        if (context == null)
            return this;

        // ok, try to load the linkage. do this by finding the named ranges
        // for the parts of this game

        AppContext.checkpoint("l.4");
        return await this.Bind(context, appContext);
    }
}