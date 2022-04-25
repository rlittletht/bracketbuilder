
export enum RangeOverlapKind
{
    None,
    Partial,
    Equal
}


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

    static createFromRangeInfo(range: RangeInfo): RangeInfo
    {
        if (range == null)
            return null;

        return new RangeInfo(range.FirstRow, range.RowCount, range.FirstColumn, range.ColumnCount);
    }

    static createFromCorners(rangeTopLeft: RangeInfo, rangeBottomRight: RangeInfo): RangeInfo
    {
        if (rangeTopLeft == null)
            return null;

        if (rangeBottomRight == null)
            return this.createFromRangeInfo(rangeTopLeft);

        return new RangeInfo(
            rangeTopLeft.FirstRow,
            rangeBottomRight.FirstRow - rangeTopLeft.FirstRow + 1,
            rangeTopLeft.FirstColumn,
            rangeBottomRight.FirstColumn - rangeTopLeft.FirstColumn + 1);
    }

    static createFromRange(range: Excel.Range): RangeInfo
    {
        if (range == null || range.isNullObject)
            return null;

        return new RangeInfo(range.rowIndex, range.rowCount, range.columnIndex, range.columnCount);
    }

    offset(dRows: number, newRowCount: number, dColumns: number, newColumnCount: number): RangeInfo
    {
        return new RangeInfo(this.FirstRow + dRows, newRowCount, this.FirstColumn + dColumns, newColumnCount);
    }

    isEqual(range: RangeInfo): boolean
    {
        if (this.m_rowStart == range.m_rowStart
            && this.m_rowCount == range.m_rowCount
            && this.m_columnCount == range.m_columnCount
            && this.m_columnStart == range.m_columnStart)
        {
            return true;
        }

        return false;
    }

    topLeft(): RangeInfo
    {
        return new RangeInfo(this.FirstRow, 1, this.FirstColumn, 1);
    }

    bottomRight(): RangeInfo
    {
        return new RangeInfo(this.LastRow, 1, this.LastColumn, 1);
    }

    setColumn(column: number)
    {
        this.m_columnStart = column;
    }

    setRow(row: number)
    {
        this.m_rowStart = row;
    }

    setLastRow(row: number)
    {
        this.m_rowCount = row - this.FirstRow + 1;
    }

    newSetColumn(column: number): RangeInfo
    {
        return new RangeInfo(this.FirstRow, this.RowCount, column, this.ColumnCount);
    }

    newSetRow(row: number): RangeInfo
    {
        return new RangeInfo(row, this.RowCount, this.FirstColumn, this.ColumnCount);
    }

    fuzzyMatchRow(row: number, rowTolerance: number): boolean
    {
        return (Math.abs(this.FirstRow - row) <= rowTolerance);
    }

    fuzzyMatchColumn(column: number, columnTolerance: number): boolean
    {
        return (Math.abs(this.FirstColumn - column) <= columnTolerance);
    }

    toString(): string
    {
        return `[${this.FirstRow},${this.FirstColumn}]-[${this.LastRow},${this.LastColumn}]`;
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

    static isOverlapping(range1: RangeInfo, range2: RangeInfo): RangeOverlapKind
    {
        if (range1 == null && range2 == null)
            return RangeOverlapKind.Equal;

        if (range1 == null || range2 == null)
            return RangeOverlapKind.None;

        if (this.isOverlappingRows(range1, range2) && this.isOverlappingColumns(range1, range2))
        {
            return range1.isEqual(range2) ? RangeOverlapKind.Equal : RangeOverlapKind.Partial;
        }

        return RangeOverlapKind.None;
    }


    /*----------------------------------------------------------------------------
        %%Function: BracketGame.getRangeInfoForNamedCell

        NOTE: Often named ranges get broken references (because rows are deleted,
        moved, etc). We are robust to rebuild them when we insert games, so we 
        also have to be robustin getting ranges for them here
    ----------------------------------------------------------------------------*/
    static async getRangeInfoForNamedCell(ctx: any, name: string): Promise<RangeInfo>
    {
        try
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
        catch (e)
        {
            return null;
        }
    }

    get IsSingleCell() { return this.m_rowCount <= 1 && this.m_columnCount <= 1; }
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
        ctx.trackedObjects.add(rng);
        await Ranges.ensureGlobalNameDeleted(ctx, name);
        ctx.workbook.names.add(name, rng);
        await ctx.sync();
        ctx.trackedObjects.remove(rng);
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

    /*----------------------------------------------------------------------------
        %%Function: BracketGame.getRangeInfoForNamedCell
    ----------------------------------------------------------------------------*/
    static async getRangeForNamedCell(ctx: any, name: string): Promise<Excel.Range>
    {
        const nameObject: Excel.NamedItem = ctx.workbook.names.getItemOrNullObject(name);
        await ctx.sync();

        if (nameObject.isNullObject)
            return null;

        return nameObject.getRange();
    }

    /*----------------------------------------------------------------------------
        %%Function: Ranges.createRangeInfoForSelection
    ----------------------------------------------------------------------------*/
    static async createRangeInfoForSelection(ctx: any): Promise<RangeInfo>
    {
        const rng: Excel.Range = ctx.workbook.getSelectedRange();

        rng.load("rowIndex");
        rng.load("rowCount");
        rng.load("columnIndex");
        rng.load("columnCount");
        await ctx.sync();

        return RangeInfo.createFromRange(rng);
    }
}