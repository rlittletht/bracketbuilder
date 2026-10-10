import { RangeInfo } from "../../../../Interop/Ranges";
import { IFormatRule } from "./IFormatRule";
import { LoadRequestType } from "./loadRequests";
import { IIntention } from "../../../../Interop/Intentions/IIntention";
import { TnSetHorizontalAlignment } from "../../../../Interop/Intentions/TnSetHorizontalAlignment";

export enum HAlignment
{
    Left = "Left",
    Center = "Center",
    Right = "Right"
}

export class HAlignmentRule implements IFormatRule
{
    m_val: HAlignment;

    public constructor(val?: HAlignment)
    {
        if (val)
            this.m_val = val;
    }

    public Parse(val: any): void
    {
        switch (typeof val)
        {
        case "string":
            if (val.toUpperCase() === HAlignment.Left)
                this.m_val = HAlignment.Left;
            else if (val.toUpperCase() === HAlignment.Center)
                this.m_val = HAlignment.Center;
            else if (val.toUpperCase() === HAlignment.Right)
                this.m_val = HAlignment.Right;
            break;
        default:
            throw new Error(`Invalid value type for HAlignmentRule: ${typeof val}`);
        }
    }

    public static CreateFromRule(val: HAlignment): IFormatRule
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
        loadRequests.add(LoadRequestType.HorizontalAlignment);
    }

    public LoadFromExcelFormat(format: Excel.RangeFormat): void
    {
        this.Parse(format.horizontalAlignment);
    }

    public GetTns(range?: RangeInfo): IIntention[]
    {
        const tns: IIntention[] = [];

        if (!range)
            return [];

        tns.push(
            TnSetHorizontalAlignment.Create(range, this.Value as Excel.HorizontalAlignment));
        return tns;
    }
}