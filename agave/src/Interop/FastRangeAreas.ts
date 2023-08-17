import { RangeInfo, Ranges } from "./Ranges";
import { JsCtx } from "./JsCtx";
import { IAppContext } from "../AppContext/AppContext";
import { StreamWriter } from "../Support/StreamWriter";
import { TestRunner } from "../Support/TestRunner";
import { TestResult } from "../Support/TestResult";
import { ObjectType } from "./TrackingCache";

class AreasItem
{
    m_rangeAreas: Excel.RangeAreas[];
    m_rangeInfo: RangeInfo;

    constructor(rangeAreas: Excel.RangeAreas[], rangeInfo: RangeInfo)
    {
        this.m_rangeAreas = rangeAreas;
        this.m_rangeInfo = rangeInfo;
    }

    getRangeAreaForIndex(index: number): [Excel.RangeAreas, number]
    {
        const iRangeArea: number = Math.floor(index / FastRangeAreas.itemMax);
        const indexAdjusted: number = index - iRangeArea * FastRangeAreas.itemMax;

        return [this.m_rangeAreas[iRangeArea], indexAdjusted];
    }

    getRangeForRangeInfo(range: RangeInfo): Excel.Range
    {
        if (range.ColumnCount != 1 || range.RowCount != 1)
            throw new Error('range areas only works with single cells');

        if (range.FirstColumn < this.m_rangeInfo.FirstColumn || range.FirstColumn > this.m_rangeInfo.LastColumn)
            throw new Error('column out of range');

        if (range.FirstRow < this.m_rangeInfo.FirstRow || range.LastRow > this.m_rangeInfo.LastRow)
            throw new Error('row out of range');

        // figure out the offset into the items...
        const colOffset: number = range.FirstColumn - this.m_rangeInfo.FirstColumn;
        const rowOffset: number = range.FirstRow - this.m_rangeInfo.FirstRow;

        const idx: number = colOffset * this.m_rangeInfo.RowCount + rowOffset;

        const [rangeArea, idxAdjusted] = this.getRangeAreaForIndex(idx);

        const addrExpected: string = Ranges.getColName(range.FirstColumn) + (range.FirstRow + 1)
        if (!rangeArea.areas.items[idxAdjusted].address.endsWith(addrExpected))
            throw new Error(`addresses don't match`);

        return rangeArea.areas.items[idxAdjusted];
    }
}

export class FastRangeAreas
{
    static itemMax: number = 1000; // only 2000 items per rangearea...

    m_areasItems: AreasItem[] = [];

    getAreasItemForRangeInfo(range: RangeInfo): AreasItem | null
    {
        for (let item of this.m_areasItems)
        {
            if (RangeInfo.isOverlapping(item.m_rangeInfo, range))
                return item;
        }

        return null;
    }

    lastAreaCached(): RangeInfo | null
    {
        let lastRow: RangeInfo | null = null;

        for (let item of this.m_areasItems)
        {
            if (!lastRow || lastRow.LastRow < item.m_rangeInfo.LastRow)
                lastRow = item.m_rangeInfo;
        }

        return lastRow;
    }


    private static nearestMultiple(num: number, multiple: number): number
    {
        return (Math.floor(num / multiple) + 1) * multiple;
    }

    rowCountNeededToExpand(range: RangeInfo): number
    {
        const lastRow = this.lastAreaCached();

        if (!lastRow)
            return 150;

        if (range.ColumnCount != 1 || range.RowCount != 1)
            throw new Error('range areas only works with single cells');

        if (lastRow.LastRow >= range.LastRow)
            return 0;

        // cache 150 rows at a time
        let rowsNeeded = range.LastRow - lastRow.LastRow;

        return FastRangeAreas.nearestMultiple(rowsNeeded, 150);
    }

    getRangeForRangeInfo(range: RangeInfo): Excel.Range
    {
        const item = this.getAreasItemForRangeInfo(range);

        return item.getRangeForRangeInfo(range);
    }


    getFormatForRangeInfo(range: RangeInfo): Excel.RangeFormat
    {
        return this.getRangeForRangeInfo(range).format;
    }

    getFormulasForRangeInfo(range: RangeInfo): any[][]
    {
        return this.getRangeForRangeInfo(range).formulas;
    }

    getValuesForRangeInfo(range: RangeInfo): any[][]
    {
        return this.getRangeForRangeInfo(range).values;
    }

    /*----------------------------------------------------------------------------
        %%Function: RangeInfo.getRangeAreasGridForRangeInfo

        Get a RangeAreas object for the range info. There will be an area for
        every single cell in the range, so this could be BIG

    ----------------------------------------------------------------------------*/
    static async getRangeAreasGridForRangeInfo(context: JsCtx, key: string, sheet: Excel.Worksheet, range: RangeInfo): Promise<FastRangeAreas>
    {
        const areas: FastRangeAreas = new FastRangeAreas();

        await areas.addRangeAreaGridForRangeInfo(context, key, sheet, 150, range);

        return areas;
    }

