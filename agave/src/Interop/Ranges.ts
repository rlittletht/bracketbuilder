import { AppContext } from "../AppContext/AppContext";
import { JsCtx } from "./JsCtx";
import { Parser, TrimType } from "./Parser";
import { ObjectType } from "./TrackingCache";
import { IIntention } from "./Intentions/IIntention";
import { TnDeleteGlobalName } from "./Intentions/TnDeleteGlobalName";

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
    get LastRowNotBackwards(): number { return this.m_rowStart + this.m_rowCount - 1 + (this.m_rowCount == 0 ? 1 : 0) ; }
    get LastColumn(): number { return this.m_columnStart + this.m_columnCount - 1; }
    get LastColumnNotBackwards(): number { return this.m_columnStart + this.m_columnCount - 1 + (this.m_columnCount == 0 ? 1 : 0); }
    get Area(): number { return this.m_rowCount * this.m_columnCount; }

    constructor(rowStart: number, rowCount: number, columnStart: number, columnCount: number)
    {
        if (rowCount < 0)
            throw new Error("negative row count");
        this.m_rowStart = rowStart;
        this.m_rowCount = rowCount;

        if (columnCount < 0)
            throw new Error("negative column count");
        this.m_columnStart = columnStart;
        this.m_columnCount = columnCount;
    }

    clone(): RangeInfo
    {
        return new RangeInfo(this.m_rowStart, this.RowCount, this.m_columnStart, this.ColumnCount);
    }

    static createFromRangeInfo(range: RangeInfo): RangeInfo
    {
        if (range == null)
            return null;

        return new RangeInfo(range.FirstRow, range.RowCount, range.FirstColumn, range.ColumnCount);
    }

    static createFromCornersSafe(rangeTopLeft: RangeInfo, rangeBottomRight: RangeInfo): RangeInfo
    {
        if (rangeTopLeft == null)
            return null;

        if (rangeBottomRight == null)
            return this.createFromRangeInfo(rangeTopLeft);

        if (rangeTopLeft.FirstRow <= rangeBottomRight.FirstRow)
        {
            return new RangeInfo(
                rangeTopLeft.FirstRow,
                rangeBottomRight.FirstRow - rangeTopLeft.FirstRow + 1,
                rangeTopLeft.FirstColumn,
                rangeBottomRight.FirstColumn - rangeTopLeft.FirstColumn + 1);
        }
        return new RangeInfo(
            rangeBottomRight.FirstRow,
            rangeTopLeft.FirstRow - rangeBottomRight.FirstRow + 1,
            rangeBottomRight.FirstColumn,
            rangeTopLeft.FirstColumn - rangeBottomRight.FirstColumn + 1);
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

    static createFromCornersCoord(rowTopLeft: number, colTopLeft: number, rowBottomRight: number, colBottomRight: number): RangeInfo
    {
        return new RangeInfo(rowTopLeft, rowBottomRight - rowTopLeft + 1, colTopLeft, colBottomRight - colTopLeft + 1);
    }

    static createFromRange(range: Excel.Range): RangeInfo
    {
        if (range == null || range.isNullObject)
            return null;

        return new RangeInfo(range.rowIndex, range.rowCount, range.columnIndex, range.columnCount);
    }

    /*----------------------------------------------------------------------------
        %%Function: RangeInfo.offset

        return a new RangeInfo offset by dRows and dColumns, with the new
        row and column counts
    ----------------------------------------------------------------------------*/
    offset(dRows: number, newRowCount: number, dColumns?: number, newColumnCount?: number)
    {
        if (dColumns == undefined)
            dColumns = 0;
        if (newColumnCount == undefined)
            newColumnCount = this.ColumnCount;

        return new RangeInfo(this.FirstRow + dRows, newRowCount, this.FirstColumn + dColumns, newColumnCount);
    }

    shiftByColumns(dColumns: number): RangeInfo
    {
        this.m_columnStart += dColumns;
        return this;
    }
    shiftByRows(dRows: number): RangeInfo
    {
        this.m_rowStart += dRows;
        return this;
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

    bottomLeft(): RangeInfo
    {
        return new RangeInfo(this.LastRow, 1, this.FirstColumn, 1);
    }

    topRight(): RangeInfo
    {
        return new RangeInfo(this.FirstRow, 1, this.LastColumn, 1);
    }

    setColumn(column: number)
    {
        this.m_columnStart = column;
    }

    setRow(row: number)
    {
        this.m_rowStart = row;
    }

    setRowResize(row: number)
    {
        const delta: number = this.m_rowStart - row;

        this.m_rowStart = row;
        this.m_rowCount += delta;
        if (this.m_rowCount < 0)
            this.m_rowCount = 0;
    }

    setLastRow(row: number)
    {
        this.m_rowCount = row - this.FirstRow + 1;
        if (this.m_rowCount < 0)
            this.m_rowCount = 0;
    }

    setLastColumn(column: number)
    {
        this.m_columnCount = column - this.FirstColumn + 1;
        if (this.m_columnCount < 0)
            this.m_columnCount = 0;
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

    toFriendlyString(): string
    {
        return `${Ranges.addressFromCoordinates([this.FirstRow, this.FirstColumn], [this.LastRow, this.LastColumn])}`;
    }

    rebase(oldTopRow: number, newTopRow: number)
    {
        const delta: number = this.m_rowStart - oldTopRow;

        this.m_rowStart = newTopRow + delta;
    }

    excludeRangeByRows(range: RangeInfo)
    {
        if (RangeInfo.isOverlapping(this, range) == RangeOverlapKind.None)
            return;

        if (this.m_rowStart < range.FirstRow)
        {
            this.setLastRow(range.FirstRow - 1);
            return;
        }

        if (this.m_rowStart < range.LastRow)
        {
            // we start inside the row we want to exclude. move the start to after the range
            this.setRowResize(range.LastRow + 1);
        }
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

    static isOverlappingRowsNotBackwards(range1: RangeInfo, range2: RangeInfo): boolean
    {
        return this.isOverlappingSegment(range1.FirstRow, range1.LastRowNotBackwards, range2.FirstRow, range2.LastRowNotBackwards);
    }

    static isOverlappingColumnsNotBackwards(range1: RangeInfo, range2: RangeInfo): boolean
    {
        return this.isOverlappingSegment(range1.FirstColumn, range1.LastColumnNotBackwards, range2.FirstColumn, range2.LastColumnNotBackwards);
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

    static isOverlappingNotBackwards(range1: RangeInfo, range2: RangeInfo): RangeOverlapKind
    {
        if (range1 == null && range2 == null)
            return RangeOverlapKind.Equal;

        if (range1 == null || range2 == null)
            return RangeOverlapKind.None;

        if (this.isOverlappingRowsNotBackwards(range1, range2) && this.isOverlappingColumnsNotBackwards(range1, range2))
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
    static async getRangeInfoForNamedCell(context: JsCtx, name: string): Promise<RangeInfo>
    {
        try
        {
            const nameObject: Excel.NamedItem = context.Ctx.workbook.names.getItemOrNullObject(name);
            await context.sync("getRangeInfoForNamedCell");

            if (nameObject.isNullObject)
                return null;

            const range: Excel.Range = nameObject.getRange();
            range.load("rowIndex");
            range.load("rowCount");
            range.load("columnIndex");
            range.load("columnCount");

            await context.sync();

            return new RangeInfo(range.rowIndex, range.rowCount, range.columnIndex, range.columnCount);
        }
        catch (e)
        {
            return null;
        }
    }

    // problem is i'm expecting items in the caceh, but now I've pushed naems into the cache (because items
    // isn't valid yet until after sync.)  need instead maybe to do al the track adds after the sync? should be fine...
    //'
    static async getRangeInfoForNamedCellFaster(context: JsCtx, name: string): Promise<RangeInfo>
    {
        const items =
            await context.getTrackedItemOrPopulate(
                "workbookNamesItems",
                async (context): Promise<any> =>
                {
                    context.Ctx.workbook.load("names");
                    await context.sync("GTI names");
                    return { type: ObjectType.JsObject, o: context.Ctx.workbook.names };
                });

        if (!items)
            throw new Error("could not get NamedItems from worksheet");

        let i: number = 0;

        for (; i < items.length; i++)
        {
            if (items[i].name == name)
                break;
        }

        if (i >= items.length)
            return null;

        const formula: string = items[i].formula;

        if (formula == null || formula[0] != "=")
        {
            AppContext.log("bad formula in named reference");
            return null;
        }

        const { colRef1, rowRef1, colRef2, rowRef2 } =
            Parser.parseExcelFullAddress(TrimType.LeadingSpace, formula, 1, formula.length);

        if (!colRef1 || !rowRef1)
        {
            AppContext.log("bad formula in named reference");
            return null;
        }

        return new RangeInfo(
            rowRef1 - 1,
            rowRef2 ? rowRef2 - rowRef1 : 1,
            Ranges.getCoordFromColName_1Based(colRef1) - 1,
            colRef2 ? Ranges.getCoordFromColName_1Based(colRef2) - Ranges.getCoordFromColName_1Based(colRef2) : 1);
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
        %%Function: Ranges.getCoordFromColName_1Based
    ----------------------------------------------------------------------------*/
    static getCoordFromColName_1Based(colRef: string)
    {
        colRef = colRef.toUpperCase();

        for (let i = 0; i < Ranges.colsMap.length; i++)
        {
            if (Ranges.colsMap[i] == colRef)
                return i + 1;
        }

        throw new Error("out of bounds colName");
    }

    /*----------------------------------------------------------------------------
        %%Function: Ranges.getColName_1Based
    ----------------------------------------------------------------------------*/
    static getColName_1Based(col: number): string
    {
        if (col > this.colsMap.length)
            throw new Error(`cannot handle columns > ${this.colsMap.length}`);

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
            throw new Error(`cannot handle columns > ${this.colsMap.length}`);

        if (addrFrom[1] <= 0 || (addrTo != null && addrTo[1] <= 0))
            throw new Error("row/column addresses are 1-based");

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
    static async ensureGlobalNameDeleted(context: JsCtx, name: string)
    {
        const nameObject: Excel.NamedItem = context.Ctx.workbook.names.getItemOrNullObject(name);
        await context.sync();

        if (nameObject.isNullObject)
            return;

        nameObject.delete();
        await context.sync();
    }

    /*----------------------------------------------------------------------------
        %%Function: Ranges.tnsDeleteGlobalName

        Return intentions to delete the named range (and any range with an error).

        If the workbookNamesItems cache is populated, then this will not roundtrip
        to Excel.
    ----------------------------------------------------------------------------*/
    static async tnsDeleteGlobalName(context: JsCtx, name: string): Promise<IIntention[]>
    {
        const tns: IIntention[] = [];

        // lastly, deal with any named ranges in the range (the caller may have already dealt
        // with the games expected ranges
        const names = await context.getTrackedItemOrPopulate(
            "workbookNamesItems",
            async (context): Promise<any> =>
            {
                context.Ctx.workbook.load("names");
                await context.sync("GTI names");
                return { type: ObjectType.JsObject, o: context.Ctx.workbook.names.items };
            });

        for (let _item of names)
        {
            if (_item.type == Excel.NamedItemType.error || _item.name == name)
                tns.push(TnDeleteGlobalName.Create(_item.name));
        }

        return tns;
    }

    /*----------------------------------------------------------------------------
        %%Function: Ranges.tnsDeleteOverlappingGlobalNames

        Return intentions to delete the named ranges that either are in an error
        state, or overlap with this range
    ----------------------------------------------------------------------------*/
    static async tnsDeleteOverlappingGlobalNames(context: JsCtx, rangeInfo: RangeInfo): Promise<IIntention[]>
    {
        const tns: IIntention[] = [];

        // lastly, deal with any named ranges in the range (the caller may have already dealt
        // with the games expected ranges
        const names = await context.getTrackedItemOrPopulate(
            "workbookNamesItems",
            async (context): Promise<any> =>
            {
                context.Ctx.workbook.load("names");
                await context.sync("GTI names");
                return { type: ObjectType.JsObject, o: context.Ctx.workbook.names.items };
            });

        for (let _item of names)
        {
            if (_item.type == Excel.NamedItemType.error || _item.name == name)
                tns.push(TnDeleteGlobalName.Create(_item.name));
            else if (_item.type == Excel.NamedItemType.range)
            {
                if (RangeInfo.isOverlapping(rangeInfo, Ranges.createRangeInfoFromFormula(_item.formula)) != RangeOverlapKind.None)
                    tns.push(TnDeleteGlobalName.Create(_item.name));
            }
        }

        return tns;
    }

    /*----------------------------------------------------------------------------
        %%Function: Ranges.createOrReplaceNamedRange
    ----------------------------------------------------------------------------*/
    static async createOrReplaceNamedRange(context: JsCtx, name: string, rng: Excel.Range)
    {
        context.Ctx.trackedObjects.add(rng);
        await Ranges.ensureGlobalNameDeleted(context, name);
        context.Ctx.workbook.names.add(name, rng);
        await context.sync();
        context.Ctx.trackedObjects.remove(rng);
    }


    /*----------------------------------------------------------------------------
        %%Function: Ranges.createOrReplaceNamedRangeByIndex
    ----------------------------------------------------------------------------*/
    static async createOrReplaceNamedRangeByIndex(
        context: JsCtx,
        sheet: Excel.Worksheet,
        name: string,
        from: [number, number],
        to?: [number, number])
    {
        const rows: number = to ? to[0] - from[0] + 1 : 1;
        const cols: number = to ? to[1] - from[1] + 1 : 1;

        let rng: Excel.Range = sheet.getRangeByIndexes(from[0], from[1], rows, cols);
        await this.createOrReplaceNamedRange(context, name, rng);
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

        be robust against broken named ranges
    ----------------------------------------------------------------------------*/
    static async getRangeForNamedCell(context: JsCtx, name: string): Promise<Excel.Range>
    {
        try
        {
            const nameObject: Excel.NamedItem = context.Ctx.workbook.names.getItemOrNullObject(name);
            await context.sync("getRangeForNamedCell1");

            if (nameObject.isNullObject)
                return null;

            const range: Excel.Range = nameObject.getRange();
            range.load("rowIndex");
            range.load("rowCount");
            range.load("columnIndex");
            range.load("columnCount");

            await context.sync("getRangeForNamedCell2");
            return nameObject.getRange();
        }
        catch (e)
        {
            return null;
        }
    }

    /*----------------------------------------------------------------------------
        %%Function: Ranges.getValuesFromNamedCellRange

        Get the values array (any[][]) for the given named range
    ----------------------------------------------------------------------------*/
    static async getValuesFromNamedCellRange(context: JsCtx, name: string): Promise<any[][]>
    {
        const range: Excel.Range = await Ranges.getRangeForNamedCell(context, name);
        range.load("values");
        await context.sync("getValuesFromNamedCellRange");

        return range.values;
    }

    /*----------------------------------------------------------------------------
        %%Function: Ranges.createRangeInfoForSelection
    ----------------------------------------------------------------------------*/
    static async createRangeInfoForSelection(context: JsCtx): Promise<RangeInfo>
    {
        const rng: Excel.Range = context.Ctx.workbook.getSelectedRange();

        rng.load("rowIndex");
        rng.load("rowCount");
        rng.load("columnIndex");
        rng.load("columnCount");
        await context.sync();

        return RangeInfo.createFromRange(rng);
    }

    /*----------------------------------------------------------------------------
        %%Function: Ranges.createRangeInfoFromFormula

        formula in this context refers to the object formula in excel.js
        (to avoid having to load the range information from excel).

        It looks like 
            =Sheet1!$A$1
        or 
            ='sheet name'!$A$1
    ----------------------------------------------------------------------------*/
    static createRangeInfoFromFormula(formula: string): RangeInfo
    {
        let ichCur: number = 0;
        let ichMax: number = formula.length;
        let s: string;

        ichCur = Parser.parseWhitespace(formula, ichCur, ichMax);
        [s, ichCur] = Parser.parseGetChar(formula, ichCur, ichMax);

        if (s !== "=")
            return null;

        const { colRef1, rowRef1, colRef2, rowRef2 } =
            Parser.parseExcelFullAddress(TrimType.LeadingSpace, formula, ichCur, ichMax);

        if (!colRef1 || !rowRef1)
            return null;

        const colStart = this.getCoordFromColName_1Based(colRef1) - 1;
        const colEnd = colRef2 ? this.getCoordFromColName_1Based(colRef2) - 1 : colStart;
        const rowStart = rowRef1 - 1;
        const rowEnd = rowRef2 ? rowRef2 - 1 : rowStart;

        return new RangeInfo(rowStart, rowEnd - rowStart + 1, colStart, colEnd - colStart + 1);
    }
}