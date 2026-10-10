import { IFormatRule } from "./IFormatRule";
import { LoadRequestType } from "./loadRequests";
import { RangeInfo } from "../../../../Interop/Ranges";
import { IIntention } from "../../../../Interop/Intentions/IIntention";
import { TnSetHorizontalAlignment } from "../../../../Interop/Intentions/TnSetHorizontalAlignment";
import { TnSetVerticalAlignment } from "../../../../Interop/Intentions/TnSetVerticalAlignment";

export enum VAlignment
{
    Top = "Top",
    Center = "Center",
    Bottom = "Bottom"
}

export class VAlignmentRule implements IFormatRule
{
    m_val: VAlignment;

    public constructor(val?: VAlignment)
    {
        if (val)
            this.m_val = val;
    }

    public Parse(val: any): void
    {
        switch (typeof val)
        {
        case "string":
            if (val.toUpperCase() === VAlignment.Top)
                this.m_val = VAlignment.Top;
            else if (val.toUpperCase() === VAlignment.Center)
                this.m_val = VAlignment.Center;
            else if (val.toUpperCase() === VAlignment.Bottom)
                this.m_val = VAlignment.Bottom;
            break;
        default:
                throw new Error(`Invalid value type for VAlignmentRule: ${typeof val}`);
        }
    }

    public static CreateFromRule(val: VAlignment): VAlignmentRule
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

    public get Value(): any
    {
        return this.m_val;
    }

    public set Value(val: any)
    {
        this.Parse(val);
    }

    public AdjustLoadRequests(loadRequests: Set<string>): void
    {
        loadRequests.add(LoadRequestType.VerticalAlignment);
    }

    public LoadFromExcelFormat(format: Excel.RangeFormat): void
    {
        this.Parse(format.verticalAlignment);
    }

    public GetTns(range?: RangeInfo): IIntention[]
    {
        const tns: IIntention[] = [];

        if (!range)
            return [];

        tns.push(
            TnSetVerticalAlignment.Create(range, this.Value as Excel.VerticalAlignment));
        return tns;
    }
}