import { NumberRuleBase } from "./NumberRuleBase";
import { IFormatRule } from "./IFormatRule";

export interface GetFormatValueDelegate
{
    (rule: SizeRule, format: Excel.RangeFormat): void;
}

export class SizeRule extends NumberRuleBase implements IFormatRule
{
    m_loadRequest: string = "";
    m_getFormatValue: GetFormatValueDelegate = null;

    public static CreateFromString(loadRequest: string, getFormatValue: GetFormatValueDelegate, val: any): IFormatRule
    {
        const rule = new SizeRule();

        rule.m_loadRequest = loadRequest;
        rule.m_getFormatValue = getFormatValue;
        rule.Parse(val);
        return rule;
    }

    public static CreateFromRule(loadRequest: string, val: number): IFormatRule
    {
        const rule = new SizeRule(val);
        rule.m_loadRequest = loadRequest;
        return rule;
    }

    public get Name(): string
    {
        return "Size";
    }

    public AdjustLoadRequests(loadRequests: Set<string>): void
    {
        loadRequests.add(this.m_loadRequest);
    }

    public LoadFromExcelFormat(format: Excel.RangeFormat): void
    {
        this.m_getFormatValue(this, format);
    }
}