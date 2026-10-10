import { IFormatRule } from "../RuleTypes/IFormatRule";
import { CanvasItem } from "./CanvasItem";

export class CanvasItemDefinition
{
    m_item: CanvasItem;
    m_rules: IFormatRule[] = [];

    constructor(item: CanvasItem, rules: IFormatRule[])
    {
        this.m_item = item;
        this.m_rules.push(...rules);
    }

    public get CanvasItem(): CanvasItem
    {
        return this.m_item;
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

    public setValue(ruleName: string, value: any): void
    {
        for (const rule of this.m_rules)
        {
            if (rule.Name.toLowerCase() == ruleName.toLowerCase())
            {
                rule.Parse(value);
                return;
            }
        }
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
            if (name == "Item")
                definitions.push(this.m_item);
            else if (map.has(name))
                definitions.push(map.get(name));
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
}
