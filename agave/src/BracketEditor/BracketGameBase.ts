import { IBracketGame } from "./IBracketGame";
import { IBracketGameDefinition } from "../Brackets/IBracketGameDefinition";
import { GameNum } from "./GameNum";
import { GlobalDataBuilder } from "../Brackets/GlobalDataBuilder";
import { RangeInfo, Ranges } from "../Interop/Ranges";
import { GameId } from "./GameId";
import { AppContext, IAppContext } from "../AppContext/AppContext";
import { BracketGame } from "./BracketGame";
import { JsCtx } from "../Interop/JsCtx";
import { BracketManager, _bracketManager } from "../Brackets/BracketManager";
import { _TimerStack } from "../PerfTimer";
import { RangeCaches, RangeCacheItemType } from "../Interop/RangeCaches";
import { FastFormulaAreas } from "../Interop/FastFormulaAreas/FastFormulaAreas";
import { GameDataSources } from "../Brackets/GameDataSources";
import { ObjectType } from "../Interop/TrackingCache";
import { FastFormulaAreasItems } from "../Interop/FastFormulaAreas/FastFormulaAreasItems";
import { OADate } from "../Interop/Dates";
import { StructureRemove } from "./StructureEditor/StructureRemove";

export class BracketGameBase
{
    m_bracketGameDefinition: IBracketGameDefinition;
    m_swapTopBottom: boolean;
    m_bracketName: string;
    m_gameNum: GameNum;
    m_startTime: number = GlobalDataBuilder.DefaultStartTime;
    m_field: string = GlobalDataBuilder.DefaultField;
    m_topTeamLocation: RangeInfo;
    m_bottomTeamLocation: RangeInfo;
    m_gameNumberLocation: RangeInfo;
    m_isIfNecessaryGame: boolean;

    m_topTeamOverride: string;
    m_bottomTeamOverride: string;
    m_fieldOverride: string;
    m_timeOverride: number;
    m_topTeamNameValue: string;
    m_bottomTeamNameValue: string;

    SetStartTime(time: number)
    {
        this.m_startTime = time;
    }

    SetField(field: string)
    {
        this.m_field = field;
    }

    get IsChampionship(): boolean
    {
        return (!this.m_bracketGameDefinition.loser
            || this.m_bracketGameDefinition.loser == "")
            && (!this.m_bracketGameDefinition.winner
                || this.m_bracketGameDefinition.winner == "");
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

    get TopTeamOverride(): string {return this.m_topTeamOverride}
    get TopTeamNameValue(): string { return this.m_topTeamNameValue }

    get BottomTeamOverride(): string {return this.m_bottomTeamOverride}
    get BottomTeamNameValue(): string { return this.m_bottomTeamNameValue }

    get FieldOverride(): string {return this.m_fieldOverride}
    get TimeOverride(): number {return this.m_timeOverride}

    // getters
    get BracketGameDefinition(): IBracketGameDefinition {return this.m_bracketGameDefinition;}
    get SwapTopBottom(): boolean {return this.m_swapTopBottom;}
    get BracketName(): string {return this.m_bracketName;}
    get GameId(): GameId {return this.m_gameNum.GameId;}
    get GameNum(): GameNum {return this.m_gameNum;}

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
        return this.BracketGameDefinition.topSource;
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
        return this.BracketGameDefinition.bottomSource;
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
    get StartTime(): number {return this.m_startTime;}

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
    get Field(): string {return this.m_field;}

    /*----------------------------------------------------------------------------
        %%Function: BracketGame.Unbind
    ----------------------------------------------------------------------------*/
    Unbind()
    {
        this.m_bottomTeamLocation = null
        this.m_topTeamLocation = null;
        this.m_gameNumberLocation = null;
    }

    /*----------------------------------------------------------------------------
        %%Function: BracketGame.LoadSync

        Load the static portions of this game, and if possible, load its linkage
        into the current bracket schedule
    ----------------------------------------------------------------------------*/
    LoadSync(bracketChoice: string, gameNum: GameNum)
    {
        AppContext.checkpoint("l.1");

        const bracketDefinition = _bracketManager.GetBracketDefinitionData(bracketChoice);

        if (!bracketDefinition)
            throw new Error("bracket not cached in LoadSync");

        AppContext.checkpoint("l.2");
        this.m_gameNum = gameNum;
        this.m_bracketName = bracketChoice;

        this.m_bracketGameDefinition = bracketDefinition.games[gameNum.Value];
        this.m_swapTopBottom = false;
        this.m_startTime = 18 * 60;
        this.m_field = "Field #1";

        AppContext.checkpoint("l.3");
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