import { RangeInfo, Ranges } from "./Ranges";
import { JsCtx } from "./JsCtx";

export class FastRangeAreas
{
    static itemMax: number = 1000; // only 2000 items per rangearea...

    m_rangeAreas: Excel.RangeAreas[] = [];
    m_rangeInfo: RangeInfo;

    getRangeAreaForIndex(index: number): [Excel.RangeAreas, number]
    {
        const iRangeArea: number = Math.floor(index / FastRangeAreas.itemMax);
        const indexAdjusted: number = index - iRangeArea * FastRangeAreas.itemMax;

        return [this.m_rangeAreas[iRangeArea], indexAdjusted];
    }

    getRangeForRangeInfo(range: RangeInfo): Excel.Range
    {
        if (range.ColumnCount != 1 || range.RowCount != 1)
            throw Error('range areas only works with single cells');

        if (range.FirstColumn < this.m_rangeInfo.FirstColumn || range.FirstColumn > this.m_rangeInfo.LastColumn)
            throw Error('column out of range');

        if (range.FirstRow < this.m_rangeInfo.FirstRow || range.LastRow > this.m_rangeInfo.LastRow)
            throw Error('row out of range');

        // figure out the offset into the items...
        const colOffset: number = range.FirstColumn - this.m_rangeInfo.FirstColumn;
        const rowOffset: number = range.FirstRow - this.m_rangeInfo.FirstRow;

        const idx: number = colOffset * this.m_rangeInfo.RowCount + rowOffset;

        const [rangeArea, idxAdjusted] = this.getRangeAreaForIndex(idx);

        const addrExpected: string = Ranges.getColName(range.FirstColumn) + (range.FirstRow + 1)
        if (!rangeArea.areas.items[idxAdjusted].address.endsWith(addrExpected))
            throw Error(`addresses don't match`);

        return rangeArea.areas.items[idxAdjusted];
    }

    getFormatForRangeInfo(range: RangeInfo): Excel.RangeFormat
    {
        return this.getRangeForRangeInfo(range).format;
    }

    /*----------------------------------------------------------------------------
        %%Function: RangeInfo.getRangeAreasGridForRangeInfo

        Get a RangeAreas object for the range info. There will be an area for
        every single cell in the range, so this could be BIG

    ----------------------------------------------------------------------------*/
    static async getRangeAreasGridForRangeInfo(context: JsCtx, key: string, sheet: Excel.Worksheet, range: RangeInfo): Promise<FastRangeAreas>
    {
        const areas: FastRangeAreas = new FastRangeAreas();

        areas.m_rangeAreas =
            await context.getTrackedItem(
                key,
                async (context) =>
                {
                    const addrs: string[] = this.buildCellListForRangeInfo(range);
                    const rangeAreasAry: Excel.RangeAreas[] = [];

                    for (let addr of addrs)
                    {
                        const rangeAreas: Excel.RangeAreas = sheet.getRanges(addr);
                        let props =
//                            'format, areaCount, areas, areas.items, areas.items.format, areas.items.format/fill, areas.items.format/fill/color,areas.items.format/columnWidth,areas.items.format/rowHeight, address, areas.items.address, areas.items.values';
                            'areas.items, areas.items.format/fill, areas.items.format/fill/color,areas.items.format/columnWidth,areas.items.format/rowHeight, address, areas.items.address, areas.items.values';
                        rangeAreas.load(props);
                        rangeAreasAry.push(rangeAreas);
                    }
                    await context.sync();
                    return rangeAreasAry;
                });

        areas.m_rangeInfo = range;
        return areas;
    }

