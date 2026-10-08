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
import { Ranges } from "../../../Interop/Ranges";
import { IBracketGame } from "../../IBracketGame";
import { GameComponentRanges } from "./GameComponentRanges";
import { IIntention } from "../../../Interop/Intentions/IIntention";
import { RangeCaches, RangeCacheItemType } from "../../../Interop/RangeCaches";
import { FastFormulaAreas } from "../../../Interop/FastFormulaAreas/FastFormulaAreas";
import { TnSetValues } from "../../../Interop/Intentions/TnSetValue";
import { Intentions } from "../../../Interop/Intentions/Intentions";
import { FormattingRulesBuilder } from "../../../Brackets/FormattingRulesBuilder";


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

    collectLoadRequests(): string[]
    {
        const loadRequests: Set<string> = new Set<string>();
        for (const definition of this.m_definitions)
            definition.adjustLoadRequests(loadRequests);

        return Array.from(loadRequests);
    }

    getElementDefinition(element: ElementItem): ElementDefinition
    {
        for (const definition of this.m_definitions)
        {
            if (definition.ElementType === element)
                return definition;
        }
        throw new Error(`ElementDefinition not found for element: ${element}`);
    }

    /*----------------------------------------------------------------------------
        %%Function: learnFormattingFromGridGame
        %%Qualified: ElementFormattingRules.learnFormattingFromGridGame
    ----------------------------------------------------------------------------*/
    public async learnFormattingFromGridGame(appContext: IAppContext, context: JsCtx, gridGame: GridItem, rowDates: number): Promise<void>
    {
        appContext;
        const sheet = context.Ctx.workbook.worksheets.getActiveWorksheet();
        const game = gridGame.BracketGameCache;
        const loadRequests = this.collectLoadRequests();
        const ranges = new GameComponentRanges(sheet, game, rowDates);

        const loadString = loadRequests.join(", ");
        ranges.enum((range: Excel.Range) => { range.format.load(loadString); });

        await context.sync("ElementFormattingRules.learnFormattingFromGridGame");

        // and now, query all of our elements for the formatting
        for (const definition of this.m_definitions)
        {
            const componentRange = ranges.getRangeForElementType(definition.ElementType);
            definition.loadFromExcelFormat(componentRange.format);
        }

        // TODO: adjust the font rule for theming. requires the theme to be loaded.

        const tns: Intentions = new Intentions();

        RangeCaches.enumerateCachedTableBody(
            context,
            RangeCacheItemType.ElementFormattingBody,
            RangeCacheItemType.ElementFormattingHeader,
            (headerValues, dataValues, row): any[] =>
            {
                row;
                // get the element type for this row
                const elementType = dataValues[0];
                const definition = this.getElementDefinition(elementType);
                const values: any[] = [];
                values.push(elementType);

                for (let col = 1; col < dataValues.length; col++)
                {
                    const value = definition.getValue(headerValues[col]);
                    values.push(value);
                }
                return values;
            },
            (dataRange, updatedValues) =>
            {
                tns.AddTns([TnSetValues.Create(dataRange.offset(0, dataRange.RowCount, 0, dataRange.ColumnCount), updatedValues, FormattingRulesBuilder.SheetName)]);
            });

        // and now record this in the FormattingRules table
        await tns.Execute(context);
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
            HAlignmentRule.CreateFromRule(HAlignment.Center),
            VAlignmentRule.CreateFromRule(VAlignment.Center)
        ]);

    rules.addDefinition(
        ElementItem.AdvanceTo,
        [
            FontRule.CreateFromRule("Theme", true),
            FontSizeRule.CreateFromRule(8),
            BoldRule.CreateFromRule(true),
            ItalicRule.CreateFromRule(true),
            ColorRule.CreateFromString("#FF0000"),
            HAlignmentRule.CreateFromRule(HAlignment.Center),
            VAlignmentRule.CreateFromRule(VAlignment.Center)
        ]);

    rules.addDefinition(
        ElementItem.GameBody,
        [
            FontRule.CreateFromRule("Theme", true),
            FontSizeRule.CreateFromRule(9),
            BoldRule.CreateFromRule(false),
            ItalicRule.CreateFromRule(false),
            ColorRule.CreateFromString("#000000"),
            HAlignmentRule.CreateFromRule(HAlignment.Center)
        ]);

    rules.addDefinition(
        ElementItem.GameNumber,
        [
            FontRule.CreateFromRule("Theme", true),
            FontSizeRule.CreateFromRule(9),
            BoldRule.CreateFromRule(true),
            ItalicRule.CreateFromRule(false),
            ColorRule.CreateFromString("#000000"),
            HAlignmentRule.CreateFromRule(HAlignment.Center),
            VAlignmentRule.CreateFromRule(VAlignment.Center)
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

export let _elementFormattingRules: ElementFormattingRules = CreateDefaultElementFormattingRules();