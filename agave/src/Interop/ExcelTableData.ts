

export class ExcelTableData
{
    header: any[][];
    headerWanted: string[];
    data: any[][];
    headerMapping: any;

    // map the headers we want to the column index in the actual data
    m_mapExcelCurrentToIndex: Map<string, number> = new Map<string, number>();
    s_mapRequestedToExcelCurrent: Map<string, number> = new Map<string, number>();

    /*----------------------------------------------------------------------------
        %%Function: ExcelTableData.CreateFromCachedExcelTable

        Create an ExcelTableData for cached data. This will allow later lookups
        of data with conversion to the requested format
    ----------------------------------------------------------------------------*/
    static CreateFromCachedExcelTable(sTable: string, header: any[][], dataBody: any[][], sHeaders: string[], fRequired: boolean): ExcelTableData
    {
        const tableData = new ExcelTableData();

        tableData.data = dataBody;
        tableData.header = header;
        tableData.headerWanted = sHeaders;

        let rgExcelHeader: string[] = header[0]; // get the first row (there's only one row anyway)
        const data: any[] = [];

        let i: number = 0;

        while (i < rgExcelHeader.length)
        {
            tableData.m_mapExcelCurrentToIndex.set(rgExcelHeader[i].toUpperCase(), i);
            i++;
        }

        for (let sItem of sHeaders)
        {
            let iCol: number;
            let sLookup: string = sItem.toUpperCase();

            if (tableData.m_mapExcelCurrentToIndex.has(sLookup))
            {
                tableData.s_mapRequestedToExcelCurrent.set(sItem, tableData.m_mapExcelCurrentToIndex.get(sLookup));
            }
            else
            {
                if (fRequired)
                    throw new Error("could not find required header field '" + sItem + "' in excel table " + sTable);

                tableData.s_mapRequestedToExcelCurrent.set(sItem, -1);
            }
        }

        return tableData;
    }

    /*----------------------------------------------------------------------------
        %%Function: ExcelTableData.GetConvertedValueObjects

        return an array of objects with all the requested header data
    ----------------------------------------------------------------------------*/
    GetConvertedValueObjects(): any[]
    {
        const converted: any[] = [];

        for (const row of this.data)
        {
            const item = {};

            for (const header of this.headerWanted)
            {
                if (this.s_mapRequestedToExcelCurrent.get(header) === -1)
                    item[header] = null;
                else
                    item[header] = row[this.s_mapRequestedToExcelCurrent.get(header)];
            }

            converted.push(item);
        }

        return converted;
    }

    /*----------------------------------------------------------------------------
        %%Function: ExcelTableData.GetConvertedValueArray

        return an array of rows that conform to the requested header ordering
    ----------------------------------------------------------------------------*/
    GetConvertedValueArray(): any[][]
    {
        const converted: any[][] = [];

        for (const row of this.data)
        {
            const item: any[] = [];

            for (const header of this.headerWanted)
            {
                if (this.s_mapRequestedToExcelCurrent[header] === -1)
                    item.push(null);
                else
                    item.push(row[this.s_mapRequestedToExcelCurrent[header]]);
            }

            converted.push(item);
        }

        return converted;
    }
}

