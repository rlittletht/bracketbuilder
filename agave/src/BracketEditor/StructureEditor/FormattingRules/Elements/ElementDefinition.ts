import { IFormatRule, IFormatRule as IFormatRule1 } from "../RuleTypes/IFormatRule";
import { ElementItem } from "./ElementItem";

export class ElementDefinition
{
    m_element: ElementItem;
    m_rules: IFormatRule[] = [];

    constructor(element: ElementItem, rules: IFormatRule1[])
    {
        this.m_element = element;
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
            if (name == "Element")
                definitions.push(this.m_element);
            else if (map.has(name))
                definitions.push(map.get(name));
            else
                definitions.push(null);
        }
        return definitions;
    }
}