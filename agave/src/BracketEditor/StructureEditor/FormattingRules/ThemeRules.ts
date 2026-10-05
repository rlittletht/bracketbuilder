import { IFormatRule } from "./RuleTypes/IFormatRule";
import { SizeRule } from "./RuleTypes/SizeRule";
import { ThemeItemDefinition } from "./Themes/ThemeItemDefinition";
import { ThemeItem } from "./Themes/ThemeItem";
import { FontRule } from "./RuleTypes/FontRule";


export class ThemeRules
{
    m_definitions: ThemeItemDefinition[] = [];

    constructor()
    {
    }

    public addDefinition(item: ThemeItem, rules: IFormatRule[]): void
    {
        this.m_definitions.push(new ThemeItemDefinition(item, rules));
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

export function CreateDefaultThemeRules(): ThemeRules
{
    const rules: ThemeRules = new ThemeRules();

    rules.addDefinition(ThemeItem.Header, [FontRule.CreateFromRule("Aptos Display", false)]);
    rules.addDefinition(ThemeItem.BodyHeading, [FontRule.CreateFromRule("Aptos Black", false)]);
    rules.addDefinition(ThemeItem.Body, [FontRule.CreateFromRule("Aptos Narrow", false)]);

    return rules;
}

export let _themeFormattingRules: ThemeRules = CreateDefaultThemeRules();