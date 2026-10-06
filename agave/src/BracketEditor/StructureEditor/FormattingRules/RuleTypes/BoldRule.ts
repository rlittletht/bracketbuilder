import { IFormatRule } from "./IFormatRule";
import { LoadRequestType } from "./loadRequests";
import { BooleanRuleBase } from "./BooleanRuleBase";

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
}