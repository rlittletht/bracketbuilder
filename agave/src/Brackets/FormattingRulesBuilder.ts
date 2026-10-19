import { JsCtx } from "../Interop/JsCtx";
import { Sheets, EnsureSheetPlacement } from "../Interop/Sheets";
import { BracketInfoBuilder } from "./BracketInfoBuilder";
import { GridBuilder } from "./GridBuilder";
import { IFastTables } from "../Interop/FastTables";
import { Ranges } from "../Interop/Ranges";
import { Tables } from "../Interop/Tables";
import { BracketDefBuilder } from "./BracketDefBuilder";
import { RulesBuilder } from "./RulesBuilder";
import { s_staticConfig } from "../StaticConfig";
import { _ElementFormattingRules } from "../BracketEditor/StructureEditor/FormattingRules/ElementFormattingRules";
import { ElementDefinition } from "../BracketEditor/StructureEditor/FormattingRules/Elements/ElementDefinition";
import { FastFormulaAreas } from "../Interop/FastFormulaAreas/FastFormulaAreas";
import { _ThemeFormattingRules, RefreshFormattingRules } from "../BracketEditor/StructureEditor/FormattingRules/ThemeRules";
import { FastFormulaAreasItems } from "../Interop/FastFormulaAreas/FastFormulaAreasItems";
import { _CanvasFormattingRules } from "../BracketEditor/StructureEditor/FormattingRules/CanvasFormattingRules";

export class FormattingRulesBuilder
{
    public static SheetName: string = "FormattingRules";
    public static ThemeTableName: string = "ThemeSettings";
    public static ElementFormattingTableName: string = "FormattingRules";
    public static ElementSizesTableName: string = "ElementSizes";

    static insertContentAtRange(sheet: Excel.Worksheet, row: number, col: number, content: any[][]): Excel.Range
    {
        const rows = content.length;
        const columns = content[0].length;

        const rng = sheet.getRangeByIndexes(row, col, rows, columns);

        rng.values = content;

        return rng;
    }

    static async insertTableAt(context: JsCtx, fastTables: IFastTables, sheet: Excel.Worksheet, row: number, tableName: string, header: any[], content: any[][]): Promise<Excel.Table>
    {
        const table: Excel.Table = await Tables.ensureTableExists(
            context,
            sheet,
            fastTables,
            tableName,
            Ranges.addressFromCoordinates([row, 1], [row, header.length]),
            header);

        await Tables.appendArrayToTableSlow(context, tableName, content, header);

        return table;
    }

    public static async InsertDefinitionsIntoTableAtRow(context: JsCtx, fastTables: IFastTables, sheet: Excel.Worksheet, row: number, elementDefinitions: any[][], tableName: string): Promise<number>
    {
        const elementHeader = [...elementDefinitions[0]];
        elementDefinitions.splice(0, 1);
        const elementRules = elementDefinitions;

        await this.insertTableAt(
            context,
            fastTables,
            sheet,
            row,
            tableName,
            elementHeader,
            elementRules);

        return elementRules.length;
    }

    public static async buildFormattingRulesSheet(context: JsCtx, fastTables: IFastTables)
    {
        await FastFormulaAreas.populateFastFormulaAreaCacheForType(context, FastFormulaAreasItems.FormattingRules);

        // load whatever settings they already had...
        RefreshFormattingRules(context);

        // and now make sure we get a fresh new sheet
        await Sheets.ensureSheetDoesNotExist(context, FormattingRulesBuilder.SheetName);

        const sheet: Excel.Worksheet = await Sheets.ensureSheetExists(context, FormattingRulesBuilder.SheetName, RulesBuilder.SheetName, EnsureSheetPlacement.AfterGiven);


        const colB_C = sheet.getRange("B:C");

        colB_C.format.columnWidth = 128;

        let row = 0;

        let rng: Excel.Range = FormattingRulesBuilder.insertContentAtRange(sheet, row, 0, [["Theme Settings"]]);
        await context.sync();

        row += 2;

        row += await FormattingRulesBuilder.InsertDefinitionsIntoTableAtRow(context, fastTables, sheet, row, _ThemeFormattingRules().getDefinitionsArray(), FormattingRulesBuilder.ThemeTableName) + 15;

        row += await FormattingRulesBuilder.InsertDefinitionsIntoTableAtRow(context, fastTables, sheet, row, _ElementFormattingRules().getDefinitionsArray(), FormattingRulesBuilder.ElementFormattingTableName) + 20;

        row += await FormattingRulesBuilder.InsertDefinitionsIntoTableAtRow(context, fastTables, sheet, row + 20, _CanvasFormattingRules().getDefinitionsArray(), FormattingRulesBuilder.ElementSizesTableName) + 20;
    }
}