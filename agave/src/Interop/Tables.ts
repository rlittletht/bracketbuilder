
import { IFastTables } from "./FastTables";
import { Arrays } from "./Arrays";
import { Ranges } from "./Ranges";
import { JsCtx } from "./JsCtx";

export class Tables
{
    // if you pass in a header describing the data, then this will rearrange the data to match the existing
    // excel table (adding columns as needed, preserving extra columns)

    // we jump through some funky hoops here to allow appendTableFast to be able to work using addRowsAsync
    // (we have to break it out of the Excel.Run...)
    static async appendArrayToTable(fastTables: IFastTables,
                                    sTable: string,
                                    data: Array<Array<string>>,
                                    header: Array<string>)
    {
        let rgColsToPreserve: number[] = null;
        let rgFormulasPreserve: string[];
        let dataToInsert: Array<Array<string>> = data;

        await Excel.run(async (ctx) =>
        {
            const context: JsCtx = new JsCtx(ctx);
            let table: Excel.Table = context.Ctx.workbook.tables.getItem(sTable);
            table.load("worksheet");
            await context.sync();

            let sheet: Excel.Worksheet = table.worksheet;
            let mapNew: Map<string, number> = null;
            let rgNewToOld: number[];

            // first, see if the table headers need to be updated
            if (header != null)
            {
                [mapNew, rgNewToOld, rgColsToPreserve] = await this.matchTableHeader(context, table, header);

                dataToInsert = new Array<Array<string>>();

                for (let item of data)
                {
                    dataToInsert.push(Arrays.createArrayFromArrayMapping(item, rgNewToOld, true /*fAvoidNull*/));
                }
            }

            rgFormulasPreserve = await this.GetFormulasToSave(context, table, rgColsToPreserve);
            context.releaseAllTrackedItems();
        });

        await fastTables.appendTableFast(sTable, dataToInsert);

        await Excel.run(async (ctx) =>
        {
            const context: JsCtx = new JsCtx(ctx);
            let table: Excel.Table = context.Ctx.workbook.tables.getItem(sTable);

            await this.RestoreFormulas(context, table, rgColsToPreserve, rgFormulasPreserve);
            context.releaseAllTrackedItems();
        });
    }

    static async appendArrayToTableSlow(
        context: JsCtx,
        sTable: string,
        data: Array<Array<string>>,
        header: Array<string>)
    {
        let rgColsToPreserve: number[] = null;
        let rgFormulasPreserve: string[];
        let dataToInsert: Array<Array<string>> = data;

        if (dataToInsert.length == 0)
            return;

        let table: Excel.Table = context.Ctx.workbook.tables.getItem(sTable);

        table.load("worksheet");
        await context.sync();

        let sheet: Excel.Worksheet = table.worksheet;
        let mapNew: Map<string, number> = null;
        let rgNewToOld: number[];

        // first, see if the table headers need to be updated
        if (header != null)
        {
            [mapNew, rgNewToOld, rgColsToPreserve] = await this.matchTableHeader(context, table, header);

            dataToInsert = new Array<Array<string>>();

            for (let item of data)
            {
                dataToInsert.push(Arrays.createArrayFromArrayMapping(item, rgNewToOld, true /*fAvoidNull*/));
            }
        }

        rgFormulasPreserve = await this.GetFormulasToSave(context, table, rgColsToPreserve);
        let range: Excel.Range = table.getDataBodyRange().getLastRow();

        range.load("address");
        range.load("rowIndex");
        range.load("columnIndex");

        await context.sync();

        let sAddress: string = Ranges.addressFromCoordinates_1Based(
            [range.rowIndex + 1, range.columnIndex + 1],
            [range.rowIndex + dataToInsert.length, range.columnIndex + dataToInsert[0].length]);

        range = sheet.getRange(sAddress);
        range.load("values");
        await context.sync();

        // no need to require this since it doesn't speed anything up...
        // (<any>context.Ctx.workbook.application).suspendApiCalculationUntilNextSync();
        range.values = dataToInsert;
        await context.sync();

        table = context.Ctx.workbook.tables.getItem(sTable);

        await this.RestoreFormulas(context, table, rgColsToPreserve, rgFormulasPreserve);
        await context.sync();

        return;
    }

