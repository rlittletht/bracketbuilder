
class BooleanRuleBase
{
    m_val: boolean = false;

    public constructor(val?: boolean)
    {
        if (val)
            this.m_val = true;
    }

    public Parse(val: any): void
    {
        switch (typeof val)
        {
        case "boolean":
            this.m_val = val;
            break;
        case "string":
            this.m_val = (val.toLowerCase() === "true"
                || (val.toLowerCase() === "1"));
            break;
        case "number":
            this.m_val = (val !== 0);
            break;
        default:
            throw new Error(`Invalid value type for boolean rule: ${typeof val}`);
        }
    }

    public ToString(): string
    {
        if (this.m_val)
            return "TRUE";

        return "FALSE";
    }
}