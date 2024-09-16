import { DateWithoutTime } from "epoq";
import { GameNum } from "../BracketEditor/GameNum";
import { TimeWithoutDate } from "../Support/TimeWithoutDate";
import { TourneyField } from "./TourneyField";

export class TourneyGameDef
{
    private m_gameNum: GameNum;
    private m_date: DateWithoutTime;
    private m_time: TimeWithoutDate;
    private m_field: TourneyField;

    /*----------------------------------------------------------------------------
        %%Function: TourneyGameDef.Create
    ----------------------------------------------------------------------------*/
    static Create(gameNum: GameNum, field: TourneyField, date: DateWithoutTime, time: TimeWithoutDate): TourneyGameDef
    {
        const game = new TourneyGameDef();

        game.m_gameNum = gameNum;
        game.m_date = date;
        game.m_time = time;
        game.m_field = field;

        return game;
    }
}