    // match the given header to the tables real header. 
    // if there are columns missing, add them. 
    // if there are extra columes, that's fine, ignore them.
    // returns a tuple:
    //      mapping of given header column names to indexes into the real table in the sheet.
    //      mapping of new columns to old (just as an array of the new columns) -- (-1) means there is now given header column name for the existing excel table
    //      array of column indexes that aren't present in the new data, and should have their formulas preserved... (this list is ZERO BASED. if you use this to index into the column collection, it needs to be ONE BASED)
    static async matchTableHeader(
        context: JsCtx,
        table: Excel.Table,
        rgsHeaderRequested: string[]): Promise<[Map<string, number>, number[], number[]]>
    {
        let rngExcelHeader: Excel.Range = table.getHeaderRowRange();
        rngExcelHeader.load("values");
        rngExcelHeader.load("columnCount");

        await context.sync();

        let rgExcelHeader: string[] = rngExcelHeader.values[0]; // get the first row (there's only one row anyway)
        let mapRequestedToExcelCurrent: Map<string, number> = new Map<string, number>();
        let rgColsToPreserve: Array<number> = new Array<number>();

        let i: number = 0;

        while (i < rgExcelHeader.length)
        {
            mapRequestedToExcelCurrent.set(rgExcelHeader[i].toUpperCase(), i);
            i++;
        }

        i = 0;

        let mapRequestedToExcelNew: Map<string, number> = new Map<string, number>();
        let rgMissingItems: Array<[string, number]> = new Array<[string, number]>();

        while (i < rgsHeaderRequested.length)
        {
            let sExcelHeadingMatch: string = rgsHeaderRequested[i].toUpperCase(); // all caps version for matching

            if (mapRequestedToExcelCurrent.has(sExcelHeadingMatch))
                mapRequestedToExcelNew.set(sExcelHeadingMatch, i);
            else
                rgMissingItems.push([rgsHeaderRequested[i], i]); // don't push the all caps version
            i++;
        }

        // mapNew is the forwards mapping; create the backwards mapping
        let rgMapExcelToRequested: number[] = new Array<number>();
        i = 0;

        while (i < rgExcelHeader.length)
        {
            let iRequestedHeader: number = -1;
            let sExcelHeadingMatch: string = rgExcelHeader[i].toUpperCase(); // all caps version for matching

            if (mapRequestedToExcelNew.has(sExcelHeadingMatch))
                iRequestedHeader = mapRequestedToExcelNew.get(sExcelHeadingMatch);
            else
                rgColsToPreserve.push(i);

            rgMapExcelToRequested.push(iRequestedHeader);
            i++;
        }

        if (rgMissingItems.length == 0)
            return [mapRequestedToExcelNew, rgMapExcelToRequested, rgColsToPreserve];

        let iColNewHeader: number = rngExcelHeader.columnCount;
        let iColMissing: number = 0;

        let cols: Excel.TableColumnCollection = table.columns;
        while (iColMissing < rgMissingItems.length)
        {
            let sHeaderRequested: string;
            let iColRequested: number;

            [sHeaderRequested, iColRequested] = rgMissingItems[iColMissing];

            cols.add(-1, null, sHeaderRequested);
            mapRequestedToExcelNew.set(sHeaderRequested.toUpperCase(), iColNewHeader);
            // don't forget to add this to the backwards mapping as well (we missed
            // it before because it wasn't part of the current excel table)
            rgMapExcelToRequested.push(iColRequested);
            iColNewHeader++;
            iColMissing++;
        }

        await context.sync();
        return [mapRequestedToExcelNew, rgMapExcelToRequested, rgColsToPreserve];
    }

    static async isEmptyTable(context: JsCtx, table: Excel.Table): Promise<boolean>
    {
        let rows = table.rows;

        rows.load("count");
        await context.sync();

        if (rows.count == 0)
            return true;
        else
            return false;
    }

    static async emptyTable(context: JsCtx, table: Excel.Table): Promise<Excel.Table>
    {
        let range = table.getDataBodyRange();
        let rows = table.rows;

        rows.load("count");
        await context.sync();

        if (rows.count == 0)
            return table;

        range = range.getEntireRow();
        range.delete("Up");
        await context.sync();

        return table;
    }

