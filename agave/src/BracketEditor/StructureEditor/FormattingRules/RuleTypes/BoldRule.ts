import { IFormatRule } from "./IFormatRule";

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
}