    async addRangeAreaGridForRangeInfo(context: JsCtx, key: string, sheet: Excel.Worksheet, rowCount: number, rangeRef?: RangeInfo)
    {
        let lastRow = this.lastAreaCached();
        let range: RangeInfo;

        if (!lastRow)
        {
            if (!rangeRef)
                throw new Error("must provide a reference range for the first addRange");

            range = rangeRef.offset(0, rangeRef.RowCount, 0, rangeRef.ColumnCount);
        }
        else
        {
            range = new RangeInfo(lastRow.LastRow + 1, rowCount, lastRow.FirstColumn, lastRow.ColumnCount);
        }

        const areas = await context.getTrackedItemOrPopulate(
                key,
                async (context) =>
                {
                    const addrs: string[] = FastRangeAreas.buildCellListForRangeInfo(range);
                    const rangeAreasAry: Excel.RangeAreas[] = [];

                    for (let addr of addrs)
                    {
                        const rangeAreas: Excel.RangeAreas = sheet.getRanges(addr);
                        let props =
                            //                            'format, areaCount, areas, areas.items, areas.items.format, areas.items.format/fill, areas.items.format/fill/color,areas.items.format/columnWidth,areas.items.format/rowHeight, address, areas.items.address, areas.items.values';
                            'areas.items, areas.items.format/fill, areas.items.format/fill/color,areas.items.format/columnWidth,areas.items.format/rowHeight, address, areas.items.address, areas.items.values, areas.items.formulas';
                        rangeAreas.load(props);
                        rangeAreasAry.push(rangeAreas);
                    }
                    await context.sync();
                    return { type: ObjectType.JsObject, o: rangeAreasAry };
                });

        if (!areas)
            throw new Error("could not get areas from worksheet");

        this.m_areasItems.push(new AreasItem(areas, range));
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
    static runAllTests(appContext: IAppContext, outStream: StreamWriter)
    {
        TestRunner.runAllTests(this, TestResult, appContext, outStream);
    }

    static buildCellListForRangeInfoTest(result: TestResult, range: RangeInfo, expected: string[])
    {
        let actual = FastRangeAreas.buildCellListForRangeInfo(range);

        result.assertIsEqual(expected[0], actual[0]);
    }

    static test_MaxMinus1CellList(result: TestResult)
    {
        const ichMaxMinus1Chars: number = ("" + (FastRangeAreas.itemMax - 1)).length;

        let actual = FastRangeAreas.buildCellListForRangeInfo(new RangeInfo(0, FastRangeAreas.itemMax - 1, 0, 1));
        result.assertIsEqual("A1", actual[0].substring(0, 2));
        result.assertIsEqual("A" + (FastRangeAreas.itemMax - 1), actual[0].substring(actual[0].length - ichMaxMinus1Chars - 1, actual[0].length));
    }

    static test_MaxCellList(result: TestResult)
    {
        const cchMax: number = ("" + (FastRangeAreas.itemMax)).length;

        let actual = FastRangeAreas.buildCellListForRangeInfo(new RangeInfo(0, FastRangeAreas.itemMax, 0, 1));
        result.assertIsEqual("A1", actual[0].substring(0, 2));
        result.assertIsEqual("A" + (FastRangeAreas.itemMax), actual[0].substring(actual[0].length - cchMax - 1, actual[0].length));
    }

    static test_MaxPlus1CellList(result: TestResult)
    {
        const cchMaxPlusOne: number = ("" + (FastRangeAreas.itemMax + 1)).length;

        const AssertEqual = (e: any, a: any) =>
        {
            if (a != e)
                result.addError(`expected(${e}) != actual(${a})`);
        }

        let actual = FastRangeAreas.buildCellListForRangeInfo(new RangeInfo(0, FastRangeAreas.itemMax + 1, 0, 1));
        result.assertIsEqual("A1", actual[0].substring(0, 2));
        result.assertIsEqual("A" + (FastRangeAreas.itemMax + 1), actual[1]);
        result.assertIsEqual("A" + (FastRangeAreas.itemMax), actual[0].substring(actual[0].length - cchMaxPlusOne - 1, actual[0].length));
    }

    static test_buildCellListForRangeInfo(result: TestResult)
    {
        this.buildCellListForRangeInfoTest(result, new RangeInfo(0, 1, 0, 1), ["A1"]);
        this.buildCellListForRangeInfoTest(result, new RangeInfo(0, 2, 0, 1), ["A1,A2"]);
        this.buildCellListForRangeInfoTest(result, new RangeInfo(0, 1, 0, 2), ["A1,B1"]);
        this.buildCellListForRangeInfoTest(result, new RangeInfo(0, 4, 0, 4), ["A1,A2,A3,A4,B1,B2,B3,B4,C1,C2,C3,C4,D1,D2,D3,D4"]);
    }
}