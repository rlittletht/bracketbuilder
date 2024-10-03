import { TourneyField } from "./TourneyField";
import { TourneyRestriction } from "./TourneyRestriction";
import { TourneyDaysOfWeek } from "./TourneyDaysOfWeek";
import { TimeWithoutDate } from "../Support/TimeWithoutDate";
import { TourneyFieldSlot } from "./TourneyFieldSlot";
import { DateWithoutTime } from "../Support/DateWithoutTime";
import { JsCtx } from "../Interop/JsCtx";
import { RangeCaches, RangeCacheItemType } from "../Interop/RangeCaches";
import { TableIO } from "../Interop/TableIO";
import { OADate } from "../Interop/Dates";

export class TourneyRules
{
    private m_fields: TourneyField[] = [];
    private m_startDate: DateWithoutTime;
    private m_restrictions: TourneyRestriction[] = [];

    static Create(): TourneyRules
    {
        return new TourneyRules();
    }

    static s_daySuffixMaps = new Map<string, TourneyDaysOfWeek>(
        [
            ["Saturday", TourneyDaysOfWeek.Create().Add(6)],
            ["Sunday", TourneyDaysOfWeek.Create().Add(0)],
            ["Monday", TourneyDaysOfWeek.Create().Add(1)],
            ["Tuesday", TourneyDaysOfWeek.Create().Add(2)],
            ["Wednesday", TourneyDaysOfWeek.Create().Add(3)],
            ["Thursday", TourneyDaysOfWeek.Create().Add(4)],
            ["Friday", TourneyDaysOfWeek.Create().Add(5)],
            ["Weekday", TourneyDaysOfWeek.Create().Add(1).Add(2).Add(3).Add(4).Add(5)],
            ["Weekend", TourneyDaysOfWeek.Create().Add(0).Add(6)]
        ]);


    ReadFieldRulesTable(context: JsCtx): any[]
    {
        const { range: fieldRulesBodyRange, values: fieldRulesBodyValues } = RangeCaches.getDataRangeAndValuesFromRangeCacheType(context, RangeCacheItemType.FieldRulesBody);
        const { range: fieldRulesHeaderRange, values: fieldRulesHeaderValues } = RangeCaches.getDataRangeAndValuesFromRangeCacheType(context, RangeCacheItemType.FieldRulesHeader);

        const fieldRules = TableIO.readDataFromCachedExcelTable(
            "FieldRules",
            fieldRulesHeaderValues,
            fieldRulesBodyValues,
            [
                "Field", "Has Lights", "SlotLengthInMinutes", "EarliestSaturday", "LastestSaturday", "EarliestSunday", "LatestSunday", "EarliestWeekday", "LatestWeekday", "EarliestMonday", "LatestMonday",
                "EarliestTuesday",
                "LatestTuesday", "EarliestWednesday", "LatestWednesday", "EarliestThursday", "LatestThursday", "EarliestFriday", "LatestFriday"
            ],
            false);

        return fieldRules;
    }

    /*----------------------------------------------------------------------------
        %%Function: TourneyRules.ReadFieldDefinitionsAndFieldRestrictionsFromWorkbook
    ----------------------------------------------------------------------------*/
    ReadFieldDefinitionsFromWorkbook(context: JsCtx)
    {
        const fieldRules = this.ReadFieldRulesTable(context);
        const fields: Map<string, TourneyField> = new Map<string, TourneyField>();

        for (const fieldRule of fieldRules)
        {
            if (!fieldRule["Field"])
                throw new Error("Missing field name in field rules table");

            const fieldName = fieldRule["Field"];

            const slotLengthInMinutes = Number(fieldRule["SlotLengthInMinutes"] ?? 180);
            const hasLights = Boolean(fieldRule["Has Lights"] ?? false);

            const field = new TourneyField(fieldName, hasLights, slotLengthInMinutes);

            this.AddTourneyField(field);
        }
    }

