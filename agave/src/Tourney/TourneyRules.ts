
import { DateWithoutTime } from "epoq";
import { TourneyField } from "./TourneyField";
import { TourneyRestriction } from "./TourneyRestriction";
import { TourneyDaysOfWeek } from "./TourneyDaysOfWeek";
import { TimeWithoutDate } from "../Support/TimeWithoutDate";
import { TourneyFieldSlot } from "./TourneyFieldSlot";

export class TourneyRules
{
    private m_fields: TourneyField[] = [];
    private m_startDate: DateWithoutTime;
    private m_restrictions: TourneyRestriction[] = [];

    static Create(): TourneyRules
    {
        return new TourneyRules();
    }

    get StartDate(): DateWithoutTime
    {
        return this.m_startDate;
    }

    get Fields(): TourneyField[]
    {
        return this.m_fields;
    }

    /*----------------------------------------------------------------------------
        %%Function: TourneyRules.AddField

        Add a field to the rules, return this so it can be chained
    ----------------------------------------------------------------------------*/
    AddField(name: string, hasLights: boolean, slotLength: number): TourneyRules
    {
        this.m_fields.push(new TourneyField(name, hasLights, slotLength));
        return this;
    }

    /*----------------------------------------------------------------------------
        %%Function: TourneyRules.AddTourneyField
    ----------------------------------------------------------------------------*/
    AddTourneyField(field: TourneyField): TourneyRules
    {
        this.m_fields.push(field);
        return this;
    }

    /*----------------------------------------------------------------------------
        %%Function: TourneyRules.AddRestriction
    ----------------------------------------------------------------------------*/
    AddRestriction(restriction: TourneyRestriction): TourneyRules
    {
        this.m_restrictions.push(restriction);
        return this;
    }

    /*----------------------------------------------------------------------------
        %%Function: TourneyRules.AddDefaultFieldRestrictions

        Add all the default field restrictions.

        If the field has lights then the latest start time is 8pm.
    ----------------------------------------------------------------------------*/
    AddDefaultFieldRestrictions(earliestWeekdayStart?: TimeWithoutDate): TourneyRules
    {
        for (const field of this.m_fields)
        {
            const timeLatestStart =
                field.HasLights ? TimeWithoutDate.CreateForTime(20) : TimeWithoutDate.CreateForTime(18);

            // saturday restriction, 9am to latest
            this.m_restrictions.push(
                TourneyRestriction.CreateForFieldDays(
                    field,
                    TourneyDaysOfWeek.Create().Add(6),
                    TimeWithoutDate.CreateForTime(9),
                    timeLatestStart));

            // sunday restriction, 10am to latest
            this.m_restrictions.push(
                TourneyRestriction.CreateForFieldDays(
                    field,
                    TourneyDaysOfWeek.Create().Add(0),
                    TimeWithoutDate.CreateForTime(10),
                    timeLatestStart));

            // weekday restriction
            this.m_restrictions.push(
                TourneyRestriction.CreateForFieldDays(
                    field,
                    TourneyDaysOfWeek.Create().Add(1).Add(2).Add(3).Add(4).Add(5),
                    earliestWeekdayStart ?? TimeWithoutDate.CreateForTime(18),
                    timeLatestStart));
        }

        return this;
    }

    /*----------------------------------------------------------------------------
        %%Function: TourneyRules.DoesProposalViolateRestrictions
    ----------------------------------------------------------------------------*/
    DoesProposalViolateRestrictions(field: TourneyField, date: DateWithoutTime, time: TimeWithoutDate)
    {
        for (const restriction of this.m_restrictions)
        {
            if (!restriction.IsAllowed(field, date, time))
                return true;
        }

        return false;
    }

    /*----------------------------------------------------------------------------
        %%Function: TourneyRules.EnumerateRestrictions

        Enumerate all the restrictions, if matchFun() is true, then call
        fun(). if fun() returns false, then abort. return true if we enumerated
        all, else false (if we abort)
    ----------------------------------------------------------------------------*/
    EnumerateRestrictions(matchFun: (restriction: TourneyRestriction) => boolean, fun: (restriction: TourneyRestriction) => boolean): boolean
    {
        for (const restriction of this.m_restrictions)
        {
            if (matchFun(restriction))
            {
                if (!fun(restriction))
                    return false;
            }
        }

        return true;
    }

    /*----------------------------------------------------------------------------
        %%Function: TourneyRules.EnumerateFieldRestrictions
    ----------------------------------------------------------------------------*/
    EnumerateFieldDateRestrictions(field: TourneyField, date: DateWithoutTime, fun: (restriction: TourneyRestriction) => boolean): boolean
    {
        return this.EnumerateRestrictions(
            (restriction: TourneyRestriction): boolean => 
            {
                return restriction.AppliesToFieldDate(field, date);
            },
            fun);
    }

    /*----------------------------------------------------------------------------
        %%Function: TourneyRules.GetFirstSlotForFieldDate

        Get the first allowed slow for this date for this field
    ----------------------------------------------------------------------------*/
    GetFirstSlotForFieldDateAfterTime(field: TourneyField, date: DateWithoutTime, time?: TimeWithoutDate): TourneyFieldSlot
    {
        // no game starts before 8am even if there are no rules
        let start: TimeWithoutDate = time ?? TimeWithoutDate.CreateForTime(8);

        this.EnumerateFieldDateRestrictions(field, date, (restriction) =>
        {
            if (restriction.EarliestStart != null)
            {
                // if the restriction is later than the current start, then set it to
                // the restriction
                if (start.CompareTo(restriction.EarliestStart) < 0)
                    start = restriction.EarliestStart;
            }

            return true;
        });

        return new TourneyFieldSlot(start, field);
    }
}