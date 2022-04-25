
import { BracketDefinition, GameDefinition, s_brackets } from "../Brackets/BracketDefinitions";
import { BracketStructureBuilder } from "../Brackets/BracketStructureBuilder";
import { RangeInfo } from "../Interop/Ranges";
import { Grid } from "./Grid";

export interface IBracketGame
{
    // these are the static definitions
    get BracketGameDefinition(): GameDefinition;
    get SwapTopBottom(): boolean;
    get BracketName(): string; // "T2" for 2 team bracket, etc. Can derive table name from it
    get GameNum(): number; // this is the game number (0 based) in the overall static bracket definition

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
    FormatTime(): string;
    FormatLoser(): string;
    Bind(ctx: any): Promise<IBracketGame>;
    Unbind();
    SetSwapTopBottom(swapped: boolean);

    get Field(): string;

    get TopTeamCellName(): string;
    get BottomTeamCellName(): string;
    get GameNumberCellName(): string;
    get IsLinkedToBracket(): boolean;
    get FullGameRange(): RangeInfo;
    get TopTeamRange(): RangeInfo;
    get BottomTeamRange(): RangeInfo;
    get GameNumberRange(): RangeInfo;
}


export class BracketGame implements IBracketGame
{
    m_bracketGameDefinition: GameDefinition;
    m_swapTopBottom: boolean;
    m_bracketName: string;
    m_gameNum: number;
    m_teamNameTop: string = null;
    m_teamNameBottom: string = null;
    m_startTime: number = 18 * 60; // 6pm
    m_field: string = "Field #1";
    m_topTeamLocation: RangeInfo;
    m_bottomTeamLocation: RangeInfo;
    m_gameNumberLocation: RangeInfo;

    static async CreateFromGame(ctx: any, bracket: string, gameNumber: number): Promise<IBracketGame>
    {
        console.log("cfg.1");
        let game: BracketGame = new BracketGame();

        console.log("cfg.2");
        return await game.Load(ctx, bracket, gameNumber);
    }

    // getters
    get BracketGameDefinition(): GameDefinition { return this.m_bracketGameDefinition; }
    get SwapTopBottom(): boolean { return this.m_swapTopBottom; }
    get BracketName(): string { return this.m_bracketName;  }
    get GameNum(): number { return this.m_gameNum + 1; }
    get FullGameRange(): RangeInfo
    {
        if (!this.IsLinkedToBracket)
            return null;

        return new RangeInfo(
            this.m_topTeamLocation.FirstRow,
            this.m_bottomTeamLocation.LastRow - this.m_topTeamLocation.FirstRow + 1,
            this.m_topTeamLocation.FirstColumn,
            3);
    }

    get TopTeamRange(): RangeInfo
    {
        return this.m_topTeamLocation;
    }

    get BottomTeamRange(): RangeInfo
    {
        return this.m_bottomTeamLocation;
    }

    get GameNumberRange(): RangeInfo
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
            return "";
        else
            return `Loser to ${this.m_bracketGameDefinition.loser}`;
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
    async Bind(ctx: any): Promise<IBracketGame>
    {
        console.log("b.1");
        if (this.IsLinkedToBracket)
            return this;

        console.log("b.2");
        this.m_bottomTeamLocation = await RangeInfo.getRangeInfoForNamedCell(ctx, this.BottomTeamCellName);
        console.log("b.3");
        this.m_topTeamLocation = await RangeInfo.getRangeInfoForNamedCell(ctx, this.TopTeamCellName);
        console.log("b.4");
        this.m_gameNumberLocation = await RangeInfo.getRangeInfoForNamedCell(ctx, this.GameNumberCellName);
        console.log("b.5");

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

            console.log("b.6");
        }
        else
        {
            // we didn't bind to a game in the bracket. get the swap state from the source data
            // table

            console.log("b.7");
            const sheet: Excel.Worksheet = ctx.workbook.worksheets.getItemOrNullObject("BracketSources");
            await ctx.sync();
            console.log("b.8");

            if (!sheet.isNullObject)
            {
                const table: Excel.Table = sheet.tables.getItemOrNullObject("BracketSourceData");
                console.log("b.9");
                await ctx.sync();
                console.log("b.10");

                if (!table.isNullObject)
                {
                    const range: Excel.Range = table.getDataBodyRange();
                    range.load("values");
                    console.log("b.11");
                    await ctx.sync();
                    console.log("b.12");

                    const data: any[][] = range.values;

                    // sadly we have to go searching for this on our own...
                    for (let i: number = 0; i < data.length; i++)
                    {
                        if (data[i][0] == this.m_gameNum)
                        {
                            this.m_swapTopBottom = data[i][3];
                        }
                    }
                }
            }
        }

        console.log("b.13");
        return this;
    }


    /*----------------------------------------------------------------------------
        %%Function: BracketGame.Load

        Load the static portions of this game, and if possible, load its linkage
        into the current bracket schedule
    ----------------------------------------------------------------------------*/
    async Load(ctx: any, bracketName: string, gameNum: number): Promise<IBracketGame>
    {
        console.log("l.1");

        let bracketDefinition: BracketDefinition = BracketStructureBuilder.getBracketDefinition(`${bracketName}Bracket`);

        console.log("l.2");
        this.m_gameNum = gameNum;
        this.m_bracketName = bracketName;

        this.m_bracketGameDefinition = bracketDefinition.games[gameNum];
        this.m_swapTopBottom = false;
        this.m_teamNameTop = null;
        this.m_teamNameBottom = null;
        this.m_startTime = 18 * 60;
        this.m_field = "Field #1";

        console.log("l.3");
        // if we don't have a context, then we aren't async and we aren't going to fetch anything from the sheet
        if (ctx == null)
            return this;

        // ok, try to load the linkage. do this by finding the named ranges
        // for the parts of this game

        console.log("l.4");
        return await this.Bind(ctx);
    }

    /*----------------------------------------------------------------------------
        %%Function: BracketGame.IsLinkedToBracket
    ----------------------------------------------------------------------------*/
    get IsLinkedToBracket(): boolean
    {
        return this.m_topTeamLocation != null && this.m_bottomTeamLocation != null && this.m_gameNumberLocation != null;
    }

    /*----------------------------------------------------------------------------
        %%Function: BracketGame.TopTeamCellNameInvariant
    ----------------------------------------------------------------------------*/
    get TopTeamCellNameInvariant(): string
    {
        return `${this.m_bracketName}_G${this.GameNum}_1`;
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
        return `${this.m_bracketName}_G${this.GameNum}_2`;
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
        return `${this.m_bracketName}_Game${this.GameNum}`;
    }
}