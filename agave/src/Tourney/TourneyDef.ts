import { DateWithoutTime } from "epoq";
import { TourneyGameDef } from "./TourneyGameDef";
import { TourneyRules } from "./TourneyRules";
import { BracketDefinition } from "../Brackets/BracketDefinition";
import { IBracketDefinitionData } from "../Brackets/IBracketDefinitionData";
import { GameId } from "../BracketEditor/GameId";
import { BracketManager } from "../Brackets/BracketManager";
import { IBracketGameDefinition } from "../Brackets/IBracketGameDefinition";
import { TimeWithoutDate } from "../Support/TimeWithoutDate";
import { TourneyFieldSlot } from "./TourneyFieldSlot";

export class TourneyDef
{
    private m_rules: TourneyRules;
    private m_games: Map<number, TourneyGameDef>;
    private m_bracket: BracketDefinition;

    private static s_penaltyMax = 65535;

    constructor(bracketDefinitionData: IBracketDefinitionData, rules: TourneyRules)
    {
        this.m_bracket = new BracketDefinition(bracketDefinitionData);
        this.m_rules = rules;
        this.m_games = new Map<number, TourneyGameDef>();
    }

    get Rules(): TourneyRules
    {
        return this.m_rules;
    }

    /*----------------------------------------------------------------------------
        %%Function: TourneyDef.AddGame
    ----------------------------------------------------------------------------*/
    AddGame(game: TourneyGameDef)
    {
        if (this.m_games.has(game.Id.Value))
            throw new Error(`tourney already has game {game.Id.Value} scheduled`);

        this.m_games.set(game.Id.Value, game);
    }

    /*----------------------------------------------------------------------------
        %%Function: TourneyDef.ScheduleGame

        Figure out when this game can be played based on the rules. This doesn't
        add the game to the tourney -- it just figures out where it would go
        (useful for calculating ranking penalties)

        General approach:

        Schedule games packed together as tightly as possible:

        find the first day the game can be played on (based on prereqs)

        if a game can be played on that day (because there are slots
        available), then play it.

        otherwise, try the next day...rinse and repeat
    ----------------------------------------------------------------------------*/
    ScheduleGame(id: GameId): TourneyGameDef
    {
        // first, what day can we play this on
        const predecessors = this.m_bracket.GetGameRequirementsForGame(id);

        let firstAvail: DateWithoutTime = this.m_rules.StartDate;

        for (const id of predecessors)
        {
            if (!this.m_games.has(id.Value))
                return null;

            const preceding = this.m_games.get(id.Value);

            if (firstAvail.getDaysSinceEpoch() <= preceding.GameDate.getDaysSinceEpoch())
                firstAvail = new DateWithoutTime(preceding.GameDate.getDaysSinceEpoch() + 1);
        }

        return null;
        // now we know the first date it can be scheduled on
    }

    /*----------------------------------------------------------------------------
        %%Function: TourneyDef.FindOverlappingSlots

        Return all the slots that overlap the given slot.  Uses the slot length
        from the field
    ----------------------------------------------------------------------------*/
    FindOverlappingSlots(slot: TourneyFieldSlot, slots: TourneyFieldSlot[]): TourneyFieldSlot[]
    {
        const start: TimeWithoutDate = slot.Start;
        const end: TimeWithoutDate = slot.End;
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
        %%Function: TourneyDef.BuildSlotListForDate

        Build an ordered list (by preferred status)
    ----------------------------------------------------------------------------*/
    BuildSlotListForDate(date: DateWithoutTime): TourneyFieldSlot[]
    {
        const mapFieldSlotsInUse: Map<string, TourneyFieldSlot[]> = new Map<string, TourneyFieldSlot[]>();

        for (const game of this.m_games.values())
        {
            if (game.GameDate.getDaysSinceEpoch() != date.getDaysSinceEpoch())
                continue;

            if (!mapFieldSlotsInUse.has(game.Field.Name))
                mapFieldSlotsInUse.set(game.Field.Name, []);

            mapFieldSlotsInUse.get(game.Field.Name).push(game.Slot);
        }

        const allFieldSlots: { pointer: number, slots: TourneyFieldSlot[] }[] = [];

        const mapFieldSlotsAvailable: Map<string, TourneyFieldSlot[]> = new Map<string, TourneyFieldSlot[]>();

        // go through each field
        for (const field of this.m_rules.Fields)
        {
            const slotsInUse: TourneyFieldSlot[] = mapFieldSlotsInUse.has(field.Name) ? mapFieldSlotsInUse.get(field.Name) : [];
            const slots: TourneyFieldSlot[] = mapFieldSlotsAvailable.has(field.Name) ? mapFieldSlotsInUse.get(field.Name) : [];

            // now, build the ordered list of slots we want to use and check against the
            // already scheduled slots...

            let firstSlot = this.m_rules.GetFirstSlotForFieldDateAfterTime(field, date, null);

            while (!this.m_rules.DoesProposalViolateRestrictions(field, date, firstSlot.Start))
            {
                let overlapping = this.FindOverlappingSlots(firstSlot, slotsInUse);

                while (overlapping.length != 0)
                {
                    if (overlapping.length != 1)
                        throw new Error("how did we get more than one overlapping slot?!?");

                    // we can't use this slot. find the next slot we can take
                    firstSlot = this.m_rules.GetFirstSlotForFieldDateAfterTime(field, date, overlapping[0].End);
                    if (this.m_rules.DoesProposalViolateRestrictions(field, date, firstSlot.Start))
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
                firstSlot = this.m_rules.GetFirstSlotForFieldDateAfterTime(field, date, firstSlot.End);
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

        return orderedSlots;
    }

    GetFirstSlotAvailableForDate(date: DateWithoutTime) //: TourneyFieldSlot
    {
        date;
    }

    /*----------------------------------------------------------------------------
        %%Function: TourneyDef.CalculateRankPenalty

        Calculate the rank penalty for this game for the current tourney
    ----------------------------------------------------------------------------*/
    CalculateRankPenalty(id: GameId): number
    {
        let penalty = 0;
        const gameDef: IBracketGameDefinition = this.m_bracket.GetGameDefinitionData(id);

        // are all the predecessor's scheduled?
        const predecessors = this.m_bracket.GetGameRequirementsForGame(id);

        for (const id of predecessors)
        {
            if (!this.m_games.has(id.Value))
                return TourneyDef.s_penaltyMax;
        }

        return penalty;
    }

    /*----------------------------------------------------------------------------
        %%Function: TourneyDef.GetNextGameToSchedule

        Given the current games scheduled in this tourney, what is the next game
        to schedule

        Basically, for every unscheduled game, rank its suitability to schedule
        and take the one with the lowest rank (think of the rank as a penalty)
    ----------------------------------------------------------------------------*/
    GetNextGameToSchedule() //: GameId
    {
    }
}