import { IFormatRule } from "../RuleTypes/IFormatRule";
import { ThemeItem } from "./ThemeItem";

export class ThemeItemDefinition
{
    m_item: ThemeItem;
    m_rules: IFormatRule[] = [];

    constructor(item: ThemeItem, rules: IFormatRule[])
    {
        this.m_item = item;
        this.m_rules.push(...rules);
    }

    public get ThemeItem(): ThemeItem
    {
        return this.m_item;
    }

    public loadFromExcelFormat(format: Excel.RangeFormat): void
    {
        for (const rule of this.m_rules)
            rule.LoadFromExcelFormat(format);
    }

    public loadFromValues(headerValues: any[], values: any[]): void
    {
        for (let i = 1; i < headerValues.length; i++)
        {
            const name: string = headerValues[i];
            const value: any = values[i];
            this.setValue(name, value);
        }
    }

    public setValue(ruleName: string, value: any)
    {
        for (const rule of this.m_rules)
        {
            if (rule.Name.toLowerCase() == ruleName.toLowerCase())
                rule.Value = value;
        }
    }

    public getValue(ruleName: string): any
    {
        for (const rule of this.m_rules)
        {
            if (rule.Name.toLowerCase() == ruleName.toLowerCase())
                return rule.Value;
        }
    }

    public adjustLoadRequests(loadRequests: Set<string>): void
    {
        for (const rule of this.m_rules)
            rule.AdjustLoadRequests(loadRequests);
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
            map.set(rule.Name, rule.ToString());

        for (const name of names)
        {
            if (name == "ThemeItem")
                definitions.push(this.m_item);
            else if (map.has(name))
                definitions.push(map.get(name));
            else
                definitions.push(null);
        }
        return definitions;
    }
}