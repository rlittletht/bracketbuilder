

export class StringRuleBase
{
    m_val: string;


    public constructor(val?: string)
    {
        if (val)
            this.m_val = val;
    }

    public get Value(): any
    {
        return this.m_val;
    }

    public Parse(val: any): void
    {
        switch (typeof val)
        {
        case "number":
            this.m_val = `${val}`;
            break;
        case "string":
            this.m_val = val;
            break;
        case "boolean":
            this.m_val = val ? "TRUE" : "FALSE";
            break;
        default:
            throw new Error(`Invalid value type for string rule: ${typeof val}`);
        }
    }

    public ToString(): string
    {
        return `${this.m_val}`;
    }
}