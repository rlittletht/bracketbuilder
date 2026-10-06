import { IFormatRule } from "./IFormatRule";
import { LoadRequestType } from "./loadRequests";
import { BooleanRuleBase } from "./BooleanRuleBase";

export class ItalicRule extends BooleanRuleBase implements IFormatRule
{
    public static CreateFromString(val: any): IFormatRule
    {
        const rule = new ItalicRule();

        rule.Parse(val);
        return rule;
    }

    public static CreateFromRule(val: boolean): IFormatRule
    {
        return new ItalicRule(val);
    }

    public get Name(): string
    {
        return "Italic";
    }

    public AdjustLoadRequests(loadRequests: Set<string>): void
    {
        loadRequests.add(LoadRequestType.Italic);
    }

    public LoadFromExcelFormat(format: Excel.RangeFormat): void
    {
        this.m_val = format.font.italic;
    }
}