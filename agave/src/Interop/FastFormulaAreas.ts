import { RangeInfo, Ranges } from "./Ranges";
import { JsCtx } from "./JsCtx";
import { IAppContext } from "../AppContext/AppContext";
import { StreamWriter } from "../Support/StreamWriter";
import { TestRunner } from "../Support/TestRunner";
import { TestResult } from "../Support/TestResult";
import { ObjectType, CacheObject } from "./TrackingCache";
import { PerfTimer } from "../PerfTimer";

class FormulaAreasItem
{
    m_rangeAreas: Excel.RangeAreas;
    m_rangeInfo: RangeInfo;

    constructor(rangeAreas: Excel.RangeAreas, rangeInfo: RangeInfo)
    {
        this.m_rangeAreas = rangeAreas;
        this.m_rangeInfo = rangeInfo;
    }

    // there's no way to get a range from this RangeInfo -- we have a single Excel.RangeAreas for this FormulaAreasItem
    // instead, you have to request the items you want specifically

    getRowColOffsetsIntoAreasItem(range: RangeInfo): { dRow: number, dCol: number }
    {
        const dRow = range.FirstRow - this.m_rangeInfo.FirstRow;
        const dCol = range.FirstColumn - this.m_rangeInfo.FirstColumn;

        if (dRow < 0
            || dCol < 0
            || range.LastRow > this.m_rangeInfo.LastRow
            || range.LastColumn > this.m_rangeInfo.LastColumn)
        {
            throw new Error(`requested range out of range for FormulaAreasItem (this.range: ${this.m_rangeInfo.toFriendlyString}, requested: ${range.toFriendlyString()})`);
        }

        return { dRow: dRow, dCol: dCol };
    }

    getFormulasForRangeInfo(range: RangeInfo): any[][]
    {
        const { dRow, dCol } = this.getRowColOffsetsIntoAreasItem(range);
        const fmlas = [];

        for (let iRow = 0; iRow < range.RowCount; iRow++)
        {
            const row = [];

            for (let iCol = 0; iCol < range.ColumnCount; iCol++)
                row.push(this.m_rangeAreas.areas.items[0].formulas[iRow + dRow][iCol + dCol]);

            fmlas.push(row);
        }

        return fmlas;
    }

    getValuesForRangeInfo(range: RangeInfo): any[][]
    {
        const { dRow, dCol } = this.getRowColOffsetsIntoAreasItem(range);
        const vals = [];

        for (let iRow = 0; iRow < range.RowCount; iRow++)
            vals.push([...this.m_rangeAreas.areas.items[0].values[iRow + dRow]]);

        return vals;
    }
}

export class FastFormulaAreas
{
    static itemMax: number = 1000; // only 2000 items per rangearea...

    m_areasItems: FormulaAreasItem[] = [];

    getAreasItemForRangeInfo(range: RangeInfo): FormulaAreasItem | null
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

        return FastFormulaAreas.nearestMultiple(rowsNeeded, 150);
    }

    getFormulasForRangeInfo(range: RangeInfo): any[][]
    {
        const item = this.getAreasItemForRangeInfo(range);

        return item.getFormulasForRangeInfo(range);
    }

    getValuesForRangeInfo(range: RangeInfo): any[][]
    {
        const item = this.getAreasItemForRangeInfo(range);

        return item.getValuesForRangeInfo(range);
    }

    /*----------------------------------------------------------------------------
        %%Function: FastFormulaAreas.getRangeAreasGridForRangeInfo

        Get a single rangeAreas object for the range. This only works for
        formulas and values since those are returned as arrays of values.

        formatting, etc, has to use FastRangeAreas, which will make individual
        RangeArea objects for every cell. Its MUCH slower on the WebApp (too
        many roundtrips to the server)
    ----------------------------------------------------------------------------*/
    private static async getRangeAreasGridForRangeInfo(context: JsCtx, key: string, sheet: Excel.Worksheet, range: RangeInfo): Promise<FastFormulaAreas>
    {
        const areas: FastFormulaAreas = new FastFormulaAreas();

        await areas.addMoreRowsToRangeAreaGrid(context, key, sheet, 250, range);

        return areas;
    }

    /*----------------------------------------------------------------------------
        %%Function: FastFormulaAreas.addMoreRowsToRangeAreaGrid
        
        Add more rows (rowCount) to the current RangeAreas grid. If there isn't
        a current grid (which is true if this is the first call ever for this
        FastRangeAreas), then caller MUST supply a range to start the grid at.
    ----------------------------------------------------------------------------*/
    async addMoreRowsToRangeAreaGrid(context: JsCtx, key: string, sheet: Excel.Worksheet, rowCount: number, rangeGridStart?: RangeInfo)
    {
        let lastRow = this.lastAreaCached();
        let range: RangeInfo;

        if (!lastRow)
        {
            if (!rangeGridStart)
                throw new Error("must provide a reference range for the first addRange");

            range = rangeGridStart.offset(0, rangeGridStart.RowCount, 0, rangeGridStart.ColumnCount);
        }
        else
        {
            range = new RangeInfo(lastRow.LastRow + 1, rowCount, lastRow.FirstColumn, lastRow.ColumnCount);
        }

        const areas = await context.getTrackedItemOrPopulate(
                key,
                async (context) =>
                {
                    const timer = new PerfTimer();

                    timer.pushTimer("fastFormulas addMoreRowsToRangeAreaGrid sync");
                    const addr: string = Ranges.addressFromCoordinates([range.FirstRow, range.FirstColumn], [range.LastRow, range.LastColumn]);

                    const rangeAreas: Excel.RangeAreas = sheet.getRanges(addr);
                    const props = 'areas.items, areas.items.values, areas.items.formulas';
                    rangeAreas.load(props);

                    await context.sync();
                    timer.popTimer();
                    return { type: ObjectType.JsObject, o: rangeAreas};
                });

        if (!areas)
            throw new Error("could not get areas from worksheet");

        //at this point we have a 1:1 mapping of rangeInfo to areas. still need to teach the rest of the code that there isn't
        // and array of rangeAreas that we have to map to, but rather a single rangeArea we have to just index into. get rid of the 
        // formatting returns as we didn't cache it.
        this.m_areasItems.push(new FormulaAreasItem(areas, range));
    }

    static s_fastFormulaAreaBigGrid = "grid-FastFormulaAreas";

    static getGridFastFormulaAreaCache(context: JsCtx): FastFormulaAreas
    {
        return context.getTrackedItemOrNull("grid-FastFormulaAreas");
    }

    static async populateGridFastFormulaAreaCache(context: JsCtx): Promise<FastFormulaAreas>
    {
        const sheet: Excel.Worksheet = context.Ctx.workbook.worksheets.getActiveWorksheet();

        return await context.getTrackedItemOrPopulate(
            this.s_fastFormulaAreaBigGrid,
            async (context): Promise<CacheObject> =>
            {
                const areas = await FastFormulaAreas.getRangeAreasGridForRangeInfo(
                    context,
                    `${this.s_fastFormulaAreaBigGrid}-rangeAreas`,
                    sheet,
                    new RangeInfo(8, 250, 0, 50));

                return { type: ObjectType.TrObject, o: areas };
            });
    }
}

export class FastFormulaAreasTest
{
    static runAllTests(appContext: IAppContext, outStream: StreamWriter)
    {
        TestRunner.runAllTests(this, TestResult, appContext, outStream);
    }
}