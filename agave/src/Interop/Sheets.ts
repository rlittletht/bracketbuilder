

export class Sheets
{
    static async ensureSheetExists(ctx: any, sSheetName: string): Promise<Excel.Worksheet>
    {
        // have to use any here because we don't have type information that knows about getItemOrNullObject.
        let worksheets: Excel.WorksheetCollection = ctx.workbook.worksheets;
        let sheet: Excel.Worksheet = null;

        sheet = worksheets.getItemOrNullObject(sSheetName);
        await ctx.sync();

        if (sheet.isNullObject)
        {
            sheet = worksheets.add(sSheetName);
            await ctx.sync();
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
    static async findFirstEmptyRowAfterAllData(ctx: any, sheet: Excel.Worksheet, maxPossibleEmptyInterimRows: number): Promise<number>
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
            await ctx.sync();

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