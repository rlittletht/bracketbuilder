
import { BracketDefinition, GameDefinition, s_brackets } from "../Brackets/BracketDefinitions";
import { BracketStructureBuilder } from "../Brackets/BracketStructureBuilder";

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
    get Field(): string;
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

    // getters
    get BracketGameDefinition(): GameDefinition { return this.m_bracketGameDefinition; }
    get SwapTopBottom(): boolean { return this.m_swapTopBottom; }
    get BracketName(): string { return this.m_bracketName;  }
    get GameNum(): number { return this.m_gameNum; }
    get TopTeamName(): string
    {
        return this.m_teamNameTop == null ? this.BracketGameDefinition.topSource : this.m_teamNameTop;
    }
    get BottomTeamName(): string
    {
        return this.m_teamNameBottom == null ? this.BracketGameDefinition.bottomSource : this.m_teamNameBottom;
    }
    get StartTime(): number { return this.m_startTime; }

    FormatTime(): string
    {
        let hours: number = Math.floor(this.m_startTime / 60);
        const mins: number = this.m_startTime - hours * 60;
        const ampm: string = hours >= 12 ? "PM" : "AM";

        hours = hours >= 12 ? hours - 12 : hours;

        return `${hours}:${mins < 10 ? "0" : ""}${mins} ${ampm}`;
    }

    FormatLoser(): string
    {
        if (this.m_bracketGameDefinition.loser == "")
            return "";
        else
            return `Loser to ${this.m_bracketGameDefinition.loser}`;
    }

    get Field(): string { return this.m_field; }

    /*----------------------------------------------------------------------------
        %%Function: BracketGame.Load

        Load the static portions of this game, and if possible, load its linkage
        into the current bracket schedule
    ----------------------------------------------------------------------------*/
    async Load(ctx: any, bracketName: string, gameNum: number): Promise<IBracketGame>
    {
        let bracketDefinition: BracketDefinition = BracketStructureBuilder.getBracketDefinition(`${bracketName}Bracket`);

        this.m_gameNum = gameNum;
        this.m_bracketName = bracketName;

        this.m_bracketGameDefinition = bracketDefinition.games[gameNum];
        this.m_swapTopBottom = false;
        this.m_teamNameTop = null;
        this.m_teamNameBottom = null;
        this.m_startTime = 18 * 60;
        this.m_field = "Field #1";

        // if we don't have a context, then we aren't async and we aren't going to fetch anything from the sheet
        if (ctx == null)
            return this;

        return this;
    }
}