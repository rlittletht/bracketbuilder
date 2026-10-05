import { FontRule } from "./RuleTypes/FontRule";
import { IFormatRule } from "./RuleTypes/IFormatRule";
import { FontSizeRule } from "./RuleTypes/FontSizeRule";
import { BoldRule } from "./RuleTypes/BoldRule";
import { ItalicRule } from "./RuleTypes/ItalicRule";
import { ColorRule } from "./RuleTypes/ColorRule";
import { HAlignmentRule } from "./RuleTypes/HAlignmentRule";
import {VAlignmentRule} from "./RuleTypes/VAlignmentRule";
import { ElementDefinition } from "./Elements/ElementDefinition";
import { ElementItem } from "./Elements/ElementItem";


export class ElementFormattingRules
{
    m_definitions: ElementDefinition[] = [];

    constructor()
    {
    }

    public addDefinition(element: ElementItem, rules: IFormatRule[]): void
    {
        this.m_definitions.push(new ElementDefinition(element, rules));
    }

    public getDefinitionsArray(): any[][]
    {
        const names: Set<string> = new Set<string>();

        // first, collect all the names
        for (const definition of this.m_definitions)
        {
            for (const name of definition.ruleNames)
                names.add(name);
        }

        const definitions: any[][] = [];

        // push the title
        const header: string[] = [];
        header.push("Element");

        for (const name of names)
            header.push(name);

        definitions.push(header);

        // and now push all the definitions
        for (const definition of this.m_definitions)
            definitions.push(definition.getDefinitionArrayForNames(Array.from(names)));
        return definitions;
    }
}

export function CreateDefaultElementFormattingRules(): ElementFormattingRules
{
    const rules: ElementFormattingRules = new ElementFormattingRules();

    rules.addDefinition(
        ElementItem.GameTitle,
        [
            FontRule.CreateFromRule("Theme", true),
            FontSizeRule.CreateFromRule(11),
            BoldRule.CreateFromRule(false),
            ItalicRule.CreateFromRule(false),
            ColorRule.CreateFromString("#000000"),
            HAlignmentRule.CreateFromRule("Center"),
            VAlignmentRule.CreateFromRule("Center")
        ]);

    rules.addDefinition(
        ElementItem.AdvanceTo,
        [
            FontRule.CreateFromRule("Theme", true),
            FontSizeRule.CreateFromRule(8),
            BoldRule.CreateFromRule(true),
            ItalicRule.CreateFromRule(true),
            ColorRule.CreateFromString("#FF0000"),
            HAlignmentRule.CreateFromRule("Center"),
            VAlignmentRule.CreateFromRule("Center")
        ]);

    rules.addDefinition(
        ElementItem.GameBody,
        [
            FontRule.CreateFromRule("Theme", true),
            FontSizeRule.CreateFromRule(9),
            BoldRule.CreateFromRule(false),
            ItalicRule.CreateFromRule(false),
            ColorRule.CreateFromString("#000000"),
            HAlignmentRule.CreateFromRule("Center")
        ]);

    rules.addDefinition(
        ElementItem.GameNumber,
        [
            FontRule.CreateFromRule("Theme", true),
            FontSizeRule.CreateFromRule(9),
            BoldRule.CreateFromRule(true),
            ItalicRule.CreateFromRule(false),
            ColorRule.CreateFromString("#000000"),
            HAlignmentRule.CreateFromRule("Center"),
            VAlignmentRule.CreateFromRule("Center")
        ]);

    rules.addDefinition(
        ElementItem.Dates,
        [
            FontRule.CreateFromRule("Theme", true),
            FontSizeRule.CreateFromRule(11),
            BoldRule.CreateFromRule(false),
            ItalicRule.CreateFromRule(false),
            ColorRule.CreateFromString("#000000")
        ]);

    return rules;
}

export let _formattingRules: FormattingRules = CreateDefaultFormattingRules();