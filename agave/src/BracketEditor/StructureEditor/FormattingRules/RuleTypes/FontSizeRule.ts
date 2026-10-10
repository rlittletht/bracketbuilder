import { NumberRuleBase } from "./NumberRuleBase";
import { IFormatRule } from "./IFormatRule";
import { IColor } from "@fluentui/react";
import { LoadRequestType } from "./loadRequests";
import { RangeInfo } from "../../../../Interop/Ranges";
import { IIntention } from "../../../../Interop/Intentions/IIntention";

export class FontSizeRule extends NumberRuleBase implements IFormatRule
{
    public static CreateFromString(val: any): IFormatRule
    {
        const rule = new FontSizeRule();

        rule.Parse(val);
        return rule;
    }

    public static CreateFromRule(val: number): IFormatRule
    {
        return new FontSizeRule(val);
    }

    public get Name(): string
    {
        return "FontSize";
    }

    public AdjustLoadRequests(loadRequests: Set<string>): void
    {
        loadRequests.add(LoadRequestType.FontSize);
    }

    public LoadFromExcelFormat(format: Excel.RangeFormat): void
    {
        this.m_val = format.font.size;
    }

    // font and font size have to be aggregated manually
    public GetTns(range?: RangeInfo): IIntention[]
    {
        range;
        const tns: IIntention[] = [];

        return tns;
    }
}