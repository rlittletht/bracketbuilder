import { DateWithoutTime } from "epoq";
import { TimeWithoutDate } from "../Support/TimeWithoutDate";
import { TourneyField } from "./TourneyField";
import { GameId } from "../BracketEditor/GameId";
import { TourneyFieldSlot } from "./TourneyFieldSlot";

export class TourneyGameDef
{
    private m_gameId: GameId;
    private m_date: DateWithoutTime;
    private m_slot: TourneyFieldSlot;

    get Id(): GameId
    {
        return this.m_gameId;
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

    /*----------------------------------------------------------------------------
        %%Function: TourneyGameDef.Create
    ----------------------------------------------------------------------------*/
    static Create(gameId: GameId, date: DateWithoutTime, slot: TourneyFieldSlot): TourneyGameDef
    {
        const game = new TourneyGameDef();

        game.m_gameId = gameId;
        game.m_date = date;
        game.m_slot = slot;

        return game;
    }
}