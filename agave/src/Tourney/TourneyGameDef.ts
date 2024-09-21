import { TimeWithoutDate } from "../Support/TimeWithoutDate";
import { TourneyField } from "./TourneyField";
import { GameId } from "../BracketEditor/GameId";
import { TourneyFieldSlot } from "./TourneyFieldSlot";
import { DateWithoutTime } from "../Support/DateWithoutTime";
import { GameNum } from "../BracketEditor/GameNum";

export class TourneyGameDef
{
    private m_gameNum: GameNum;
    private m_date: DateWithoutTime;
    private m_slot: TourneyFieldSlot;

    get GameNum(): GameNum
    {
        return this.m_gameNum;
    }

    get GameDate(): DateWithoutTime
    {
        return this.m_date;
    }

    get Field(): TourneyField
    {
        return this.m_slot.Field;
    }

    get Slot(): TourneyFieldSlot
    {
        return this.m_slot;
    }

    get DateTimeNumber(): number
    {
        return this.m_date.GetDateWithTime(this.m_slot.Start).getTime();
    }

    /*----------------------------------------------------------------------------
        %%Function: TourneyGameDef.Create
    ----------------------------------------------------------------------------*/
    static Create(gameNum: GameNum, date: DateWithoutTime, slot: TourneyFieldSlot): TourneyGameDef
    {
        const game = new TourneyGameDef();

        game.m_gameNum = gameNum;
        game.m_date = date;
        game.m_slot = slot;

        return game;
    }

    /*----------------------------------------------------------------------------
        %%Function: TourneyGameDef.Clone
    ----------------------------------------------------------------------------*/
    Clone(): TourneyGameDef
    {
        return TourneyGameDef.Create(this.GameNum, DateWithoutTime.CreateForDateWithoutTime(this.GameDate), this.m_slot.Clone());
    }
}