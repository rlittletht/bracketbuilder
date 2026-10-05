import { IFormatRule } from "./IFormatRule";

enum Alignment
{
    Top = "TOP",
    Center = "CENTER",
    Bottom = "BOTTOM"
}

export class VAlignmentRule implements IFormatRule
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
            if (val.toUpperCase() === Alignment.Top)
                this.m_val = Alignment.Top;
            else if (val.toUpperCase() === Alignment.Center)
                this.m_val = Alignment.Center;
            else if (val.toUpperCase() === Alignment.Bottom)
                this.m_val = Alignment.Bottom;
            break;
        default:
                throw new Error(`Invalid value type for VAlignmentRule: ${typeof val}`);
        }
    }

    public static CreateFromRule(val: Alignment): VAlignmentRule
    {
        return new VAlignmentRule(val);
    }

    public ToString(): string
    {
        return this.m_val;
    }

    public get Name(): string
    {
        return "VAlignment";
    }
}