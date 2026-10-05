import { IFormatRule } from "./IFormatRule";

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
}