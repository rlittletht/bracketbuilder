
export class TimeWithoutDate
{
    private m_utcTimeNoDate: Date;

    static s_msecPerSecond = 1000;
    static s_msecPerMinute = TimeWithoutDate.s_msecPerSecond * 60;
    static s_msecPerHour = TimeWithoutDate.s_msecPerMinute * 60;
    static s_msecPerDay = TimeWithoutDate.s_msecPerHour * 24;

    constructor(msecTotal: number | undefined)
    {
        this.m_utcTimeNoDate = new Date();

        if (msecTotal !== undefined)
            this.m_utcTimeNoDate.setTime(msecTotal % TimeWithoutDate.s_msecPerDay);
    }


    get Value(): number
    {
        return this.m_utcTimeNoDate.getTime();
    }

    get Hours(): number
    {
        return this.m_utcTimeNoDate.getUTCHours();
    }

    /*----------------------------------------------------------------------------
        %%Function: TimeWithoutDate.CreateForTimeWithoutDate
    ----------------------------------------------------------------------------*/
    static CreateForTimeWithoutDate(time: TimeWithoutDate): TimeWithoutDate
    {
        return new TimeWithoutDate(time.m_utcTimeNoDate.getTime());
    }

    /*----------------------------------------------------------------------------
        %%Function: TimeWithoutDate.CreateForDate
    ----------------------------------------------------------------------------*/
    static CreateForDate(date: Date): TimeWithoutDate
    {
        // we're going to assume we have the right time regardless of timezone...now
        // create a utc date with that same hour/minute/second...

        return new TimeWithoutDate(
            date.getHours() * this.s_msecPerHour
            + date.getMinutes() * this.s_msecPerMinute
            + date.getSeconds() * this.s_msecPerSecond
            + date.getMilliseconds());
    }

    /*----------------------------------------------------------------------------
        %%Function: TimeWithoutDate.CreateForTime
    ----------------------------------------------------------------------------*/
    static CreateForTime(hours: number, minutes?: number, seconds?: number, milliseconds?: number): TimeWithoutDate
    {
        hours *= this.s_msecPerHour;
        minutes = (minutes ?? 0) * this.s_msecPerMinute;
        seconds = (seconds ?? 0) * this.s_msecPerSecond;
        milliseconds = milliseconds ?? 0;

        return new TimeWithoutDate(hours + minutes + seconds + milliseconds);
    }

    /*----------------------------------------------------------------------------
        %%Function: TimeWithoutDate.CreateForMinutes
    ----------------------------------------------------------------------------*/
    static CreateForMinutesSinceMidnight(minutes: number): TimeWithoutDate
    {
        minutes *= this.s_msecPerMinute;

        return new TimeWithoutDate(minutes);
    }

    /*----------------------------------------------------------------------------
        %%Function: TimeWithoutDate.CreateForTimeString
    ----------------------------------------------------------------------------*/
    static CreateForTimeString(time: string)
    {
        const dateTime = `01 Jan 1970 ${time}`;

        return this.CreateForDate(new Date(Date.parse(dateTime)));
    }

    /*----------------------------------------------------------------------------
        %%Function: TimeWithoutDate.Compare
    ----------------------------------------------------------------------------*/
    static Compare(left: TimeWithoutDate, right: TimeWithoutDate): number
    {
        return left.m_utcTimeNoDate.getTime() - right.m_utcTimeNoDate.getTime();
    }


    /*----------------------------------------------------------------------------
        %%Function: TimeWithoutDate.CompareTo
    ----------------------------------------------------------------------------*/
    CompareTo(other: TimeWithoutDate): number
    {
        return this.m_utcTimeNoDate.getTime() - other.m_utcTimeNoDate.getTime();
    }


    /*----------------------------------------------------------------------------
        %%Function: TimeWithoutDate.Equals
    ----------------------------------------------------------------------------*/
    Equals(other: TimeWithoutDate): boolean
    {
        return this.CompareTo(other) == 0;
    }

    /*----------------------------------------------------------------------------
        %%Function: TimeWithoutDate.GetMinutesSinceMidnight
    ----------------------------------------------------------------------------*/
    GetMinutesSinceMidnight(): number
    {
        return this.m_utcTimeNoDate.getUTCHours() * 60 + this.m_utcTimeNoDate.getUTCMinutes();
    }
}