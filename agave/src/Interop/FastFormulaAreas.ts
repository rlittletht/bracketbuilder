import { RangeInfo, Ranges } from "./Ranges";
import { JsCtx } from "./JsCtx";
import { IAppContext } from "../AppContext/AppContext";
import { StreamWriter } from "../Support/StreamWriter";
import { TestRunner } from "../Support/TestRunner";
import { TestResult } from "../Support/TestResult";
import { ObjectType, CacheObject } from "./TrackingCache";
import { PerfTimer, _TimerStack } from "../PerfTimer";
import { GridBuilder } from "../Brackets/GridBuilder";
import { BracketDataBuilder } from "../Brackets/BracketDataBuilder";
import { BracketSources } from "../Brackets/BracketSources";
import { BracketStructureBuilder } from "../Brackets/BracketStructureBuilder";

export class FastFormulaAreasItems
{
    static GameGrid = "gamegrid";
    static Teams = "teams";
    static BracketSources = "bracket-sources";
}

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
    m_sheetName: string;

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
    private static async createFastFormulaItemsForRangeInfo(context: JsCtx, key: string, sheetName: string, range: RangeInfo): Promise<FastFormulaAreas>
    {
        const areas: FastFormulaAreas = new FastFormulaAreas();

        areas.m_sheetName = sheetName;
        await areas.addMoreRows(context, key, 250, range);

        return areas;
    }

    /*----------------------------------------------------------------------------
        %%Function: FastFormulaAreas.loadRangeAreasFromRangeInfo

        load the range areas for the given range and sheetName. don't sync -- 
        the caller may want to load multiple of these
    ----------------------------------------------------------------------------*/
    static loadRangeAreasFromRangeInfo(context: JsCtx, range: RangeInfo, sheetName: string): Excel.RangeAreas
    {
        const sheet: Excel.Worksheet = context.Ctx.workbook.worksheets.getItem(sheetName);
        const addr: string = Ranges.addressFromCoordinates([range.FirstRow, range.FirstColumn], [range.LastRow, range.LastColumn]);

        const rangeAreas: Excel.RangeAreas = sheet.getRanges(addr);
        const props = 'areas.items, areas.items.values, areas.items.formulas';
        rangeAreas.load(props);

        return rangeAreas;
    }

    /*----------------------------------------------------------------------------
        %%Function: FastFormulaAreas.addMoreRows
        
        Add more rows (rowCount) to the current RangeAreas grid. If there isn't
        a current grid (which is true if this is the first call ever for this
        FastRangeAreas), then caller MUST supply a range to start the grid at.
    ----------------------------------------------------------------------------*/
    async addMoreRows(context: JsCtx, key: string, rowCount: number, rangeGridStart?: RangeInfo)
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
                    _TimerStack.pushTimer(`addMoreRows ${this.m_sheetName}`);

                    const rangeAreas = FastFormulaAreas.loadRangeAreasFromRangeInfo(context, range, this.m_sheetName);
                    await context.sync();
                    _TimerStack.popTimer();
                    return { type: ObjectType.JsObject, o: rangeAreas};
                });

        if (!areas)
            throw new Error("could not get areas from worksheet");

        //at this point we have a 1:1 mapping of rangeInfo to areas. still need to teach the rest of the code that there isn't
        // and array of rangeAreas that we have to map to, but rather a single rangeArea we have to just index into. get rid of the 
        // formatting returns as we didn't cache it.
        this.m_areasItems.push(new FormulaAreasItem(areas, range));
    }

    static s_gridCacheName = "gamegrid-FastFormulaAreas";
    static s_teamsSheetCacheName = "teams-FastFormulaAreas";
    static s_bracketDefCacheName = "bracketDefs-FastFormulaAreas";

    static s_allSheetsCache = "allsheets-FastFormulaAreasCollection";

    static s_mapTypeName = new Map<FastFormulaAreasItems, string>(
        [
            [FastFormulaAreasItems.GameGrid, FastFormulaAreas.s_gridCacheName],
            [FastFormulaAreasItems.Teams, FastFormulaAreas.s_teamsSheetCacheName],
            [FastFormulaAreasItems.BracketSources, FastFormulaAreas.s_bracketDefCacheName],
        ]
    );

    static s_mapTypeSheet = new Map<FastFormulaAreasItems, string>(
        [
            [FastFormulaAreasItems.GameGrid, "Games"],
            [FastFormulaAreasItems.Teams, "TeamsAndFields"],
            [FastFormulaAreasItems.BracketSources, "BracketDefs"],
        ]
    );

    static s_mapTypeRange = new Map<FastFormulaAreasItems, RangeInfo>(
        [
            [FastFormulaAreasItems.GameGrid, new RangeInfo(8, 250, 0, 50)],
            [FastFormulaAreasItems.Teams, new RangeInfo(0, 60, 0, 7)],
            [FastFormulaAreasItems.BracketSources, new RangeInfo(0, 100, 0, 15)],
        ]
        )

    static getGridFastFormulaAreaCache(context: JsCtx): FastFormulaAreas
    {
        return FastFormulaAreas.getFastFormulaAreaCacheForType(context, FastFormulaAreasItems.GameGrid);
    }

    static getFastFormulaAreaCacheForName(context: JsCtx, name: string): FastFormulaAreas
    {
        return context.getTrackedItemOrNull(name);
    }

    static getFastFormulaAreaCacheForType(context: JsCtx, type: FastFormulaAreasItems): FastFormulaAreas
    {
        return context.getTrackedItemOrNull(this.s_mapTypeName.get(type));
    }

    static async populateFastFormulaAreaCache(context: JsCtx, range: RangeInfo, sheetName: string, name: string): Promise<FastFormulaAreas>
    {
        return await context.getTrackedItemOrPopulate(
            name,
            async (context): Promise<CacheObject> =>
            {
                const areas = await FastFormulaAreas.createFastFormulaItemsForRangeInfo(
                    context,
                    `${name}-rangeAreas`,
                    sheetName,
                    range);

                return { type: ObjectType.TrObject, o: areas };
            });
    }

