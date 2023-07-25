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
        let rng: Excel.Range = sheet.getRangeByIndexes(rowStart, 0, 7, 2);
        rng.values =
        [
            ["Tournament:", "TOURNAMENT TITLE"],
            ["SubTitle:", "(sub-title)"],
            ["Location:", "FIELD OF DREAMS PARK"],
            ["Address:", "123 Strikes Out Place, Williamsport"],
            ["Hosted:", "SOME LOCAL LEAGUE, DISTRICT 1"],
            ["Last Update:", OADate.ToOADate(new Date())], // adjust for UTC
            ["FieldCount:", 2]
        ];
        rng.format.horizontalAlignment = Excel.HorizontalAlignment.left;
        await context.sync();
        rng = sheet.getRangeByIndexes(rowStart, 0, 7, 1);
        rng.format.font.bold = true;
        rng.format.font.size = 10;

        await Ranges.createOrReplaceNamedRangeByIndex(context, sheet, "TournamentTitle", [rowStart, 1]);
        await Ranges.createOrReplaceNamedRangeByIndex(context, sheet, "TournamentSubtitle", [rowStart + 1, 1]);
        await Ranges.createOrReplaceNamedRangeByIndex(context, sheet, "TournamentLocation", [rowStart + 2, 1]);
        await Ranges.createOrReplaceNamedRangeByIndex(context, sheet, "TournamentAddress", [rowStart + 3, 1]);
        await Ranges.createOrReplaceNamedRangeByIndex(context, sheet, "TournamentHost", [rowStart + 4, 1]);
        await Ranges.createOrReplaceNamedRangeByIndex(context, sheet, "LastUpdate", [rowStart + 5, 1]);
        await Ranges.createOrReplaceNamedRangeByIndex(context, sheet, "FieldCount", [rowStart + 6, 1]);

        rng = sheet.getRangeByIndexes(rowStart + 5, 1, 1, 1);
        rng.numberFormat = [["m/d/yy HH:mm"]];
    }


    static async buildGlobalDataSheet(context: JsCtx)
    {
        let sheet: Excel.Worksheet = await Sheets.ensureSheetExists(context, GlobalDataBuilder.SheetName, BracketDataBuilder.SheetName, EnsureSheetPlacement.AfterGiven);

        await this.addGlobalDataToSheet(context, sheet, 0);
    }
}