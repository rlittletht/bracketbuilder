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
import { IAppContext } from "../../../AppContext/AppContext";
import { JsCtx } from "../../../Interop/JsCtx";
import { GridItem } from "../../GridItem";
import { GameComponentRanges } from "./GameComponentRanges";
import { Intentions } from "../../../Interop/Intentions/Intentions";
import { RangeCaches, RangeCacheItemType } from "../../../Interop/RangeCaches";
import { TnSetValues } from "../../../Interop/Intentions/TnSetValue";
import { FormattingRulesBuilder } from "../../../Brackets/FormattingRulesBuilder";


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

    collectLoadRequests(): string[]
    {
        const loadRequests: Set<string> = new Set<string>();
        for (const definition of this.m_definitions)
            definition.adjustLoadRequests(loadRequests);

        return Array.from(loadRequests);
    }

    getCanvasItemtDefinition(item: CanvasItem): CanvasItemDefinition
    {
        for (const definition of this.m_definitions)
        {
            if (definition.CanvasItem === item)
                return definition;
        }
        throw new Error(`CanvasItemDefinition not found for element: ${item}`);
    }
    public async learnFormattingFromGridGame(appContext: IAppContext, context: JsCtx, gridGame: GridItem): Promise<void>
    {
        appContext;
        const sheet = context.Ctx.workbook.worksheets.getActiveWorksheet();
        const game = gridGame.BracketGameCache;
        const loadRequests = this.collectLoadRequests();
        const ranges = new GameComponentRanges(sheet, game);

        const loadString = loadRequests.join(", ");
        ranges.enum((range: Excel.Range) => {range.format.load(loadString);});

        await context.sync("CanvasFormattingRules.learnFormattingFromGridGame");

        // and now, query all of our elements for the formatting
        for (const definition of this.m_definitions)
        {
            const componentRange = ranges.getRangeForCanvasItem(definition.CanvasItem);
            definition.loadFromExcelFormat(componentRange.format);
        }

        const tns: Intentions = new Intentions();

        RangeCaches.enumerateCachedTableBody(
            context,
            RangeCacheItemType.CanvasFormattingBody,
            RangeCacheItemType.CanvasFormattingHeader,
            (headerValues, dataValues, row): any[] =>
            {
                row;
                // get the element type for this row
                const canvasItem = dataValues[0];
                const definition = this.getElementDefinition(canvasItem);
                const values: any[] = [];
                values.push(canvasItem);

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