

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
}