    /*----------------------------------------------------------------------------
        %%Function: TourneyRules.ReadFieldDefinitionsAndFieldRestrictionsFromWorkbook
    ----------------------------------------------------------------------------*/
    ReadFieldRestrictionsFromWorkbook(context: JsCtx)
    {
        const fieldRules = this.ReadFieldRulesTable(context);
        const fields: Map<string, TourneyField> = new Map<string, TourneyField>();

        for (const fieldRule of fieldRules)
        {
            if (!fieldRule["Field"])
                throw new Error("Missing field name in field rules table");

            const fieldName = fieldRule["Field"];
            const field = this.GetMatchingField(fieldName);

            const restrictions: TourneyRestriction[] = [];

            for (const dayName of TourneyRules.s_daySuffixMaps.keys())
            {
                const earliestName = `Earliest${dayName}`;
                const latestName = `Latest${dayName}`;
                const daysOfWeek = TourneyRules.s_daySuffixMaps.get(dayName);

                const earliest =
                    fieldRule[earliestName] ? OADate.TimeWithoutDateFromOADate(Number(fieldRule[earliestName])) : null;
                const latest =
                    fieldRule[latestName] ? OADate.TimeWithoutDateFromOADate(Number(fieldRule[latestName])) : null;

                // if there are no restrictions, then don't add a restriction
                if (earliest == null && latest == null)
                    continue;

                // see if there is a restriction we can add to
                let matchedRestriction = false;

                for (const restriction of restrictions)
                {
                    if (restriction.MatchRestriction(earliest, latest))
                    {
                        // this restriction matches so we can just add this day
                        restriction.AddDays(daysOfWeek);
                        matchedRestriction = true;
                        break;
                    }
                }

                if (!matchedRestriction)
                    restrictions.push(TourneyRestriction.CreateForFieldDays([field], daysOfWeek, earliest, latest));
            }

            for (const restriction of restrictions)
                this.UpdateOrAddRestriction(restriction.Fields, restriction.Earliest, restriction.Latest, restriction.Days);
        }
    }

    /*----------------------------------------------------------------------------
        %%Function: TourneyRules.UpdateOrAddRestriction

        If there is already a restriction for this field and day, then update it
        (last one wins, so do things in specificity order)

        If there are more than one day specified, recursively call this with
        a single day for each of the days

        If there are more than one field specified, then recursively call this for
        each single field
    ----------------------------------------------------------------------------*/
    UpdateOrAddRestriction(fields: TourneyField[], earliest: TimeWithoutDate | null, latest: TimeWithoutDate | null, daysOfWeek: TourneyDaysOfWeek)
    {
        if (earliest == null && latest == null)
            return;

        if (daysOfWeek.Count() > 1)
        {
            for (const day of daysOfWeek)
            {
                this.UpdateOrAddRestriction(fields, earliest, latest, new TourneyDaysOfWeek().Add(day));
            }
            return;
        }

        if (fields.length > 1)
        {
            for (const field of fields)
                this.UpdateOrAddRestriction([field], earliest, latest, daysOfWeek);

            return;
        }

        if (fields.length == 0)
        {
            // this applies to all fields...  add one for each field
            for (const field of this.m_fields)
                this.UpdateOrAddRestriction([field], earliest, latest, daysOfWeek);

            return;
        }

        // check to see if we already have a matching item and update it
        for (const restriction of this.m_restrictions)
        {
            if (restriction.MatchRestrictionFieldDay(fields[0], daysOfWeek))
            {
                if (earliest != null)
                    restriction.EarliestStart = earliest;

                if (latest != null)
                    restriction.LatestStart = latest;

                // done
                return;
            }
        }

        const newRestriction = TourneyRestriction.CreateForFieldDays(fields, daysOfWeek, earliest, latest);

        // if we got here, we didn't find an existing restriction
        this.AddRestriction(newRestriction);
    }