    static async emptyTableSlow(context: JsCtx, table: Excel.Table): Promise<Excel.Table>
    {
        let range = table.getDataBodyRange();
        range.load("rowCount");
        await context.sync();

        let cRows = range.rowCount;

        let rows: any = table.rows;

        await context.sync();

        if (cRows == 1)
        {
            // figure out if this row is empty, or has real content. if its just the "new row" line, then it will throw...
            try
            {
                let row = rows.getItemAt(0);
                row.load("index");
                await context.sync();
            }
            catch (e)
            {
                return null;
            }
        }

        while (cRows-- > 0)
        {
            let row = rows.getItemAt(cRows);
            row.delete();
            await context.sync();
        }
        await context.sync();

        return table;
    }

    static async appendTableSlow(context: JsCtx,
                                 sheet: Excel.Worksheet,
                                 table: Excel.Table,
                                 dataToInsert: Array<Array<string>>): Promise<Excel.Table>
    {
        if (dataToInsert.length == 0)
        {
            return table;
        }

        let range: Excel.Range = table.getDataBodyRange().getLastRow();

        range.load("address");
        range.load("rowIndex");
        range.load("columnIndex");

        await context.sync();

        let sAddress: string = Ranges.addressFromCoordinates_1Based([range.rowIndex + 1, range.columnIndex + 1],
            [range.rowIndex + dataToInsert.length, range.columnIndex + dataToInsert[0].length]);

        range = sheet.getRange(sAddress);
        range.load("values");
        await context.sync();

        // no need to require this since it doesn't speed anything up...
        // (<any>context.Ctx.workbook.application).suspendApiCalculationUntilNextSync();
        range.values = dataToInsert;
        await context.sync();
        return table;
    }


    static async GetFormulasToSave(
        context: JsCtx,
        table: Excel.Table,
        rgColsToPreserve: number[]): Promise<string[]>
    {
        let rgFormulasPreserve: Array<string> = new Array<string>();
        let fEmptyTable: boolean;

        fEmptyTable = await this.isEmptyTable(context, table);

        // if its an empty table, then we have extra work to do -- we have to first populate at least a single row to get
        // the calculated columns to fill in their formulas
        if (fEmptyTable)
        {
            // first, figure out which cell we can put data into that won't clobber a formula!
            let iColToUse: number = Arrays.GetFirstValueNotInList(rgColsToPreserve);

            table.getDataBodyRange().getCell(0, iColToUse).values = [[0]];
            await context.Ctx.sync;

            // at this point, all the formula values should be populated
        }

        for (let colIndex of rgColsToPreserve)
        {
            let r: Excel.Range = table.columns.getItemAt(colIndex).getDataBodyRange().getCell(0, 0);

            r.load("formulas");
            await context.sync();

            rgFormulasPreserve.push(r.formulas[0][0]);
        }

        if (fEmptyTable)
        {
            // better empty the table again...
            await this.emptyTable(context, table);
            await context.sync();
        }
        return rgFormulasPreserve;
    }

    static async getTableOrNull(context: JsCtx, sheet: Excel.Worksheet = null, tableName: string): Promise<Excel.Table>
    {
        let table: Excel.Table = null;

        try
        {
            if (sheet != null)
                table = sheet.tables.getItem(tableName);
            else
                table = context.Ctx.workbook.tables.getItem(tableName);

            await context.sync();
            return table;
        }
        catch (e)
        {
            return null;
        }
    }

    static async ensureTableExists(
        context: JsCtx,
        sheet: any,
        fastTables: IFastTables,
        sTable: string,
        sShape: string,
        header: string[]): Promise<Excel.Table>
    {
        let table: Excel.Table = await this.getTableOrNull(context, sheet, sTable);

        if (table == null)
        {
            // first, see if we have a fast table binding for this and if we have to remove it
            // (because it won't be valid after this)
            if (fastTables != null)
                fastTables.abandonTableBinding(sTable);

            table = sheet.tables.add(sShape);
            await context.sync();

            table.name = sTable;
            table.getHeaderRowRange().values = [header];

            await context.sync();
        }

        return table;
    }

    static async RestoreFormulas(
        context: JsCtx,
        table: Excel.Table,
        rgColsToPreserve: number[],
        rgFormulasPreserve: string[])
    {
        let iPreserve: number = 0;

        for (let colIndex of rgColsToPreserve)
        {
            let r: Excel.Range = table.columns.getItemAt(colIndex).getDataBodyRange();

            r.formulas = <any>rgFormulasPreserve[iPreserve++];
            await context.sync();
        }
    }
}