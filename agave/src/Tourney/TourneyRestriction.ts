import { TourneyDaysOfWeek } from "./TourneyDaysOfWeek";
import { TourneyField } from "./TourneyField";
import { TimeWithoutDate } from "../Support/TimeWithoutDate";
import { DateWithoutTime } from "../Support/DateWithoutTime";

/*----------------------------------------------------------------------------
    %%Class: TourneyRestriction.TourneyRestriction

    This defines restrictions for a tournament

    For example, to make a field unavailable on Mondays, set the field,
    the day of week, and then set latestStart to be earlier than
    earliestStart (which no start time is valid...)
----------------------------------------------------------------------------*/
export class TourneyRestriction
{
    private m_fields?: TourneyField[];

    // the date this restriction applies to. if null, this applies to all dates
    private m_date?: DateWithoutTime;

    // what days of the week does this restriction apply to
    private m_daysOfWeek?: TourneyDaysOfWeek;

    private m_earliestStart?: TimeWithoutDate;
    private m_latestStart?: TimeWithoutDate;

    get Fields(): TourneyField[] | null
    {
        return this.m_fields;
    }

    get Earliest(): TimeWithoutDate | null
    {
        return this.m_earliestStart;
    }

    get Latest(): TimeWithoutDate | null
    {
        return this.m_latestStart;
    }

    get Days(): TourneyDaysOfWeek | null
    {
        return this.m_daysOfWeek;
    }

    /*----------------------------------------------------------------------------
        %%Function: TourneyRestriction.CreateForFieldDays
    ----------------------------------------------------------------------------*/
    static CreateForFieldDays(fields: TourneyField[], daysOfWeek: TourneyDaysOfWeek, earliest?: TimeWithoutDate, latestStart?: TimeWithoutDate): TourneyRestriction
    {
        const restriction: TourneyRestriction = new TourneyRestriction();

        restriction.m_daysOfWeek = daysOfWeek;
        restriction.m_fields = [...fields];
        restriction.m_earliestStart = earliest;
        restriction.m_latestStart = latestStart;

        return restriction;
    }

    set EarliestStart(value: TimeWithoutDate)
    {
        this.m_earliestStart = value;
    }

    get EarliestStart(): TimeWithoutDate
    {
        return this.m_earliestStart;
    }

    set LatestStart(value: TimeWithoutDate)
    {
        this.m_latestStart = value;
    }

    get LatestStart(): TimeWithoutDate
    {
        return this.m_latestStart;
    }

    /*----------------------------------------------------------------------------
        %%Function: TourneyRestriction.MatchRestrictionFieldDay

        Return true if this restriction applies specifically to this
        field and dayOfWeek
    ----------------------------------------------------------------------------*/
    MatchRestrictionFieldDay(field: TourneyField, days: TourneyDaysOfWeek)
    {
        if (this.m_fields.length != 1)
            return false;

        if (this.m_fields[0].Name != field.Name)
            return false;

        return days.Value == this.m_daysOfWeek.Value;
    }

    /*----------------------------------------------------------------------------
        %%Function: TourneyRestriction.MatchRestriction

        check if these earliest and latest restrictions match
    ----------------------------------------------------------------------------*/
    MatchRestriction(earliest?: TimeWithoutDate, latest?: TimeWithoutDate): boolean
    {
        if (!earliest !== !this.m_earliestStart)
            return false;

        if (earliest)
        {
            if (!earliest.Equals(this.m_earliestStart))
                return false;
        }

        if (!latest !== !this.m_latestStart)
            return false;

        if (latest)
        {
            if (!latest.Equals(this.m_latestStart))
                return false;
        }

        return true;
    }

    /*----------------------------------------------------------------------------
        %%Function: TourneyRestriction.AddDays

        The given days to the set of days this applies to
    ----------------------------------------------------------------------------*/
    AddDays(days: TourneyDaysOfWeek)
    {
        this.m_daysOfWeek.AddDays(days);
    }

    /*----------------------------------------------------------------------------
        %%Function: TourneyRestriction.AppliesToField
    ----------------------------------------------------------------------------*/
    AppliesToFieldDate(field: TourneyField, date?: DateWithoutTime): boolean
    {
        if (this.m_fields != null)
        {
            let fieldMatch: boolean = false;

            for (const _field of this.m_fields)
            {
                if (_field.Name === field.Name)
                {
                    fieldMatch = true;
                    break;
                }
            }

            // if this restriction is limited to a set of fields and we aren't
            // in that set, this doesn't apply to us
            if (fieldMatch == false)
                return false;
        }

        // they don't care about date...we match
        if (date === null || date === undefined)
            return true;

        // if no fields list, check date
        if (this.m_date != null)
        {
            if (!this.m_date.Equals(date))
            // this restriction doesn't refer to this date
                return false;
        }

        // see if the days-of-week apply...
        if (this.m_daysOfWeek != null)
        {
            if (!this.m_daysOfWeek.Has(date.GetDay()))
            // doesn't apply to us
                return false;
        }

        // else, this applies to us
        return true;
    }

    /*----------------------------------------------------------------------------
        %%Function: TourneyRestriction.IsAllowedDateTime

        same as IsAllowed but takes a combined Date (Date/Time together)
    ----------------------------------------------------------------------------*/
    IsAllowedDateTime(field: TourneyField, dateTime: Date): boolean
    {
        return this.IsAllowed(field, DateWithoutTime.CreateForDateType(dateTime), TimeWithoutDate.CreateForDate(dateTime));
    }

    /*----------------------------------------------------------------------------
        %%Function: TourneyRestriction.IsAllowed

        Is this field/date/time not allowed per this restriction?
    ----------------------------------------------------------------------------*/
    IsAllowed(field: TourneyField, date: DateWithoutTime, time: TimeWithoutDate): boolean
    {
        if (!this.AppliesToFieldDate(field, date))
            return true;

        // now lets check the restriction
        if (this.m_earliestStart != null)
        {
            if (time.CompareTo(this.m_earliestStart!) < 0)
                return false;
        }

        if (this.m_latestStart != null)
        {
            if (time.CompareTo(this.m_latestStart) > 0)
                return false;
        }

        // if we got here, then we're OK
        return true;
    }
}