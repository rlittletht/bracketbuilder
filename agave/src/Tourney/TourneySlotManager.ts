import { TourneyFieldSlot } from "./TourneyFieldSlot";
import { TourneyDef } from "./TourneyDef";
import { TourneySlots } from "./TourneySlots";
import { DateWithoutTime } from "../Support/DateWithoutTime";

export class TourneySlotManager
{
    private m_mapSlotsAvailable: Map<number, TourneySlots> = new Map<number, TourneySlots>();
    private m_tourney: TourneyDef;

    constructor(tourney: TourneyDef)
    {
        this.m_tourney = tourney;
    }

    /*----------------------------------------------------------------------------
        %%Function: TourneySlotManager.EnsureSlotsAvailableForDate
    ----------------------------------------------------------------------------*/
    private EnsureSlotsAvailableForDate(date: DateWithoutTime)
    {
        const key = date.GetDaysSinceEpoch();

        if (this.m_mapSlotsAvailable.has(key))
            return;

        this.m_mapSlotsAvailable.set(key, TourneySlots.CreateForAvailableSlotsOnDate(this.m_tourney, date));
    }

    /*----------------------------------------------------------------------------
        %%Function: TourneySlotManager.GetFirstSlotAvailableOrNullForDate
    ----------------------------------------------------------------------------*/
    GetFirstSlotAvailableOrNullForDate(date: DateWithoutTime): TourneyFieldSlot
    {
        this.EnsureSlotsAvailableForDate(date);

        const slots = this.m_mapSlotsAvailable.get(date.GetDaysSinceEpoch());

        return slots.GetFirstOrNull();
    }

    /*----------------------------------------------------------------------------
        %%Function: TourneySlotManager.Invalidate
    ----------------------------------------------------------------------------*/
    Invalidate()
    {
        this.m_mapSlotsAvailable.clear();
    }
}