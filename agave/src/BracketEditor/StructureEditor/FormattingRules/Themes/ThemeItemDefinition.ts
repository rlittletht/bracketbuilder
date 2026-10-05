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