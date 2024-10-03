import { TourneyDaysOfWeek } from "./TourneyDaysOfWeek";

export class TourneyDaysOfWeekIterator implements Iterator<number>
{
    private m_remain: number = 0;
    private m_currentDay: number = 0;

    constructor(days: TourneyDaysOfWeek)
    {
        this.m_remain = days.Value;
    }

    next(): IteratorResult<number>
    {
        if (this.m_remain != 0)
        {
            while ((this.m_remain & 0x01) == 0)
            {
                this.m_currentDay++;
                this.m_remain >>= 1;
            }

            this.m_remain >>= 1;
            return { value: this.m_currentDay++, done: false };
        }
        else
        {
            return { value: null, done: true };
        }
    }
}
