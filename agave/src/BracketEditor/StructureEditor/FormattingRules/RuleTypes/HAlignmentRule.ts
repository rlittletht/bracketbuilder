import { IFormatRule } from "./IFormatRule";

enum Alignment
{
    Left = "LEFT",
    Center = "CENTER",
    Right = "RIGHT"
}

export class HAlignmentRule implements IFormatRule
{
    m_val: Alignment;

    public constructor(val?: Alignment)
    {
        if (val)
            this.m_val = val;
    }

    public Parse(val: any): void
    {
        switch (typeof val)
        {
        case "string":
            if (val.toUpperCase() === Alignment.Left)
                this.m_val = Alignment.Left;
            else if (val.toUpperCase() === Alignment.Center)
                this.m_val = Alignment.Center;
            else if (val.toUpperCase() === Alignment.Right)
                this.m_val = Alignment.Right;
            break;
        default:
            throw new Error(`Invalid value type for HAlignmentRule: ${typeof val}`);
        }
    }

    public static CreateFromRule(val: Alignment): HAlignmentRule
    {
        return new HAlignmentRule(val);
    }

    public ToString(): string
    {
        return this.m_val;
    }

    public get Name(): string
    {
        return "HAlignment";
    }
}