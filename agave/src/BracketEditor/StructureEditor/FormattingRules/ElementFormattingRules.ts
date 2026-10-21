import { FontRule } from "./RuleTypes/FontRule";
import { IFormatRule } from "./RuleTypes/IFormatRule";
import { FontSizeRule } from "./RuleTypes/FontSizeRule";
import { BoldRule } from "./RuleTypes/BoldRule";
import { ItalicRule } from "./RuleTypes/ItalicRule";
import { ColorRule } from "./RuleTypes/ColorRule";
import { HAlignmentRule, HAlignment } from "./RuleTypes/HAlignmentRule";
import { VAlignmentRule, VAlignment } from "./RuleTypes/VAlignmentRule";
import { ElementDefinition } from "./Elements/ElementDefinition";
import { ElementItem } from "./Elements/ElementItem";
import { IAppContext } from "../../../AppContext/AppContext";
import { JsCtx } from "../../../Interop/JsCtx";
import { GridItem } from "../../GridItem";
import { Ranges, RangeInfo } from "../../../Interop/Ranges";
import { IBracketGame } from "../../IBracketGame";
import { GameComponentRanges } from "./GameComponentRanges";
import { IIntention } from "../../../Interop/Intentions/IIntention";
import { RangeCaches, RangeCacheItemType } from "../../../Interop/RangeCaches";
import { FastFormulaAreas } from "../../../Interop/FastFormulaAreas/FastFormulaAreas";
import { TnSetValues } from "../../../Interop/Intentions/TnSetValue";
import { Intentions } from "../../../Interop/Intentions/Intentions";
import { FormattingRulesBuilder } from "../../../Brackets/FormattingRulesBuilder";
import { ThemeItem } from "./Themes/ThemeItem";
import { s_staticConfig } from "../../../StaticConfig";
import { FastTables } from "../../../Interop/FastTables";


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
            definitions.push([definition.ElementType, ...definition.getDefinitionArrayForNames(Array.from(names))]);

        return definitions;
    }

    collectLoadRequests(): string[]
    {
        const loadRequests: Set<string> = new Set<string>();
        for (const definition of this.m_definitions)
            definition.adjustLoadRequests(loadRequests);

        return Array.from(loadRequests);
    }

    getElementDefinitionOrNull(element: ElementItem): ElementDefinition | null
    {
        for (const definition of this.m_definitions)
        {
            if (definition.ElementType === element)
                return definition;
        }
        return null;
    }

    getElementDefinition(element: ElementItem): ElementDefinition
    {
        const definition = this.getElementDefinitionOrNull(element);

        if (!definition)
            throw new Error(`ElementDefinition not found for element: ${element}`);

        return definition;
    }

    getElementRule(element: ElementItem, rule: string): IFormatRule
    {
        const definition = this.getElementDefinition(element);
        return definition.getRule(rule);
    }

    public getDefinitionValuesForElementRow(headerValues: string[], dataValues: any[], row: number): any[]
    {
        row;
        // get the element type for this row
        const elementType = dataValues[0];
        const definition = this.getElementDefinitionOrNull(elementType);

        if (!definition)
            return [...dataValues];

        const values: any[] = [];
        values.push(elementType);
        for (let col = 1; col < headerValues.length; col++)
        {
            const value = definition.getValue(headerValues[col]);
            values.push(value);
        }

        return values;
    }

    /*----------------------------------------------------------------------------
        %%Function: learnFormattingFromGridGame
        %%Qualified: ElementFormattingRules.learnFormattingFromGridGame
    ----------------------------------------------------------------------------*/
    public async learnFormattingFromGridGame(appContext: IAppContext, context: JsCtx, gridGame: GridItem, rowDates: number, gridGameStart: RangeInfo): Promise<void>
    {
        appContext;
        const sheet = context.Ctx.workbook.worksheets.getActiveWorksheet();
        const game = gridGame.BracketGameCache;
        const loadRequests = this.collectLoadRequests();
        const ranges = new GameComponentRanges(sheet, game, rowDates, gridGameStart);

        const loadString = loadRequests.join(", ");
        ranges.enum((range: Excel.Range | null) => { range?.format.load(loadString); });

        await context.sync("ElementFormattingRules.learnFormattingFromGridGame");

        // and now, query all of our elements for the formatting
        for (const definition of this.m_definitions)
        {
            const componentRange = ranges.getRangeForElementType(definition.ElementType);
            if (componentRange)
                definition.loadFromExcelFormat(componentRange.format);
        }

        const updated = new Map<string, boolean>();

        const tns: Intentions = new Intentions();
        let headerRow: string[] | null = null;

        RangeCaches.enumerateCachedTableBody(
            context,
            RangeCacheItemType.ElementFormattingBody,
            RangeCacheItemType.ElementFormattingHeader,
            (headerValues, dataValues, row) =>
            {
                headerRow = headerRow || headerValues;
                return this.getDefinitionValuesForElementRow(headerValues, dataValues, row);
            },
            (dataRange, updatedValues) =>
            {
                for (const updatedRow of updatedValues)
                    updated.set((updatedRow[0] as string).toLowerCase(), true);

                tns.AddTns([TnSetValues.Create(dataRange.offset(0, dataRange.RowCount, 0, dataRange.ColumnCount), updatedValues, FormattingRulesBuilder.SheetName)]);
            });

        const newRows: any[][] = [];

        if (headerRow)
        {
            // see if there are any missing
            for (const definition of this.m_definitions)
            {
                if (!updated.has(definition.ElementType.toLowerCase()))
                {
                    newRows.push(this.getDefinitionValuesForElementRow(headerRow, [definition.ElementType], -1));
                }
            }
        }

        // and now record this in the FormattingRules table
        await tns.Execute(context);

        if (newRows.length > 0)
        {
            const fastTables = new FastTables();

            // we have to expand the table. there better be room under it!
            await fastTables.appendTableFast(FormattingRulesBuilder.ElementFormattingTableName, newRows);
        }
    }

    loadFormattingFromExcelSheet(context: JsCtx): void
    {
        RangeCaches.enumerateCachedTableBody(
            context,
            RangeCacheItemType.ElementFormattingBody,
            RangeCacheItemType.ElementFormattingHeader,
            (headerValues, dataValues, row): any[] =>
            {
                row;
                const elementType = dataValues[0];
                const definition = this.getElementDefinitionOrNull(elementType);

                if (!definition)
                    return [...dataValues];

                for (let col = 1; col < dataValues.length; col++)
                    definition.setValue(headerValues[col], dataValues[col]);
                return dataValues;
            },
            null);
    }
}

