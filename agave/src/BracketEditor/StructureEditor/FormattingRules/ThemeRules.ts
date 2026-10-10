import { IFormatRule } from "./RuleTypes/IFormatRule";
import { SizeRule } from "./RuleTypes/SizeRule";
import { ThemeItemDefinition } from "./Themes/ThemeItemDefinition";
import { ThemeItem } from "./Themes/ThemeItem";
import { FontRule } from "./RuleTypes/FontRule";
import { GameComponentRanges } from "./GameComponentRanges";
import { Intentions } from "../../../Interop/Intentions/Intentions";
import { RangeCacheItemType, RangeCaches } from "../../../Interop/RangeCaches";
import { TnSetValues } from "../../../Interop/Intentions/TnSetValue";
import { IAppContext } from "../../../AppContext/AppContext";
import { GridItem } from "../../GridItem";
import { JsCtx } from "../../../Interop/JsCtx";
import { _ElementFormattingRules } from "./ElementFormattingRules";
import { _CanvasFormattingRules } from "./CanvasFormattingRules";


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

    collectLoadRequests(): string[]
    {
        const loadRequests: Set<string> = new Set<string>();
        for (const definition of this.m_definitions)
            definition.adjustLoadRequests(loadRequests);

        return Array.from(loadRequests);
    }

    getThemeItemDefinition(item: ThemeItem): ThemeItemDefinition
    {
        for (const definition of this.m_definitions)
        {
            if (definition.ThemeItem === item)
                return definition;
        }
        throw new Error(`ThemeItemDefinition not found for element: ${item}`);
    }

    getThemeItemFromFont(fontName: string): ThemeItem | null
    {
        const match = fontName.toLowerCase();

        for (const definition of this.m_definitions)
        {
            if (definition.getValue("Font").toLowerCase() === match)
                return definition.ThemeItem;
        }

        return null;
    }

    loadThemeFromExcelSheet(context: JsCtx): void
    {
        RangeCaches.enumerateCachedTableBody(
            context,
            RangeCacheItemType.ThemeSettingsBody,
            RangeCacheItemType.ThemeSettingsHeader,
            (headerValues, dataValues, row): any[] =>
            {
                row;
                const themeItem = dataValues[0];
                const definition = this.getThemeItemDefinition(themeItem);

                definition.loadFromValues(headerValues, dataValues);
                return dataValues;
            },
            null);
    }

    resolve(themeItem: ThemeItem, font: FontRule): string
    {
        if (!font.IsTheme)
            return font.Value;

        const definition = this.getThemeItemDefinition(themeItem);
        return definition.getValue("Font");
    }
}

export function CreateDefaultThemeRules(): ThemeRules
{
    const rules: ThemeRules = new ThemeRules();

    rules.addDefinition(ThemeItem.Header, [FontRule.CreateFromRule("Aptos Display", false, null)]);
    rules.addDefinition(ThemeItem.BodyHeading, [FontRule.CreateFromRule("Aptos Black", false, null)]);
    rules.addDefinition(ThemeItem.Body, [FontRule.CreateFromRule("Aptos Narrow", false, null)]);

    return rules;
}

let _themeFormattingRules: ThemeRules | null = null;

export function _ThemeFormattingRules(): ThemeRules
{
    _themeFormattingRules = _themeFormattingRules || CreateDefaultThemeRules();

    return _themeFormattingRules;
}

export function RefreshFormattingRules(context: JsCtx): void
{
    _ThemeFormattingRules().loadThemeFromExcelSheet(context);
    _ElementFormattingRules().loadFormattingFromExcelSheet(context);
    _CanvasFormattingRules().loadFormattingFromExcelSheet(context);
}