    static buildCellListForRangeInfo(range: RangeInfo): string[]
    {
        let cells: string = "";
        let cellsCollection: string[] = [];
        let count = 0;

        // build a string representing every cell.
        // we will be row first, then columns (so we can minimize calls to getColName)
        for (let col = range.FirstColumn; col <= range.LastColumn; col++)
        {
            let colRef = Ranges.getColName(col);

            for (let row = range.FirstRow; row <= range.LastRow; row++)
            {
                let addr = colRef + (row + 1);

                if (count >= FastRangeAreas.itemMax)
                {
                    cellsCollection.push(cells);
                    cells = "";
                    count = 0;
                }

                if (cells != "")
                    cells += "," + colRef + (row + 1);
                else
                    cells += colRef + (row + 1);

                count++;
            }
        }

        cellsCollection.push(cells);

        return cellsCollection;
    }
}

export class FastRangeAreasTest
{
    static buildCellListForRangeInfoTest(range: RangeInfo, expected: string[])
    {
        const AssertEqual = (e: any, a: any) =>
        {
            if (a != e)
                throw Error(`testFastRangeAreasTest: range(${range.toString}): expected(${e}) != actual(${a})`);
        }

        let actual = FastRangeAreas.buildCellListForRangeInfo(range);

        AssertEqual(expected, actual[0]);
    }

    static TestMaxMinus1CellList()
    {
        const ichMaxMinus1Chars: number = ("" + (FastRangeAreas.itemMax - 1)).length;

        const AssertEqual = (e: any, a: any) =>
        {
            if (a != e)
                throw Error(`TestMaxMinus1CellList: expected(${e}) != actual(${a})`);
        }

        let actual = FastRangeAreas.buildCellListForRangeInfo(new RangeInfo(0, FastRangeAreas.itemMax - 1, 0, 1));
        AssertEqual("A1", actual[0].substring(0, 2));
        AssertEqual("A" + (FastRangeAreas.itemMax - 1), actual[0].substring(actual[0].length - ichMaxMinus1Chars - 1, actual[0].length));
    }

    static TestMaxCellList()
    {
        const cchMax: number = ("" + (FastRangeAreas.itemMax)).length;

        const AssertEqual = (e: any, a: any) =>
        {
            if (a != e)
                throw Error(`TestMaxCellList: expected(${e}) != actual(${a})`);
        }

        let actual = FastRangeAreas.buildCellListForRangeInfo(new RangeInfo(0, FastRangeAreas.itemMax, 0, 1));
        AssertEqual("A1", actual[0].substring(0, 2));
        AssertEqual("A" + (FastRangeAreas.itemMax), actual[0].substring(actual[0].length - cchMax - 1, actual[0].length));
    }

    static TestMaxPlus1CellList()
    {
        const cchMaxPlusOne: number = ("" + (FastRangeAreas.itemMax + 1)).length;

        const AssertEqual = (e: any, a: any) =>
        {
            if (a != e)
                throw Error(`TestMaxPlus1CellList: expected(${e}) != actual(${a})`);
        }

        let actual = FastRangeAreas.buildCellListForRangeInfo(new RangeInfo(0, FastRangeAreas.itemMax + 1, 0, 1));
        AssertEqual("A1", actual[0].substring(0, 2));
        AssertEqual("A" + (FastRangeAreas.itemMax + 1), actual[1]);
        AssertEqual("A" + (FastRangeAreas.itemMax), actual[0].substring(actual[0].length - cchMaxPlusOne - 1, actual[0].length));
    }

    static buildCellListForRangeInfoTests()
    {
        this.buildCellListForRangeInfoTest(new RangeInfo(0, 1, 0, 1), ["A1"]);
        this.buildCellListForRangeInfoTest(new RangeInfo(0, 2, 0, 1), ["A1,A2"]);
        this.buildCellListForRangeInfoTest(new RangeInfo(0, 1, 0, 2), ["A1,B1"]);
        this.buildCellListForRangeInfoTest(new RangeInfo(0, 4, 0, 4), ["A1,A2,A3,A4,B1,B2,B3,B4,C1,C2,C3,C4,D1,D2,D3,D4"]);

        this.TestMaxMinus1CellList();
        this.TestMaxCellList();
        this.TestMaxPlus1CellList();
    }
}