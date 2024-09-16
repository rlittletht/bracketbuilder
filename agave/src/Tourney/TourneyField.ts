
export class TourneyField
{
    private m_name: string;
    private m_hasLights: boolean;

    get Name(): string
    {
        return this.m_name;
    }

    get HasLights(): boolean
    {
        return this.m_hasLights;
    }

    constructor(name: string, hasLights: boolean)
    {
        this.m_name = name;
        this.m_hasLights = hasLights;
    }
}