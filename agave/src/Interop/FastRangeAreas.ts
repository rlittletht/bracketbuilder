import { RangeInfo, Ranges } from "./Ranges";
import { JsCtx } from "./JsCtx";

export class FastRangeAreas
{
    m_rangeAreas: Excel.RangeAreas;
    m_rangeInfo: RangeInfo;

    get RangeAreas(): Excel.RangeAreas { return this.m_rangeAreas; }

    /*----------------------------------------------------------------------------
        %%Function: RangeInfo.getRangeAreasGridForRangeInfo

        Get a RangeAreas object for the range info. There will be an area for
        every single cell in the range, so this could be BIG

    ----------------------------------------------------------------------------*/
    static async getRangeAreasGridForRangeInfo(context: JsCtx, key: string, sheet: Excel.Worksheet, range: RangeInfo): Promise<FastRangeAreas>
    {
        const areas: FastRangeAreas = new FastRangeAreas();

        areas.m_rangeAreas = await context.getTrackedItem(
            key, async (context) =>
            {
                const addr: string = this.buildCellListForRangeInfo(range);
                const rangeAreas: Excel.RangeAreas = sheet.getRanges(addr);
                rangeAreas.load('format, areaCount, areas, areas.items, areas.items.format');
                await context.sync();
                return rangeAreas;
        })

        areas.m_rangeInfo = range;
        return areas;
    }

    static buildCellListForRangeInfo(range: RangeInfo): string
    {
        let cells: string = "";

        // build a string representing every cell.
        // we will be row first, then columns (so we can minimize calls to getColName)
        for (let col = range.FirstColumn; col <= range.LastColumn; col++)
        {
            let colRef = Ranges.getColName(col);

            for (let row = range.FirstRow; row <= range.LastRow; row++)
            {
                let addr = colRef + (row + 1);

                if (cells != "")
                    cells += "," + colRef + (row + 1);
                else
                    cells += colRef + (row + 1);
            }
        }
        return cells;
    }
}

export class FastRangeAreasTest
{
    static buildCellListForRangeInfoTest(range: RangeInfo, expected: string)
    {
        const AssertEqual = (e: any, a: any) =>
        {
            if (a != e)
                throw Error(`testFastRangeAreasTest: range(${range.toString}): expected(${e}) != actual(${a})`);
        }

        let actual = FastRangeAreas.buildCellListForRangeInfo(range);

        AssertEqual(expected, actual);
    }

    static buildCellListForRangeInfoTests()
    {
        this.buildCellListForRangeInfoTest(new RangeInfo(0, 1, 0, 1), "A1");
        this.buildCellListForRangeInfoTest(new RangeInfo(0, 2, 0, 1), "A1,A2");
        this.buildCellListForRangeInfoTest(new RangeInfo(0, 1, 0, 2), "A1,B1");
        this.buildCellListForRangeInfoTest(new RangeInfo(0, 4, 0, 4), "A1,A2,A3,A4,B1,B2,B3,B4,C1,C2,C3,C4,D1,D2,D3,D4");
    }
}