
export class TourneyField
{
    private m_name: string;
    private m_hasLights: boolean;
    private m_slotLength: number;

    get SlotLength(): number
    {
        return this.m_slotLength;
    }

    get Name(): string
    {
        return this.m_name;
    }

    get HasLights(): boolean
    {
        return this.m_hasLights;
    }

    constructor(name: string, hasLights: boolean, slotLength: number)
    {
        this.m_name = name;
        this.m_hasLights = hasLights;
        this.m_slotLength = slotLength;
    }
}