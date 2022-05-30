import { Sheets, EnsureSheetPlacement } from "../Interop/Sheets";
import { Ranges } from "../Interop/Ranges";
import { OADate } from "../Interop/Dates";
import { BracketDataBuilder } from "./BracketDataBuilder";

export class GlobalDataBuilder
{
    static SheetName: string = "TournamentInfo";

    static async buildGlobalDataSheet(ctx: any)
    {
        let sheet: Excel.Worksheet = await Sheets.ensureSheetExists(ctx, GlobalDataBuilder.SheetName, BracketDataBuilder.SheetName, EnsureSheetPlacement.AfterGiven);

        let rng: Excel.Range = sheet.getRangeByIndexes(0, 0, 6, 2);
        rng.values =
        [
            ["Tournament:", "TOURNAMENT TITLE"],
            ["SubTitle:", "(SUB-TITLE))"],
            ["Location:", "FIELD OF DREAMS PARK"],
            ["Address:", "123 Strikes Out Place, Williamsport"],
            ["Hosted:", "JACKIE ROBINSON"],
            ["Last Update:", OADate.ToOADate(new Date(Date.parse("8/21/2021"))) - (7 / 24)] // adjust for UTC
            ];

        await ctx.sync();

        await Ranges.createOrReplaceNamedRangeByIndex(ctx, sheet, "TournamentTitle", [0, 1]);
        await Ranges.createOrReplaceNamedRangeByIndex(ctx, sheet, "TournamentSubtitle", [1, 1]);
        await Ranges.createOrReplaceNamedRangeByIndex(ctx, sheet, "TournamentLocation", [2, 1]);
        await Ranges.createOrReplaceNamedRangeByIndex(ctx, sheet, "TournamentAddress", [3, 1]);
        await Ranges.createOrReplaceNamedRangeByIndex(ctx, sheet, "TournamentHost", [4, 1]);
        await Ranges.createOrReplaceNamedRangeByIndex(ctx, sheet, "LastUpdate", [5, 1]);

        rng = sheet.getRangeByIndexes(5, 1, 1, 1);
        rng.numberFormat = [["m/d/yy HH:mm"]];
        await ctx.sync();
    }
}