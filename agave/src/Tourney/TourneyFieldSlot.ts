import { TimeWithoutDate } from "../Support/TimeWithoutDate";
import { TourneyField } from "./TourneyField";

export class TourneyFieldSlot
{
    private m_time: TimeWithoutDate;
    private m_field: TourneyField;

    constructor(time: TimeWithoutDate, field: TourneyField)
    {
        this.m_time = time;
        this.m_field = field;
    }

    get TimeKey(): number
    {
        return this.m_time.Value;
    }

    get Field(): TourneyField
    {
        return this.m_field;
    }

    get Start(): TimeWithoutDate
    {
        return this.m_time;
    }

    get End(): TimeWithoutDate
    {
        const slotLength = this.m_field.SlotLength; // in minutes

        return new TimeWithoutDate(this.m_time.Value + slotLength * TimeWithoutDate.s_msecPerMinute);
    }
}