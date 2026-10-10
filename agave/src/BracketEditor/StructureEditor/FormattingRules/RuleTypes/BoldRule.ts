import { IFormatRule } from "./IFormatRule";
import { LoadRequestType } from "./loadRequests";
import { BooleanRuleBase } from "./BooleanRuleBase";
import { IIntention } from "../../../../Interop/Intentions/IIntention";
import { RangeInfo } from "../../../../Interop/Ranges";
import { TnSetFontBold } from "../../../../Interop/Intentions/TnSetFontBold";

export class BoldRule extends BooleanRuleBase implements IFormatRule
{
    public static CreateFromString(val: any): IFormatRule
    {
        const rule = new BoldRule();

        rule.Parse(val);
        return rule;
    }

    public static CreateFromRule(val: boolean): IFormatRule
    {
        return new BoldRule(val);
    }

    public get Name(): string
    {
        return "Bold";
    }

    public AdjustLoadRequests(loadRequests: Set<string>): void
    {
        loadRequests.add(LoadRequestType.Bold);
    }

    public LoadFromExcelFormat(format: Excel.RangeFormat): void
    {
        this.m_val = format.font.bold;
    }

    public GetTns(range?: RangeInfo): IIntention[]
    {
        const tns: IIntention[] = [];

        if (!range)
            return tns;

        tns.push(TnSetFontBold.Create(range, this.m_val));
        return tns;
    }
}