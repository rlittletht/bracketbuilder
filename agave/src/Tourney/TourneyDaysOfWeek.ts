import { TourneyDaysOfWeekIterator } from "./TourneyDaysOfWeekIterator";

export class TourneyDaysOfWeek implements Iterable<number>
{
    static Days: string[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

    private m_days: number = 0;

    get Value(): number
    {
        return this.m_days;
    }

    /*----------------------------------------------------------------------------
        %%Function: TourneyDaysOfWeek.Create
    ----------------------------------------------------------------------------*/
    static Create(): TourneyDaysOfWeek
    {
        return new TourneyDaysOfWeek();
    }

    /*----------------------------------------------------------------------------
        %%Function: TourneyDaysOfWeek.GetDayFromDayOfWeek
    ----------------------------------------------------------------------------*/
    static GetDayFromDayOfWeek(dayOfWeek: number): string
    {
        return this.Days[dayOfWeek];
    }

    /*----------------------------------------------------------------------------
        %%Function: TourneyDaysOfWeek.Add
    ----------------------------------------------------------------------------*/
    Add(dayOfWeek: number): TourneyDaysOfWeek
    {
        this.m_days = this.m_days | Math.pow(2, dayOfWeek);
        return this;
    }

    /*----------------------------------------------------------------------------
        %%Function: TourneyDaysOfWeek.AddDays

        Add the set of days of week to this set of days of week (just or them
        together)
    ----------------------------------------------------------------------------*/
    AddDays(days: TourneyDaysOfWeek)
    {
        this.m_days |= days.m_days;
    }

    /*----------------------------------------------------------------------------
        %%Function: TourneyDaysOfWeek.Has
    ----------------------------------------------------------------------------*/
    Has(dayOfWeek: number): boolean
    {
        return (this.m_days & Math.pow(2, dayOfWeek)) !== 0;
    }

    /*----------------------------------------------------------------------------
        %%Function: TourneyDaysOfWeek.Count

        Get the number of days set
    ----------------------------------------------------------------------------*/
    Count(): number
    {
        let count = 0;
        let remaining = this.m_days;

        while (remaining != 0)
        {
            count++;
            remaining &= (remaining - 1);
        }

        return count;
    }

    /*----------------------------------------------------------------------------
        %%Function: TourneyDaysOfWeek.DaysSet
    ----------------------------------------------------------------------------*/
    DaysSet(): string[]
    {
        const days: string[] = [];
        let day = 0;
        let daysLeft: number = this.m_days;

        while (daysLeft != 0)
        {
            if ((daysLeft & 0x01) == 0x01)
                days.push(TourneyDaysOfWeek.GetDayFromDayOfWeek(day));

            daysLeft >>= 1;
            day++;
        }

        return days;
    }

    [Symbol.iterator]()
    {
        return new TourneyDaysOfWeekIterator(this);
    }
}