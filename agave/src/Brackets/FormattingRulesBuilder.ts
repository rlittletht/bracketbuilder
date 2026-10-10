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

    public static async buildFormattingRulesSheet(
        context: JsCtx,
        fastTables: IFastTables,
    )
    {
        let sheet: Excel.Worksheet = await Sheets.ensureSheetExists(context, FormattingRulesBuilder.SheetName, RulesBuilder.SheetName, EnsureSheetPlacement.AfterGiven);

        let row = 0;

        let rng: Excel.Range = FormattingRulesBuilder.insertContentAtRange(sheet, row, 0, [["Theme Settings"]]);
        await context.sync();

        row += 2;

        await this.insertTableAt(
            context,
            fastTables,
            sheet,
            row,
            FormattingRulesBuilder.ThemeTableName,
            ["Element", "Font"],
            [
                ["Header", s_staticConfig.headerFont],
                ["BodyHeading", s_staticConfig.blackFont],
                ["Body", s_staticConfig.bodyFont]
            ]);

        row += 5;

        await this.insertTableAt(
            context,
            fastTables,
            sheet,
            row,
            FormattingRulesBuilder.ElementFormattingTableName,
            ["Element", "Font", "FontSize", "Bold", "Italic", "Color", "HAlignment", "VAlignment"],
            [
                ["Tournament Heading", "Theme", s_staticConfig.headerSize, "TRUE", "FALSE", "#000000", "CENTER", "CENTER"],
                ["Tournament SubHeading", "Theme", s_staticConfig.subHeaderSize, "TRUE", "FALSE", "#000000", "CENTER", "CENTER"],
                ["Game Title", "Theme", s_staticConfig.blackSize, "FALSE", "TRUE", "#000000", "CENTER", "CENTER"],
                ["Advance To", "Theme", s_staticConfig.advanceSize, "TRUE", "TRUE", "#FF0000", "CENTER", "CENTER"],
                ["Game Body", "Theme", s_staticConfig.bodySize, "FALSE", "FALSE", "#000000", "CENTER", ""],
                ["Game Number", "Theme", s_staticConfig.gameNumSize, "TRUE", "FALSE", "#000000", "CENTER", "CENTER"],
                ["Dates", "Theme", s_staticConfig.datesSize, "FALSE", "FALSE", "#000000", "", ""],
                ["Champion", "Theme", s_staticConfig.championSize, "FALSE", "FALSE", "#000000", "CENTER", "CENTER"]
            ]);

        row += 10;

        await this.insertTableAt(
            context,
            fastTables,
            sheet,
            row,
            FormattingRulesBuilder.ElementSizesTableName,
            ["Element", "Size"],
            [
                ["TeamRows",15],
                ["LineRows",1],
                ["TeamColumns",113],
                ["ScoreColumns",17.5],
                ["LineColumns",1]
            ]);
    }
}