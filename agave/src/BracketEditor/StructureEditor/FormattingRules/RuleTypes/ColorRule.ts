import { ColorRuleBase } from "./ColorRuleBase";
import { IFormatRule } from "./IFormatRule";

export class ColorRule extends ColorRuleBase implements IFormatRule
{
    public static CreateFromString(val: any): IFormatRule
    {
        const rule = new ColorRule();

        rule.Parse(val);
        return rule;
    }

    public static CreateFromRule(val: string): IFormatRule
    {
        return new ColorRule(val);
    }

    public get Name(): string
    {
        return "Color";
    }
}