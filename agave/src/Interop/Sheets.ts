import { JsCtx } from "./JsCtx";

export enum EnsureSheetPlacement
{
    First,
    Last,
    BeforeGiven,
    AfterGiven
}

export class Sheets
{
    static async ensureSheetExists(
        context: JsCtx,
        sSheetName: string,
        sheetRelativeToName: string = null,
        placement: EnsureSheetPlacement = EnsureSheetPlacement.Last): Promise<Excel.Worksheet>
    {
        // have to use any here because we don't have type information that knows about getItemOrNullObject.
        let worksheets: Excel.WorksheetCollection = context.Ctx.workbook.worksheets;
        let sheet: Excel.Worksheet = null;
        let sheetRelative: Excel.Worksheet = null;

        sheet = worksheets.getItemOrNullObject(sSheetName);
        if (sheetRelativeToName != null)
        {
            sheetRelative = worksheets.getItemOrNullObject(sheetRelativeToName);
        }

        await context.sync();

        if (sheet.isNullObject)
        {
            sheet = worksheets.add(sSheetName);
            if (sheetRelative != null
                && !sheetRelative.isNullObject
                && placement != EnsureSheetPlacement.First
                    && placement != EnsureSheetPlacement.Last)
            {
                sheetRelative.load("position");
                await context.sync();

                sheet.position = sheetRelative.position + EnsureSheetPlacement.AfterGiven ? 1 : 0;
            }

            if (placement == EnsureSheetPlacement.First)
                sheet.position = 0;

            await context.sync();

        }
        return sheet;
    }

    /*----------------------------------------------------------------------------
        %%Function: Sheets.findFirstEmptyRowAfterAllData

        find the first row to use following any data in the sheet (this will
        be the first row that is guaranteed to not have any data in the first
        column and no subsequent row will have any data in the first column)

        maxPossibleEmptyInterimRows tells us the max number of rows we have
        to scan to be sure there are no remaining rows with data in them
        (you can err on too large a number here, it just means we will scan
        farther down to make sure there is no data)
    ----------------------------------------------------------------------------*/
    static async findFirstEmptyRowAfterAllData(context: JsCtx, sheet: Excel.Worksheet, maxPossibleEmptyInterimRows: number): Promise<number>
    {
        let row: number = 0;
        let rowLast: number;
        let rowFirstEmpty: number = 0;
        let rng: Excel.Range;

        while (true)
        {
            rng = sheet.getRangeByIndexes(row, 0, maxPossibleEmptyInterimRows, 1);
            rowLast = row + maxPossibleEmptyInterimRows;

            rng.load("values");
            await context.sync();

            let rowFirst: number = row;

            while (row < rowLast)
            {
                if (rng.values[row - rowFirst][0])
                    rowFirstEmpty = row + 1;

                row++;
            }

            if (rowFirstEmpty < row - maxPossibleEmptyInterimRows)
                return rowFirstEmpty;
        }
    }
}