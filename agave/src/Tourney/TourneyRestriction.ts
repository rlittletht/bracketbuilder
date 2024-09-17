import { DateWithoutTime } from "epoq";
import { TourneyDaysOfWeek } from "./TourneyDaysOfWeek";
import { TourneyField } from "./TourneyField";
import { TimeWithoutDate } from "../Support/TimeWithoutDate";

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

    /*----------------------------------------------------------------------------
        %%Function: TourneyRestriction.CreateForFieldDays
    ----------------------------------------------------------------------------*/
    static CreateForFieldDays(field: TourneyField, daysOfWeek: TourneyDaysOfWeek, earliest?: TimeWithoutDate, latestStart?: TimeWithoutDate): TourneyRestriction
    {
        const restriction: TourneyRestriction = new TourneyRestriction();

        restriction.m_daysOfWeek = daysOfWeek;
        restriction.m_fields = [field];
        restriction.m_earliestStart = earliest;
        restriction.m_latestStart = latestStart;

        return restriction;
    }

    get EarliestStart(): TimeWithoutDate
    {
        return this.m_earliestStart;
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
            if (this.m_date.getDate() != date.utcMidnightDateObj.getTime())
                // this restriction doesn't refer to this date
                return false;
        }

        // see if the days-of-week apply...
        if (this.m_daysOfWeek != null)
        {
            if (!this.m_daysOfWeek.Has(date.getDay()))
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
        return this.IsAllowed(field, new DateWithoutTime(dateTime), TimeWithoutDate.CreateForDate(dateTime));
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