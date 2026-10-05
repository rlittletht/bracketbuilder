import { NumberRuleBase } from "./NumberRuleBase";
import { IFormatRule } from "./IFormatRule";

export class SizeRule extends NumberRuleBase implements IFormatRule
{
    public static CreateFromString(val: any): IFormatRule
    {
        const rule = new SizeRule();

        rule.Parse(val);
        return rule;
    }

    public static CreateFromRule(val: number): IFormatRule
    {
        return new SizeRule(val);
    }

    public get Name(): string
    {
        return "Size";
    }
}