import { TourneyFieldSlot } from "../Tourney/TourneyFieldSlot";
import { TourneyDef } from "../Tourney/TourneyDef";
import { TimeWithoutDate } from "../Support/TimeWithoutDate";
import { DateWithoutTime } from "../Support/DateWithoutTime";

export class TourneySlots
{
    private m_orderedSlots: TourneyFieldSlot[];

    get Slots(): TourneyFieldSlot[]
    {
        return this.m_orderedSlots;
    }

    /*----------------------------------------------------------------------------
        %%Function: TourneyDef.FindOverlappingSlots

        Return all the slots that overlap the given slot.  Uses the slot length
        from the field

        BE CAREFUL - if the slot rolls over the end of the day, then shorten the
        overlap checks to just be for the remainder of the day...
    ----------------------------------------------------------------------------*/
    static FindOverlappingSlots(slot: TourneyFieldSlot, slots: TourneyFieldSlot[]): TourneyFieldSlot[]
    {
        const start: TimeWithoutDate = slot.Start;
        const end: TimeWithoutDate = slot.Start.CompareTo(slot.End) < 0 ? slot.End : TimeWithoutDate.CreateForTime(23, 59, 59);

        const overlapping: TourneyFieldSlot[] = [];

        for (const check of slots)
        {
            const checkStart: TimeWithoutDate = check.Start;
            const checkEnd: TimeWithoutDate = check.End;

            // SS >= CS < SE
            if (checkStart.CompareTo(start) >= 0 && checkStart.CompareTo(end) < 0)
                overlapping.push(check);
            // SS > CE <= SE
            else if (checkEnd.CompareTo(start) > 0 && checkEnd.CompareTo(end) <= 0)
                overlapping.push(check);
            // CS <= SS   SE >= CE
            else if (checkStart.CompareTo(start) <= 0 && checkEnd.CompareTo(end) >= 0)
                overlapping.push(check)
        }

        return overlapping;
    }

    /*----------------------------------------------------------------------------
        %%Function: TourneySlots.CreateForAvailableSlotsOnDate
    ----------------------------------------------------------------------------*/
    static CreateForAvailableSlotsOnDate(tourney: TourneyDef, date: DateWithoutTime): TourneySlots
    {
        const slots = new TourneySlots();

        const mapFieldSlotsInUse: Map<string, TourneyFieldSlot[]> = new Map<string, TourneyFieldSlot[]>();

        for (const game of tourney.Games.values())
        {
            if (game.GameDate.GetDaysSinceEpoch() != date.GetDaysSinceEpoch())
                continue;

            if (!mapFieldSlotsInUse.has(game.Field.Name))
                mapFieldSlotsInUse.set(game.Field.Name, []);

            mapFieldSlotsInUse.get(game.Field.Name).push(game.Slot);
        }

        const allFieldSlots: { pointer: number, slots: TourneyFieldSlot[] }[] = [];

        const mapFieldSlotsAvailable: Map<string, TourneyFieldSlot[]> = new Map<string, TourneyFieldSlot[]>();

        // go through each field
        for (const field of tourney.Rules.Fields)
        {
            const slotsInUse: TourneyFieldSlot[] = mapFieldSlotsInUse.has(field.Name) ? mapFieldSlotsInUse.get(field.Name) : [];
            const slots: TourneyFieldSlot[] = mapFieldSlotsAvailable.has(field.Name) ? mapFieldSlotsInUse.get(field.Name) : [];

            // now, build the ordered list of slots we want to use and check against the
            // already scheduled slots...

            let firstSlot = tourney.Rules.GetFirstSlotForFieldDateAfterTime(field, date, null);

            while (!tourney.Rules.DoesProposalViolateRestrictions(field, date, firstSlot.Start))
            {
                let overlapping = this.FindOverlappingSlots(firstSlot, slotsInUse);

                while (overlapping.length != 0)
                {
                    if (overlapping.length != 1)
                        throw new Error("how did we get more than one overlapping slot?!?");

                    // we can't use this slot. find the next slot we can take
                    firstSlot = tourney.Rules.GetFirstSlotForFieldDateAfterTime(field, date, overlapping[0].End);
                    if (tourney.Rules.DoesProposalViolateRestrictions(field, date, firstSlot.Start))
                    {
                        // we're completely done with this field
                        firstSlot = null;
                        break;
                    }
                    overlapping = this.FindOverlappingSlots(firstSlot, slotsInUse);
                }

                if (firstSlot == null)
                    break;

                slots.push(firstSlot);
                // if we wrapped around to the next day, break
                if (firstSlot.End.CompareTo(firstSlot.Start) <= 0)
                    break;

                firstSlot = tourney.Rules.GetFirstSlotForFieldDateAfterTime(field, date, firstSlot.End);
            }

            const sortedSlots = slots.sort(
                (left, right) =>
                {
                    return left.Start.CompareTo(right.Start);
                });

            allFieldSlots.push({ pointer: 0, slots: sortedSlots });
        }

        const orderedSlots: TourneyFieldSlot[] = [];

        // now walk through all the field slots in parallel and add them in preferred order (in start time order)
        while (true)
        {
            let earliest: TimeWithoutDate = null;
            let earliestIndex: string = null;

            for (const idx in allFieldSlots)
            {
                const fieldSlot = allFieldSlots[idx];

                if (fieldSlot.pointer == fieldSlot.slots.length)
                    continue;

                if (earliest == null || earliest.CompareTo(fieldSlot.slots[fieldSlot.pointer].Start) > 0)
                {
                    earliest = fieldSlot.slots[fieldSlot.pointer].Start;
                    earliestIndex = idx;
                }
            }
            // if we didn't find an earliest, it means we have no more slots on any field
            if (earliest == null)
                break;

            // push the earliest preferred slot and increment that fields pointer since we pushed it
            orderedSlots.push(allFieldSlots[earliestIndex].slots[allFieldSlots[earliestIndex].pointer]);
            allFieldSlots[earliestIndex].pointer++;
        }

        slots.m_orderedSlots = orderedSlots;
        return slots;
    }

    /*----------------------------------------------------------------------------
        %%Function: TourneySlots.GetFirstOrNull
    ----------------------------------------------------------------------------*/
    GetFirstOrNull(): TourneyFieldSlot
    {
        if (this.m_orderedSlots.length == 0)
            return null;

        return this.m_orderedSlots[0];
    }
}