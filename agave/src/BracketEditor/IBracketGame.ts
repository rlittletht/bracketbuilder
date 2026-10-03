import { IBracketGameDefinition } from "../Brackets/IBracketGameDefinition";
import { GameId } from "./GameId";
import { GameNum } from "./GameNum";
import { JsCtx } from "../Interop/JsCtx";
import { IAppContext } from "../AppContext/AppContext";
import { RangeInfo } from "../Interop/Ranges";

export interface IBracketGame
{
    // these are the static definitions
    BracketGameDefinition: IBracketGameDefinition;
    SwapTopBottom: boolean;
    BracketName: string; // "T2" for 2 team bracket, etc. Can derive table name from it
    GameId: GameId; // this is the game id (1 based) in the overall static bracket definition
    GameNum: GameNum;

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

    TopTeamName: string; // if this is the first game, this is the team name
    BottomTeamName: string; // if this is the bottom game, this is the team name
    StartTime: number; // this is the number of minutes since the start of the day
    IsChampionship: boolean;
    IsIfNecessaryGame: boolean; // this is true if this game is the 'what-if' game before the championship
    WinningTeamAdvancesToGameId: GameId;
    NeedsDataPull: boolean; // has this game been manually edited? (and thus needs repair?
    IsBroken: boolean; // is this game broken (and needs to be deleted)

    FormatTime(): string;
    FormatLoser(): string;
    Bind(context: JsCtx, appContext: IAppContext): Promise<IBracketGame>;
    Unbind();
    SetSwapTopBottom(swapped: boolean);
    SetStartTime(time: number);
    SetField(field: string);

    Field: string;

    TopTeamCellName: string;
    BottomTeamCellName: string;
    GameNumberCellName: string;
    IsLinkedToBracket: boolean;
    FullGameRange: RangeInfo;
    TopTeamRange: RangeInfo;
    BottomTeamRange: RangeInfo;
    GameIdRange: RangeInfo;
    TopSource: string;
    BottomSource: string;
    TopTeamOverride: string;
    TopTeamNameValue: string;
    BottomTeamNameValue: string;
    BottomTeamOverride: string;
    FieldOverride: string;
    TimeOverride: number;
}
