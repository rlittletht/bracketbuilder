
export class TourneyDaysOfWeek
{
    static Days: string[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

    private m_days: number = 0;

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
        %%Function: TourneyDaysOfWeek.Has
    ----------------------------------------------------------------------------*/
    Has(dayOfWeek: number): boolean
    {
        return (this.m_days & Math.pow(2, dayOfWeek)) !== 0;
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
}