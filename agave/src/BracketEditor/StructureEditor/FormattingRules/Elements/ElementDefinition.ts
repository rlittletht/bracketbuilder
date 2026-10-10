import { IFormatRule } from "../RuleTypes/IFormatRule";
import { ElementItem } from "./ElementItem";
import { IIntention } from "../../../../Interop/Intentions/IIntention";
import { RangeInfo } from "../../../../Interop/Ranges";
import { ThemeItem } from "../Themes/ThemeItem";
import { _ThemeFormattingRules } from "../ThemeRules";
import { _ElementFormattingRules } from "../ElementFormattingRules";
import { FontRule } from "../RuleTypes/FontRule";
import { TnSetFontInfo } from "../../../../Interop/Intentions/TnSetFontInfo";

export class ElementDefinition
{
    m_element: ElementItem;
    m_rules: IFormatRule[] = [];

    constructor(element: ElementItem, rules: IFormatRule[])
    {
        this.m_element = element;
        this.m_rules.push(...rules);
    }

    public get ElementType(): ElementItem
    {
        return this.m_element;
    }

    public get ruleNames(): string[]
    {
        const names: string[] = [];

        for (const rule of this.m_rules)
            names.push(rule.Name);

        return names;
    }

    public getDefinitionArrayForNames(names: string[]): any[]
    {
        const definitions: any[] = [];

        const map: Map<string, any> = new Map<string, any>();

        for (const rule of this.m_rules)
            map.set(rule.Name.toLowerCase(), rule.ToString());

        for (const name of names)
        {
            if (name.toLowerCase() == "element")
                definitions.push(this.m_element);
            else if (map.has(name.toLowerCase()))
                definitions.push(map.get(name.toLowerCase()));
            else
                definitions.push(null);
        }
        return definitions;
    }

    public adjustLoadRequests(loadRequests: Set<string>): void
    {
        for (const rule of this.m_rules)
            rule.AdjustLoadRequests(loadRequests);
    }

    public loadFromExcelFormat(format: Excel.RangeFormat): void
    {
        for (const rule of this.m_rules)
            rule.LoadFromExcelFormat(format);
    }

    public getRule(ruleName: string): IFormatRule | null
    {
        for (const rule of this.m_rules)
        {
            if (rule.Name.toLowerCase() == ruleName.toLowerCase())
                return rule;
        }
        return null;
    }

    public getValue(ruleName: string): any
    {
        const rule = this.getRule(ruleName);

        if (rule)
            return rule.Value;
        return null;
    }

    public setValue(ruleName: string, value: any): void
    {
        const rule = this.getRule(ruleName);
        if (rule)
            rule.Parse(value);
    }

    public getTns(range: RangeInfo | null, themeItem: ThemeItem | null): IIntention[]
    {
        const tns: IIntention[] = [];

        for (const rule of this.m_rules)
            tns.push(...rule.GetTns(range));

        if (themeItem != null)
        {
            // and get the font information together
            const font = _ThemeFormattingRules().resolve(
                themeItem,
                this.getRule("Font") as any as FontRule);

            const size = this.getValue("FontSize")?.Value as number;

            tns.push(TnSetFontInfo.Create(range, font, size));
        }

        return tns;
    }
}