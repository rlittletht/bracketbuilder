import { FontRule } from "./RuleTypes/FontRule";
import { IFormatRule } from "./RuleTypes/IFormatRule";
import { FontSizeRule } from "./RuleTypes/FontSizeRule";
import { BoldRule } from "./RuleTypes/BoldRule";
import { ItalicRule } from "./RuleTypes/ItalicRule";
import { ColorRule } from "./RuleTypes/ColorRule";
import { HAlignmentRule } from "./RuleTypes/HAlignmentRule";
import { VAlignmentRule } from "./RuleTypes/VAlignmentRule";
import { CanvasItemDefinition } from "./CanvasItems/CanvasItemDefinition";
import { ElementItem } from "./Elements/ElementItem";
import { CanvasItem } from "./CanvasItems/CanvasItem";
import { SizeRule } from "./RuleTypes/SizeRule";


export class CanvasFormattingRules
{
    m_definitions: CanvasItemDefinition[] = [];

    constructor()
    {
    }

    public addDefinition(item: CanvasItem, rules: IFormatRule[]): void
    {
        this.m_definitions.push(new CanvasItemDefinition(item, rules));
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
        header.push("Item");

        for (const name of names)
            header.push(name);

        definitions.push(header);

        // and now push all the definitions
        for (const definition of this.m_definitions)
            definitions.push(definition.getDefinitionArrayForNames(Array.from(names)));
        return definitions;
    }
}

export function CreateDefaultCanvasFormattingRules(): CanvasFormattingRules
{
    const rules: CanvasFormattingRules = new CanvasFormattingRules();

    rules.addDefinition(CanvasItem.TeamRows, [SizeRule.CreateFromRule("rowHeight", 15)]);
    rules.addDefinition(CanvasItem.LineRows, [SizeRule.CreateFromRule("rowHeight", 1)]);
    rules.addDefinition(CanvasItem.TeamColumns, [SizeRule.CreateFromRule("columnWidth", 113)]);
    rules.addDefinition(CanvasItem.ScoreColumns, [SizeRule.CreateFromRule("columnWidth", 17.5)]);
    rules.addDefinition(CanvasItem.LineColumns, [SizeRule.CreateFromRule("columnWidth", 1)]);

    return rules;
}

export let _canvasFormattingRules: CanvasFormattingRules = CreateDefaultCanvasFormattingRules();