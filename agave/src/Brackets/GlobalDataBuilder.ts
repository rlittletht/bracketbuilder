import { Sheets, EnsureSheetPlacement } from "../Interop/Sheets";
import { Ranges } from "../Interop/Ranges";
import { OADate } from "../Interop/Dates";
import { BracketDataBuilder } from "./BracketDataBuilder";
import { JsCtx } from "../Interop/JsCtx";

export class GlobalDataBuilder
{
    static SheetName: string = "TeamsAndFields";

    static DefaultField: string = "Ballfield";
    static DefaultStartTime: number = 0;

    static async addGlobalDataToSheet(context: JsCtx, sheet: Excel.Worksheet, rowStart: number)
    {
        let rng: Excel.Range = sheet.getRangeByIndexes(rowStart, 0, 7, 3);
        rng.values =
        [
            ["Tournament:", "", "TOURNAMENT TITLE"],
            ["SubTitle:", "", "(sub-title)"],
            ["Location:", "", "FIELD OF DREAMS PARK"],
            ["Address:", "", "123 Strikes Out Place, Williamsport"],
            ["Hosted:", "", "JACKIE ROBINSON"],
            ["Last Update:", "", OADate.ToOADate(new Date(Date.parse("8/21/2021"))) - (7 / 24)], // adjust for UTC
            ["FieldCount:", "", 2]
        ];

        await context.sync();
        rng = sheet.getRangeByIndexes(rowStart, 0, 7, 1);
        rng.format.font.bold = true;
        rng.format.font.size = 10;

        await Ranges.createOrReplaceNamedRangeByIndex(context, sheet, "TournamentTitle", [rowStart, 2]);
        await Ranges.createOrReplaceNamedRangeByIndex(context, sheet, "TournamentSubtitle", [rowStart + 1, 2]);
        await Ranges.createOrReplaceNamedRangeByIndex(context, sheet, "TournamentLocation", [rowStart + 2, 2]);
        await Ranges.createOrReplaceNamedRangeByIndex(context, sheet, "TournamentAddress", [rowStart + 3, 2]);
        await Ranges.createOrReplaceNamedRangeByIndex(context, sheet, "TournamentHost", [rowStart + 4, 2]);
        await Ranges.createOrReplaceNamedRangeByIndex(context, sheet, "LastUpdate", [rowStart + 5, 2]);
        await Ranges.createOrReplaceNamedRangeByIndex(context, sheet, "FieldCount", [rowStart + 6, 2]);

        rng = sheet.getRangeByIndexes(rowStart + 5, 2, 1, 1);
        rng.numberFormat = [["m/d/yy HH:mm"]];
    }


    static async buildGlobalDataSheet(context: JsCtx)
    {
        let sheet: Excel.Worksheet = await Sheets.ensureSheetExists(context, GlobalDataBuilder.SheetName, BracketDataBuilder.SheetName, EnsureSheetPlacement.AfterGiven);

        await this.addGlobalDataToSheet(context, sheet, 0);
    }
}