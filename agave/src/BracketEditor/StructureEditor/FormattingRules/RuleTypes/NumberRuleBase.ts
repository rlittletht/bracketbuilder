

export class NumberRuleBase
{
    m_val: number;

    public constructor(val?: number)
    {
        if (val)
            this.m_val = val;
    }

    public Parse(val: any): void
    {
        switch (typeof val)
        {
        case "number":
            this.m_val = val;
            break;
        case "string":
            this.m_val = parseFloat(val);
            break;
        default:
            throw new Error(`Invalid value type for number rule: ${typeof val}`);
        }
    }

    public ToString(): string
    {
        return `${this.m_val}`;
    }
}