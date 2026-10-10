import { ColorRuleBase } from "./ColorRuleBase";
import { IFormatRule } from "./IFormatRule";
import { LoadRequestType } from "./loadRequests";
import { getColorFromString, IColor } from "@fluentui/react";
import { RangeInfo } from "../../../../Interop/Ranges";
import { IIntention } from "../../../../Interop/Intentions/IIntention";
import { TnSetFontItalic } from "../../../../Interop/Intentions/TnSetFontItalic";
import { TnSetFontColor } from "../../../../Interop/Intentions/TnSetFontColor";

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

    public GetTns(range?: RangeInfo): IIntention[]
    {
        const tns: IIntention[] = [];

        if (!range)
            return tns;

        tns.push(TnSetFontColor.Create(range, this.Value));
        return tns;
    }
}