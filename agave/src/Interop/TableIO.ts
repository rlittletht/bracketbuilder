import { JsCtx } from "./JsCtx";

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
        throw Error(ePropagate);
    }


    // given a table name in the workbook, return an array of objects constructed of fields from sHeaders.
    // if fRequired is true, then throw if all the header fields are not present in the excel table.
    // returns null if there is no table in the workbook matching sTable
    static async readDataFromExcelTable(
        context: JsCtx,
        sTable: string,
        sHeaders: string[],
        fRequired: boolean): Promise<Array<any>>
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

        let rgExcelHeader: string[] = rngExcelHeader.values[0]; // get the first row (there's only one row anyway)
        let mapRequestedToExcelCurrent: Map<string, number> = new Map<string, number>();

        let i: number = 0;

        while (i < rgExcelHeader.length)
        {
            mapRequestedToExcelCurrent.set(rgExcelHeader[i].toUpperCase(), i);
            i++;
        }

        let rangeValues: Excel.Range = table.getDataBodyRange();
        let headerMapping: any = {};

        for (let sItem of sHeaders)
        {
            let iCol: number;
            let sLookup: string = sItem.toUpperCase();

            if (mapRequestedToExcelCurrent.has(sLookup))
            {
                headerMapping[sItem] = mapRequestedToExcelCurrent.get(sLookup);
            }
            else
            {
                if (fRequired)
                    throw Error("could not find required header field '" + sItem + "' in excel table " + sTable);

                headerMapping[sItem] = -1;
            }
        }

        let rowCollection: Excel.TableRowCollection = table.rows;
        rowCollection.load("count");
        await context.sync();

        let rowCount: number = rowCollection.count;
        // make sure there's something to load...
        if (rowCount != 0)
        {
            rangeValues.load("values");
            await context.sync();

            for (let rgRow of rangeValues.values)
            {
                let item: any = {};

                for (let sItem of sHeaders)
                {
                    if (headerMapping[sItem] === -1)
                        item[sItem] = null;
                    else
                        item[sItem] = rgRow[headerMapping[sItem]];
                }

                data.push(item);
            }
        }

        return data;
    }
}