    /*----------------------------------------------------------------------------
        %%Function: TourneyRules.ReadDayRestrictionsFromWorkbook
    ----------------------------------------------------------------------------*/
    ReadDayRestrictionsFromWorkbook(context: JsCtx)
    {
        const { range: dayRulesBodyRange, values: dayRulesBodyValues } = RangeCaches.getDataRangeAndValuesFromRangeCacheType(context, RangeCacheItemType.DayRulesBody);
        const { range: dayRulesHeaderRange, values: dayRulesHeaderValues } = RangeCaches.getDataRangeAndValuesFromRangeCacheType(context, RangeCacheItemType.DayRulesHeader);

        const dayRules = TableIO.readDataFromCachedExcelTable(
            "DayRules",
            dayRulesHeaderValues,
            dayRulesBodyValues,
            ["Day", "EarliestStart", "LatestStart"],
            false);

        const restrictions: TourneyRestriction[] = [];

        for (const dayRule of dayRules)
        {
            if (!dayRule["Day"])
                throw new Error("Missing field name in field rules table");

            const dayName = dayRule["Day"];
            const earliest =
                dayRule["EarliestStart"] ? OADate.TimeWithoutDateFromOADate(Number(dayRule["EarliestStart"])) : null;
            const latest =
                dayRule["LatestStart"] ? OADate.TimeWithoutDateFromOADate(Number(dayRule["LatestStart"])) : null;

            // don't add a rule if there's no restriction
            if (earliest == null && latest == null)
                continue;

            const daysOfWeek = TourneyRules.s_daySuffixMaps.get(dayName);

            // see if there is a restriction we can add to
            let matchedRestriction = false;

            // if there are no restrictions, then don't add a restriction
            if (earliest == null && latest == null)
                continue;

            for (const restriction of restrictions)
            {
                if (restriction.MatchRestriction(earliest, latest))
                {
                    // this restriction matches so we can just add this day
                    restriction.AddDays(daysOfWeek);
                    matchedRestriction = true;
                    break;
                }
            }

            if (!matchedRestriction)
                restrictions.push(TourneyRestriction.CreateForFieldDays(this.m_fields, daysOfWeek, earliest, latest));
        }

        for (const restriction of restrictions)
            this.UpdateOrAddRestriction(restriction.Fields, restriction.Earliest, restriction.Latest, restriction.Days);
    }


    /*----------------------------------------------------------------------------
        %%Function: TourneyRules.CreateFromWorkbook

        create the rules based on the values in the workbook
    ----------------------------------------------------------------------------*/
    static CreateFromWorkbook(context: JsCtx): TourneyRules
    {
        const rules = TourneyRules.Create();

        rules.ReadFieldDefinitionsFromWorkbook(context);
        rules.ReadDayRestrictionsFromWorkbook(context);
        rules.ReadFieldRestrictionsFromWorkbook(context);

        return rules;
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
        %%Function: TourneyRules.GetMatchingField
    ----------------------------------------------------------------------------*/
    GetMatchingField(name: string): TourneyField
    {
        for (const field of this.m_fields)
        {
            if (field.Name === name)
                return field;
        }

        return null;
    }

    /*----------------------------------------------------------------------------
        %%Function: TourneyRules.SetStart
    ----------------------------------------------------------------------------*/
    SetStart(date:
             DateWithoutTime):
        TourneyRules
    {
        this.m_startDate = date;
        return this;
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
    AddTourneyField(field: TourneyField):
        TourneyRules
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
    AddDefaultFieldRestrictions(earliestWeekdayStart ?: TimeWithoutDate): TourneyRules
    {
        for (const field of this.m_fields)
        {
            const timeLatestStart =
                field.HasLights ? TimeWithoutDate.CreateForTime(20) : TimeWithoutDate.CreateForTime(18);

            // saturday restriction, 9am to latest
            this.m_restrictions.push(
                TourneyRestriction.CreateForFieldDays(
                    [field],
                    TourneyDaysOfWeek.Create().Add(6),
                    TimeWithoutDate.CreateForTime(9),
                    timeLatestStart));

            // sunday restriction, 10am to latest
            this.m_restrictions.push(
                TourneyRestriction.CreateForFieldDays(
                    [field],
                    TourneyDaysOfWeek.Create().Add(0),
                    TimeWithoutDate.CreateForTime(10),
                    timeLatestStart));

            // weekday restriction
            this.m_restrictions.push(
                TourneyRestriction.CreateForFieldDays(
                    [field],
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
    GetFirstSlotForFieldDateAfterTime(field: TourneyField, date: DateWithoutTime, time ?: TimeWithoutDate): TourneyFieldSlot
    {
        // no game starts before 8am even if there are no rules
        let start: TimeWithoutDate = time ?? TimeWithoutDate.CreateForTime(8);

        this.EnumerateFieldDateRestrictions(
            field,
            date,
            (restriction) =>
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