import { getColorFromString, IColor } from "@fluentui/react";


export class ColorRuleBase
{
    m_val: IColor;

    public constructor(val?: IColor)
    {
        if (val)
            this.m_val = val;
    }

    public get Value(): any
    {
        return this.m_val.str;
    }

    public set Value(val: any)
    {
        this.Parse(val);
    }

    public Parse(val: any): void
    {
        switch (typeof val)
        {
        case "object":
            this.m_val = val as any as IColor;
            break;
        case "string":
            this.m_val = getColorFromString(val);
            break;
        default:
            throw new Error(`Invalid value type for color rule: ${typeof val}`);
        }
    }

    public ToString(): string
    {
        // Assuming a function colorToString exists to convert IColor to string
        return this.m_val.str;
    }
}