import { ColorRuleBase } from "./ColorRuleBase";
import { IFormatRule } from "./IFormatRule";
import { LoadRequestType } from "./loadRequests";
import { getColorFromString, IColor } from "@fluentui/react";

export class ColorRule extends ColorRuleBase implements IFormatRule
{
    public static CreateFromString(val: any): IFormatRule
    {
        const rule = new ColorRule();

        rule.Parse(val);
        return rule;
    }

    public static CreateFromRule(val: IColor): IFormatRule
    {
        return new ColorRule(val);
    }

    public get Name(): string
    {
        return "Color";
    }

    public AdjustLoadRequests(loadRequests: Set<string>): void
    {
        loadRequests.add(LoadRequestType.Color);
    }

    public LoadFromExcelFormat(format: Excel.RangeFormat): void
    {
        this.Parse(format.font.color);
    }
}