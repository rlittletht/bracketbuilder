import { Sheets, EnsureSheetPlacement } from "../Interop/Sheets";
import { Ranges } from "../Interop/Ranges";
import { OADate } from "../Interop/Dates";
import { BracketInfoBuilder as BracketDataBuilder } from "./BracketInfoBuilder";
import { JsCtx } from "../Interop/JsCtx";

export class GlobalDataBuilder
{
    static SheetName: string = "TeamsAndFields";

    static DefaultField: string = "Ballfield";
    static DefaultStartTime: number = 0;

    static async addGlobalDataToSheet(context: JsCtx, sheet: Excel.Worksheet, rowStart: number)
    {
        let rng: Excel.Range = sheet.getRangeByIndexes(rowStart, 0, 15, 2);
        rng.values =
        [
            ["", "FILL IN TOURNAMENT INFORMATION BELOW"],
            ["", ""],
            ["Tournament:", "TOURNAMENT TITLE"],
            ["",""],
            ["SubTitle:", "(sub-title)"],
            ["", ""],
            ["Location:", "FIELD OF DREAMS PARK"],
            ["", ""],
            ["Address:", "123 Strikes Out Place, Williamsport"],
            ["", ""],
            ["Hosted:", "SOME LOCAL LEAGUE, DISTRICT 1"],
            ["", ""],
            ["Last Update:", OADate.ToOADate(new Date())], // adjust for UTC
            ["", ""],
            ["FieldCount:", 2]
        ];
        rng.format.horizontalAlignment = Excel.HorizontalAlignment.left;
        await context.sync();
        rng = sheet.getRangeByIndexes(rowStart, 0, 15, 1);
        rng.format.font.bold = true;
        rng.format.font.size = 10;

        rng = sheet.getRangeByIndexes(rowStart, 0, 1, 2);
        rng.format.font.bold = true;
        rng.format.font.size = 13;
        rng.format.font.underline = Excel.RangeUnderlineStyle.single;

        rng = sheet.getRange("A:B");
        rng.format.fill.color = "#F2F2F2";
        
        await Ranges.createOrReplaceNamedRangeByIndex(context, sheet, "TournamentTitle", [rowStart + 2, 1]);
        await Ranges.createOrReplaceNamedRangeByIndex(context, sheet, "TournamentSubtitle", [rowStart + 4, 1]);
        await Ranges.createOrReplaceNamedRangeByIndex(context, sheet, "TournamentLocation", [rowStart + 6, 1]);
        await Ranges.createOrReplaceNamedRangeByIndex(context, sheet, "TournamentAddress", [rowStart + 8, 1]);
        await Ranges.createOrReplaceNamedRangeByIndex(context, sheet, "TournamentHost", [rowStart + 10, 1]);
        await Ranges.createOrReplaceNamedRangeByIndex(context, sheet, "LastUpdate", [rowStart + 12, 1]);
        await Ranges.createOrReplaceNamedRangeByIndex(context, sheet, "FieldCount", [rowStart + 14, 1]);

        rng = sheet.getRangeByIndexes(rowStart + 12, 1, 1, 1);
        rng.numberFormat = [["m/d/yy HH:mm"]];
    }


    static async buildGlobalDataSheet(context: JsCtx)
    {
        let sheet: Excel.Worksheet = await Sheets.ensureSheetExists(context, GlobalDataBuilder.SheetName, BracketDataBuilder.SheetName, EnsureSheetPlacement.AfterGiven);

        await this.addGlobalDataToSheet(context, sheet, 0);
    }
}