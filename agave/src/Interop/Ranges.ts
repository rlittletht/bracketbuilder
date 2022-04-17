
export class RangeInfo
{
    m_rowStart: number;
    m_rowCount: number;
    m_columnStart: number;
    m_columnCount: number;

    get FirstRow(): number { return this.m_rowStart; }
    get RowCount(): number { return this.m_rowCount; }
    get FirstColumn(): number { return this.m_columnStart; }
    get ColumnCount(): number { return this.m_columnCount; }
    get LastRow(): number { return this.m_rowStart + this.m_rowCount - 1; }
    get LastColumn(): number { return this.m_columnStart + this.m_columnCount - 1; }

    constructor(rowStart: number, rowCount: number, columnStart: number, columnCount: number)
    {
        this.m_rowStart = rowStart;
        this.m_rowCount = rowCount;
        this.m_columnStart = columnStart;
        this.m_columnCount = columnCount;
    }

    static isOverlappingSegment(seg1First: number, seg1Last: number, seg2First: number, seg2Last: number): boolean
    {
        // first row of range2 is within range1
        if (seg1First <= seg2First
            && seg2First <= seg1Last)
        {
            return true;
        }

        // last row of range2 is within range1
        if (seg1First <= seg2Last
            && seg2Last <= seg1Last)
        {
            return true;
        }

        // range2 begins before range1 and ends after range2
        if (seg2First <= seg1First
            && seg1Last <= seg2Last)
        {
            return true;
        }

        return false;
    }

    static isOverlappingRows(range1: RangeInfo, range2: RangeInfo): boolean
    {
        return this.isOverlappingSegment(range1.FirstRow, range1.LastRow, range2.FirstRow, range2.LastRow);
    }

    static isOverlappingColumns(range1: RangeInfo, range2: RangeInfo): boolean
    {
        return this.isOverlappingSegment(range1.FirstColumn, range1.LastColumn, range2.FirstColumn, range2.LastColumn);
    }

    static isOverlapping(range1: RangeInfo, range2: RangeInfo): boolean
    {
        return this.isOverlappingRows(range1, range2) && this.isOverlappingColumns(range1, range2);
    }


    /*----------------------------------------------------------------------------
        %%Function: BracketGame.getRangeInfoForNamedCell
    ----------------------------------------------------------------------------*/
    static async getRangeInfoForNamedCell(ctx: any, name: string): Promise<RangeInfo>
    {
        const nameObject: Excel.NamedItem = ctx.workbook.names.getItemOrNullObject(name);
        await ctx.sync();

        if (nameObject.isNullObject)
            return null;

        const range: Excel.Range = nameObject.getRange();
        range.load("rowIndex");
        range.load("rowCount");
        range.load("columnIndex");
        range.load("columnCount");

        await ctx.sync();

        return new RangeInfo(range.rowIndex, range.rowCount, range.columnIndex, range.columnCount);
    }
}

export class Ranges
{
    static colsMap: string[] =
    [
        "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U",
        "V", "W", "X", "Y", "Z", "AA", "AB", "AC", "AD", "AE", "AF", "AG", "AH", "AI", "AJ", "AK", "AL", "AM", "AN",
        "AO", "AP", "AQ", "AR", "AS", "AT", "AU", "AV", "AW", "AX", "AY", "AZ", "BA", "BB", "BC", "BD", "BE", "BF",
        "BG", "BH", "BI", "BJ", "BK", "BL", "BM", "BN", "BO", "BP", "BQ", "BR", "BS", "BT", "BU", "BV", "BW", "BX",
        "BY", "BZ",
    ];

    /*----------------------------------------------------------------------------
        %%Function: Ranges.getColName_1Based
    ----------------------------------------------------------------------------*/
    static getColName_1Based(col: number): string
    {
        if (col > this.colsMap.length)
            throw `cannot handle columns > ${this.colsMap.length}`;

        return this.colsMap[col - 1];
    }

    /*----------------------------------------------------------------------------
        %%Function: Ranges.getColName
    ----------------------------------------------------------------------------*/
    static getColName(col: number): string
    {
        return this.getColName_1Based(col + 1);
    }


    /*----------------------------------------------------------------------------
        %%Function: Ranges.addressFromCoordinates_1Based
    ----------------------------------------------------------------------------*/
    static addressFromCoordinates_1Based(addrFrom: [number, number], addrTo: [number, number]): string
    {
        if (addrFrom[1] - 1 > this.colsMap.length || (addrTo != null && addrTo[1] - 1 > this.colsMap.length))
            throw `cannot handle columns > ${this.colsMap.length}`;

        if (addrFrom[1] <= 0 || (addrTo != null && addrTo[1] <= 0))
            throw "row/column addresses are 1-based";

        let addrFinal: string = this.colsMap[addrFrom[1] - 1]
            .concat(addrFrom[0].toString());

        if (addrTo == null)
        {
            return addrFinal;
        }
        addrFinal = addrFinal.concat(":", this.colsMap[addrTo[1] - 1], addrTo[0].toString());

        return addrFinal;
    }


    /*----------------------------------------------------------------------------
        %%Function: Ranges.addressFromCoordinates
    ----------------------------------------------------------------------------*/
    static addressFromCoordinates(addrFrom: [number, number], addrTo: [number, number]): string
    {
        return this.addressFromCoordinates_1Based([addrFrom[0] + 1, addrFrom[1] + 1], addrTo == null ? null : [addrTo[0] + 1, addrTo[1] + 1]);
    }


    /*----------------------------------------------------------------------------
        %%Function: Ranges.ensureGlobalNameDeleted
    ----------------------------------------------------------------------------*/
    static async ensureGlobalNameDeleted(ctx: any, name: string)
    {
        const nameObject: Excel.NamedItem = ctx.workbook.names.getItemOrNullObject(name);
        await ctx.sync();

        if (nameObject.isNullObject)
            return;

        nameObject.delete();
        await ctx.sync();
    }


    /*----------------------------------------------------------------------------
        %%Function: Ranges.createOrReplaceNamedRange
    ----------------------------------------------------------------------------*/
    static async createOrReplaceNamedRange(ctx: any, name: string, rng: Excel.Range)
    {
        await Ranges.ensureGlobalNameDeleted(ctx, name);
        ctx.workbook.names.add(name, rng);
        await ctx.sync();
    }


    /*----------------------------------------------------------------------------
        %%Function: Ranges.createOrReplaceNamedRangeByIndex
    ----------------------------------------------------------------------------*/
    static async createOrReplaceNamedRangeByIndex(
        ctx: any,
        sheet: Excel.Worksheet,
        name: string,
        from: [number, number],
        to?: [number, number])
    {
        const rows: number = to ? to[0] - from[0] + 1 : 1;
        const cols: number = to ? to[1] - from[1] + 1 : 1;

        let rng: Excel.Range = sheet.getRangeByIndexes(from[0], from[1], rows, cols);
        await this.createOrReplaceNamedRange(ctx, name, rng);
    }

    /*----------------------------------------------------------------------------
        %%Function: Ranges.rangeFromRangeInfo
    ----------------------------------------------------------------------------*/
    static rangeFromRangeInfo(sheet: Excel.Worksheet, rangeInfo: RangeInfo): Excel.Range
    {
        if (rangeInfo == null)
            return null;

        return sheet.getRangeByIndexes(rangeInfo.FirstRow,
            rangeInfo.FirstColumn,
            rangeInfo.RowCount,
            rangeInfo.ColumnCount);
    }
}