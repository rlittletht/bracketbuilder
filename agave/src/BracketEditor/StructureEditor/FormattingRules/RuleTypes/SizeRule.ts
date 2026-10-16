import { NumberRuleBase } from "./NumberRuleBase";
import { IFormatRule } from "./IFormatRule";
import { RangeInfo } from "../../../../Interop/Ranges";
import { IIntention } from "../../../../Interop/Intentions/IIntention";

export interface GetFormatValueDelegate
{
    (rule: SizeRule, format: Excel.RangeFormat): void;
}

export interface GetTnsDelegate
{
    (rule: SizeRule, range: RangeInfo): IIntention[];
}

export class SizeRule extends NumberRuleBase implements IFormatRule
{
    m_loadRequest: string = "";
    m_getFormatValue: GetFormatValueDelegate = null;
    m_getTns: GetTnsDelegate = null;

    public static CreateFromString(loadRequest: string, getFormatValue: GetFormatValueDelegate, val: any): IFormatRule
    {
        const rule = new SizeRule();

        rule.m_loadRequest = loadRequest;
        rule.m_getFormatValue = getFormatValue;
        rule.Parse(val);
        return rule;
    }

    public static CreateFromRule(loadRequest: string, getFormatValue: GetFormatValueDelegate, getTns: GetTnsDelegate, val: number): IFormatRule
    {
        const rule = new SizeRule(val);
        rule.m_loadRequest = loadRequest;
        rule.m_getFormatValue = getFormatValue;
        rule.m_getTns = getTns;

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

    public GetTns(range?: RangeInfo): IIntention[]
    {
        const tns: IIntention[] = [];

        if (!range)
            return [];

        if (this.m_getTns)
            tns.push(...this.m_getTns(this, range));

        return tns;
    }
}