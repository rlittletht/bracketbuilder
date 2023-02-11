import { Sheets, EnsureSheetPlacement } from "../Interop/Sheets";
import { Ranges } from "../Interop/Ranges";
import { OADate } from "../Interop/Dates";
import { BracketDataBuilder } from "./BracketDataBuilder";

export class GlobalDataBuilder
{
    static SheetName: string = "TeamsAndFields";

    static async addGlobalDataToSheet(ctx: any, sheet: Excel.Worksheet, rowStart: number)
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

        await ctx.sync();
        rng = sheet.getRangeByIndexes(rowStart, 0, 7, 1);
        rng.format.font.bold = true;
        rng.format.font.size = 10;

        await Ranges.createOrReplaceNamedRangeByIndex(ctx, sheet, "TournamentTitle", [rowStart, 2]);
        await Ranges.createOrReplaceNamedRangeByIndex(ctx, sheet, "TournamentSubtitle", [rowStart + 1, 2]);
        await Ranges.createOrReplaceNamedRangeByIndex(ctx, sheet, "TournamentLocation", [rowStart + 2, 2]);
        await Ranges.createOrReplaceNamedRangeByIndex(ctx, sheet, "TournamentAddress", [rowStart + 3, 2]);
        await Ranges.createOrReplaceNamedRangeByIndex(ctx, sheet, "TournamentHost", [rowStart + 4, 2]);
        await Ranges.createOrReplaceNamedRangeByIndex(ctx, sheet, "LastUpdate", [rowStart + 5, 2]);
        await Ranges.createOrReplaceNamedRangeByIndex(ctx, sheet, "FieldCount", [rowStart + 6, 2]);

        rng = sheet.getRangeByIndexes(rowStart + 5, 2, 1, 1);
        rng.numberFormat = [["m/d/yy HH:mm"]];
    }


    static async buildGlobalDataSheet(ctx: any)
    {
        let sheet: Excel.Worksheet = await Sheets.ensureSheetExists(ctx, GlobalDataBuilder.SheetName, BracketDataBuilder.SheetName, EnsureSheetPlacement.AfterGiven);

        await this.addGlobalDataToSheet(ctx, sheet, 0);
    }
}