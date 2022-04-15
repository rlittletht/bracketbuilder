
import { BracketDefinition, GameDefinition } from "./BracketDefinitions";
import { Sheets } from "../Interop/Sheets";
import { Ranges } from "../Interop/Ranges";

export class BracketDataBuilder
{
    /*----------------------------------------------------------------------------
        %%Function: BracketDataBuilder.buildBracketDataSheet

        Build the Bracket Data sheet (which has results and field schedule times
        in it)
    ----------------------------------------------------------------------------*/
    static async buildBracketDataSheet(ctx: any, bracketChoice: string, bracketDefinition: BracketDefinition)
    {
        let sheet: Excel.Worksheet = await Sheets.ensureSheetExists(ctx, "BracketData");
        let rng: Excel.Range = sheet.getRangeByIndexes(0, 0, 1, 1);
        await ctx.sync();

        rng.values = [[bracketChoice]];
        await ctx.sync();

        await Ranges.createOrReplaceNamedRange(ctx, "BracketChoice", rng);
        await ctx.sync();

        const rowResultsFirst: number = 2;
        const rowResultsLast: number = rowResultsFirst + bracketDefinition.games.length; // include the heading
        const rowFieldScheduleFirst: number = rowResultsLast + 2;
        const rowFieldScheduleLast: number = rowFieldScheduleFirst + bracketDefinition.games.length;

        rng = sheet.getRangeByIndexes(rowResultsFirst, 0, rowResultsLast - rowResultsFirst + 1, 4);
        let formulasResults: any[][] = [];
        let formulasFields: any[][] = [];

        formulasResults.push(["Results", null, null, null]);
        formulasFields.push(["Field Schedule", null, null, null]);

        bracketDefinition.games.forEach(
            (_bracket: GameDefinition, gameNum: number) =>
            {
                let addressResultGameKey: string = Ranges.addressFromCoordinates([rowResultsFirst + 1 + gameNum, 0], null);
                let addressFieldGameKey: string = Ranges.addressFromCoordinates([rowFieldScheduleFirst + 1 + gameNum, 0], null);
                formulasResults.push(
                    [
                        `G${gameNum + 1}`,
                        `Game${gameNum + 1}`,
                        `=IFERROR(INDIRECT(BracketChoice & "_" & ${addressResultGameKey} & "_1") & " (" & OFFSET(INDIRECT(BracketChoice & + "_" & ${addressResultGameKey} & "_1"),0,1) & ")","")`,
                        `=IFERROR(INDIRECT(BracketChoice & "_" & ${addressResultGameKey} & "_2") & " (" & OFFSET(INDIRECT(BracketChoice & + "_" & ${addressResultGameKey} & "_2"),0,1) & ")","")`
                    ]);
                formulasFields.push(
                    [
                        `Game${gameNum + 1}`,
                        `=IFERROR(OFFSET(INDIRECT(BracketChoice & "_" & ${addressFieldGameKey}),0, -1),"")`,
                        `=IFERROR(OFFSET(OFFSET(INDIRECT(BracketChoice & "_" & ${addressFieldGameKey}),2, -1),-ROW(OFFSET(INDIRECT(BracketChoice & "_" & ${addressFieldGameKey}),2, -1)) + 6,0),"")`,
                        `=IFERROR(OFFSET(INDIRECT(BracketChoice & "_" & ${addressFieldGameKey}),2, -1),"")`
                    ]);
            });

        rng.formulas = formulasResults;
        await ctx.sync();
        rng = sheet.getRangeByIndexes(rowFieldScheduleFirst, 0, rowFieldScheduleLast - rowFieldScheduleFirst + 1, 4);
        rng.formulas = formulasFields;
        await ctx.sync();

        // lastly format it
        rng = sheet.getRangeByIndexes(rowResultsFirst, 0, 1, 1);
        rng.load("format");
        await ctx.sync();

        rng.format.font.bold = true;
        rng.format.font.size = 22;
        await ctx.sync();

        rng = sheet.getRangeByIndexes(rowFieldScheduleFirst, 0, 1, 1);
        rng.load("format");
        await ctx.sync();

        rng.format.font.bold = true;
        rng.format.font.size = 22;
        await ctx.sync();
    }
}