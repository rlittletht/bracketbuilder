
import { JsCtx } from "../Interop/JsCtx";
import { Ranges } from "../Interop/Ranges";
import { EnsureSheetPlacement, Sheets } from "../Interop/Sheets";
import { BracketDefinition, GameDefinition } from "./BracketDefinitions";
import { GridBuilder } from "./GridBuilder";

export class BracketInfoBuilder
{
    static SheetName: string = "BracketInfo";

    /*----------------------------------------------------------------------------
        %%Function: BracketInfoBuilder.buildBracketInfoSheet

        Build the Bracket Data sheet (which has results and field schedule times
        in it)
    ----------------------------------------------------------------------------*/
    static async buildBracketInfoSheet(context: JsCtx, bracketChoice: string, bracketDefinition: BracketDefinition)
    {
        let sheet: Excel.Worksheet = await Sheets.ensureSheetExists(context, BracketInfoBuilder.SheetName, GridBuilder.SheetName, EnsureSheetPlacement.AfterGiven);
        let rng: Excel.Range = sheet.getRangeByIndexes(0, 0, 1, 2);
        await context.sync();

        rng.values = [["Bracket", bracketChoice]];

        await context.sync();

        await Ranges.createOrReplaceNamedRange(context, "BracketChoice", sheet.getRangeByIndexes(0, 1, 1, 1));

        const rowResultsFirst: number = 2;
        const rowResultsLast: number = rowResultsFirst + bracketDefinition.games.length; // include the heading
        const rowFieldScheduleFirst: number = rowResultsLast + 2;
        const rowFieldScheduleLast: number = rowFieldScheduleFirst + bracketDefinition.games.length;

        let rngResults: Excel.Range = sheet.getRangeByIndexes(rowResultsFirst, 0, rowResultsLast - rowResultsFirst + 1, 4);
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

        rngResults.formulas = formulasResults;
        let rngFields: Excel.Range = sheet.getRangeByIndexes(rowFieldScheduleFirst, 0, rowFieldScheduleLast - rowFieldScheduleFirst + 1, 4);
        rngFields.formulas = formulasFields;

        let rngFieldsDates: Excel.Range = sheet.getRangeByIndexes(rowFieldScheduleFirst, 2, rowFieldScheduleLast - rowFieldScheduleFirst + 1, 1);
        rngFieldsDates.numberFormat = [["m/d/yy"]];

        let rngFieldsTimes: Excel.Range = sheet.getRangeByIndexes(rowFieldScheduleFirst, 3, rowFieldScheduleLast - rowFieldScheduleFirst + 1, 1);
        rngFieldsTimes.numberFormat = [["h:mm AM/PM"]];;

        // lastly format the headers
        let rngResultsHeader: Excel.Range = sheet.getRangeByIndexes(rowResultsFirst, 0, 1, 1);

        rngResultsHeader.format.font.bold = true;
        rngResultsHeader.format.font.size = 22;

        let rngFieldsHeader: Excel.Range = sheet.getRangeByIndexes(rowFieldScheduleFirst, 0, 1, 1);
        rngFieldsHeader.format.font.bold = true;
        rngFieldsHeader.format.font.size = 22;

        await context.sync();
    }
}