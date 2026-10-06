import { IFormatRule } from "../RuleTypes/IFormatRule";
import { ElementItem } from "./ElementItem";

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

    public getValue(ruleName: string): any
    {
        for (const rule of this.m_rules)
        {
            if (rule.Name.toLowerCase() == ruleName.toLowerCase())
                return rule.Value;
        }
    }
}