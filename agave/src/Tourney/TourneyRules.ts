
import { DateWithoutTime } from "epoq";
import { TourneyField } from "./TourneyField";
import { TourneyRestriction } from "./TourneyRestriction";
import { TourneyDaysOfWeek } from "./TourneyDaysOfWeek";
import { TimeWithoutDate } from "../Support/TimeWithoutDate";

export class TourneyRules
{
    m_fields: TourneyField[] = [];
    m_startDate: DateWithoutTime;
    m_restrictions: TourneyRestriction[] = [];

    static Create(): TourneyRules
    {
        return new TourneyRules();
    }

    /*----------------------------------------------------------------------------
        %%Function: TourneyRules.AddField

        Add a field to the rules, return this so it can be chained
    ----------------------------------------------------------------------------*/
    AddField(name: string, hasLights: boolean): TourneyRules
    {
        this.m_fields.push(new TourneyField(name, hasLights));
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
                field.HasLights ? TimeWithoutDate.CreateForTime(6) : TimeWithoutDate.CreateForTime(8);

            // saturday restriction, 9am to latest
            this.m_restrictions.push(
                TourneyRestriction.CreateForFieldDays(
                    field,
                    TourneyDaysOfWeek.Create().Add(0),
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
    DoesProposalViolateRestrictions(field: string, date: DateWithoutTime, time: TimeWithoutDate)
    {
        for (const restriction of this.m_restrictions)
        {
            if (!restriction.IsAllowed(field, date, time))
                return false;
        }

        return true;
    }
}