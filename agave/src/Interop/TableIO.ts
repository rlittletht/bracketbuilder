import { JsCtx } from "./JsCtx";
import { ExcelTableData } from "./ExcelTableData";

export class TableIO
{
    // given a list of headers (in the order we would like to match them), try to read
    // the data from the excel table with those headers. If a set of headers doesn't match,
    // go on to the next one in the list of headers to try.  if the last one doesn't succeed,
    // then fail
    static async readDataFromExcelTableWithFallback(
        context: JsCtx,
        sTable: string,
        rgsHeaders: string[][]): Promise<Array<any>>
    {
        let data: any[] = null;
        let iHeader: number = 0;
        let ePropagate: any;

        while (iHeader < rgsHeaders.length)
        {
            try
            {
                data = await TableIO.readDataFromExcelTable(context, sTable, rgsHeaders[iHeader], true);
            }
            catch (e)
            {
                data = null;
                ePropagate = e;
            }

            if (data != null)
                return data;

            iHeader++;
        }
        throw new Error(ePropagate);
    }

    /*----------------------------------------------------------------------------
        %%Function: TableIO.readDataFromCachedExcelTable

        Given a set of headersWanted, and the actual header and dataBody for
        a table (already read somewhere else), return an array of values
        conforming to the array of headersWanted.  If fRequired is true,
        then throw if any headerWanted is missing; else, fill in null for
        headerWanted columns not found
    ----------------------------------------------------------------------------*/
    static readDataFromCachedExcelTable(
        sTable: string,
        header: any[][],
        dataBody: any[][],
        sHeaders: string[],
        fRequired: boolean): any[]
    {
        const tableData = ExcelTableData.CreateFromCachedExcelTable(sTable, header, dataBody, sHeaders, fRequired);

        return tableData.GetConvertedValueObjects();
    }

    // given a table name in the workbook, return an array of objects constructed of fields from sHeaders.
    // if fRequired is true, then throw if all the header fields are not present in the excel table.
    // returns null if there is no table in the workbook matching sTable
    static async readDataFromExcelTable(
        context: JsCtx,
        sTable: string,
        sHeaders: string[],
        fRequired: boolean): Promise<any[]>
    {
        let workbook: Excel.Workbook = context.Ctx.workbook;
        let table: Excel.Table;
        let data: Array<any> = new Array<any>();

        try
        {
            table = workbook.tables.getItem(sTable);
            await context.sync();
        }
        catch (e)
        {
            return null;
        }

        let rngExcelHeader: Excel.Range = table.getHeaderRowRange();
        rngExcelHeader.load("values");
        rngExcelHeader.load("columnCount");
        await context.sync();

        let rangeValues: Excel.Range = table.getDataBodyRange();
        let rowCollection: Excel.TableRowCollection = table.rows;

        rowCollection.load("count");
        await context.sync();

        let rowCount: number = rowCollection.count;
        let dataBody: any[][] = [];

        // make sure there's something to load...
        if (rowCount != 0)
        {
            rangeValues.load("values");
            await context.sync();

            dataBody = rangeValues.values;
        }

        return this.readDataFromCachedExcelTable(sTable, rngExcelHeader.values, dataBody, sHeaders, fRequired);
    }
}