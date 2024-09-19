import { TimeWithoutDate } from "./TimeWithoutDate";

export class DateWithoutTime
{
    private m_utcDateNoTime: Date;

    constructor(msecTotal?: number)
    {
        this.m_utcDateNoTime = new Date();

        if (msecTotal !== undefined)
            this.m_utcDateNoTime.setTime(msecTotal);
    }

    static CreateForDateString(dateString: string)
    {
        const time = Date.parse(dateString);

        return this.CreateForDateType(new Date(time));
    }

    static CreateForDateType(date: Date): DateWithoutTime
    {
        return this.CreateForDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    }

    static CreateForDate(year: number, month: number, date: number): DateWithoutTime
    {
        const time = Date.parse(`${year}-${month + 1}-${date} 00:00:00 GMT`);

        return new DateWithoutTime(time);
    }

    static CreateForEpochDays(days: number)
    {
        return new DateWithoutTime(days * 86_400_000);
    }

    GetDateWithTime(time: TimeWithoutDate): Date
    {
        return new Date(this.m_utcDateNoTime.getTime() + time.Value);
    }

    GetDay(): number
    {
        return this.m_utcDateNoTime.getUTCDay();
    }

    GetFullYear(): number
    {
        return this.m_utcDateNoTime.getUTCFullYear();
    }

    GetDaysSinceEpoch(): number
    {
        return this.m_utcDateNoTime.getTime() / 86_400_000;
    }

    SetDaysSinceEpoch(days: number)
    {
        this.m_utcDateNoTime.setTime(days * 86_400_000);
    }

    AddDays(days: number)
    {
        this.SetDaysSinceEpoch(this.GetDaysSinceEpoch() + days);
    }

    static Compare(left: DateWithoutTime, right: DateWithoutTime): number
    {
        return left.GetDaysSinceEpoch() - right.GetDaysSinceEpoch();
    }

    CompareTo(other: DateWithoutTime): number
    {
        return DateWithoutTime.Compare(this, other);
    }

    Equals(other: DateWithoutTime): boolean
    {
        return this.CompareTo(other) == 0;
    }
}