// TODO : need to make empty formatting cells mean "no change" (i.e. no tns
// record)
export function CreateDefaultElementFormattingRules(): ElementFormattingRules
{
    const rules: ElementFormattingRules = new ElementFormattingRules();

    rules.addDefinition(
        ElementItem.GameTitle,
        [
            FontRule.CreateFromRule("Theme", true, ThemeItem.BodyHeading),
            FontSizeRule.CreateFromRule(s_staticConfig.blackSize),
            BoldRule.CreateFromRule(false),
            ItalicRule.CreateFromRule(false),
            ColorRule.CreateFromString("#000000"),
            HAlignmentRule.CreateFromRule(HAlignment.Center)
        ]);
    rules.addDefinition(
        ElementItem.Champion,
        [
            FontRule.CreateFromRule("Theme", true, ThemeItem.BodyHeading),
            FontSizeRule.CreateFromRule(s_staticConfig.championSize),
            BoldRule.CreateFromRule(false),
            ItalicRule.CreateFromRule(true),
            ColorRule.CreateFromString("#FF0000"),
            HAlignmentRule.CreateFromRule(HAlignment.Center),
            VAlignmentRule.CreateFromRule(VAlignment.Bottom)
        ]);

    rules.addDefinition(
        ElementItem.AdvanceTo,
        [
            FontRule.CreateFromRule("Theme", true, ThemeItem.Body),
            FontSizeRule.CreateFromRule(s_staticConfig.advanceSize),
            BoldRule.CreateFromRule(true),
            ItalicRule.CreateFromRule(true),
            ColorRule.CreateFromString("#FF0000"),
            HAlignmentRule.CreateFromRule(HAlignment.Center)
        ]);

    rules.addDefinition(
        ElementItem.GameBody,
        [
            FontRule.CreateFromRule("Theme", true, ThemeItem.Body),
            FontSizeRule.CreateFromRule(s_staticConfig.bodySize),
            BoldRule.CreateFromRule(false),
            ItalicRule.CreateFromRule(false),
            ColorRule.CreateFromString("#000000"),
            HAlignmentRule.CreateFromRule(HAlignment.Center)
        ]);

    rules.addDefinition(
        ElementItem.GameNumber,
        [
            FontRule.CreateFromRule("Theme", true, ThemeItem.Body),
            FontSizeRule.CreateFromRule(s_staticConfig.bodySize),
            BoldRule.CreateFromRule(true),
            ItalicRule.CreateFromRule(false),
            ColorRule.CreateFromString("#000000"),
            HAlignmentRule.CreateFromRule(HAlignment.Right),
            VAlignmentRule.CreateFromRule(VAlignment.Center)
        ]);

    rules.addDefinition(
        ElementItem.Dates,
        [
            FontRule.CreateFromRule("Theme", true, ThemeItem.Body),
            FontSizeRule.CreateFromRule(11),
            BoldRule.CreateFromRule(false),
            ItalicRule.CreateFromRule(false),
            ColorRule.CreateFromString("#000000")
        ]);

    rules.addDefinition(
        ElementItem.TourneyHeading1,
        [
            FontRule.CreateFromRule("Theme", true, ThemeItem.Header),
            FontSizeRule.CreateFromRule(s_staticConfig.headerSize),
            BoldRule.CreateFromRule(true),
            ItalicRule.CreateFromRule(false),
            ColorRule.CreateFromString("#000000"),
            HAlignmentRule.CreateFromRule(HAlignment.Center),
            VAlignmentRule.CreateFromRule(VAlignment.Center)
        ]);

    rules.addDefinition(
        ElementItem.TourneyHeading2,
        [
            FontRule.CreateFromRule("Theme", true, ThemeItem.Header),
            FontSizeRule.CreateFromRule(s_staticConfig.headerSize),
            BoldRule.CreateFromRule(true),
            ItalicRule.CreateFromRule(false),
            ColorRule.CreateFromString("#000000"),
            HAlignmentRule.CreateFromRule(HAlignment.Center),
            VAlignmentRule.CreateFromRule(VAlignment.Center)
        ]);

    rules.addDefinition(
        ElementItem.TourneyHeading3,
        [
            FontRule.CreateFromRule("Theme", true, ThemeItem.Header),
            FontSizeRule.CreateFromRule(s_staticConfig.headerSize),
            BoldRule.CreateFromRule(true),
            ItalicRule.CreateFromRule(false),
            ColorRule.CreateFromString("#000000"),
            HAlignmentRule.CreateFromRule(HAlignment.Center),
            VAlignmentRule.CreateFromRule(VAlignment.Center)
        ]);

    rules.addDefinition(
        ElementItem.TourneySubHeading,
        [
            FontRule.CreateFromRule("Theme", true, ThemeItem.Header),
            FontSizeRule.CreateFromRule(s_staticConfig.subHeaderSize),
            BoldRule.CreateFromRule(false),
            ItalicRule.CreateFromRule(false),
            ColorRule.CreateFromString("#000000"),
            HAlignmentRule.CreateFromRule(HAlignment.Center),
            VAlignmentRule.CreateFromRule(VAlignment.Center)
        ]);
    return rules;
}

let _elementFormattingRules: ElementFormattingRules | null = null;

export function _ElementFormattingRules(): ElementFormattingRules
{
    _elementFormattingRules = _elementFormattingRules || CreateDefaultElementFormattingRules();
    return _elementFormattingRules;
}