//    static async populateFastFormulaAreaCachesForAllSheets(context: JsCtx): Promise<FastFormulaAreas>
//    {
//        const sheet: Excel.Worksheet = context.Ctx.workbook.worksheets.getActiveWorksheet();
//
//        return await context.getTrackedItemsOrPopulate(
//            name,
//            async (context): Promise<CacheObject> =>
//            {
//                const areas = await FastFormulaAreas.createFastFormulaItemsForRangeInfo(
//                    context,
//                    `${name}-rangeAreas`,
//                    sheet,
//                    range);
//
//                return { type: ObjectType.TrObject, o: areas };
//            });
//    }

    static async populateGridFastFormulaAreaCache(context: JsCtx): Promise<FastFormulaAreas>
    {
        return await this.populateFastFormulaAreaCache(context, new RangeInfo(8, 250, 0, 50), GridBuilder.SheetName, this.s_gridCacheName);
    }

    static async populateFastFormulaAreaCacheForType(context: JsCtx, type: FastFormulaAreasItems): Promise<FastFormulaAreas>
    {
        return await this.populateFastFormulaAreaCache(context, this.s_mapTypeRange.get(type), this.s_mapTypeSheet.get(type), this.s_mapTypeName.get(type));
    }

}

export class FastFormulaAreaCachesCollection
{
    m_mapTypeAreas: Map<FastFormulaAreasItems, FastFormulaAreas> = new Map<FastFormulaAreasItems, FastFormulaAreas>();

    add(type: FastFormulaAreasItems, item: FastFormulaAreas)
    {
        this.m_mapTypeAreas.set(type, item);
    }

    get(type: FastFormulaAreasItems) : FastFormulaAreas
    {
        return this.m_mapTypeAreas.get(type);
    }

}
export class FastFormulaAreasTest
{
    static runAllTests(appContext: IAppContext, outStream: StreamWriter)
    {
        TestRunner.runAllTests(this, TestResult, appContext, outStream);
    }
}
