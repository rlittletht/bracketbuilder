import { IAppContext } from "../../AppContext/AppContext";
import { _TimerStack } from "../../PerfTimer";
import { StreamWriter } from "../../Support/StreamWriter";
import { TestResult } from "../../Support/TestResult";
import { TestRunner } from "../../Support/TestRunner";
import { JsCtx } from "../JsCtx";
import { RangeInfo, Ranges } from "../Ranges";
import { CacheObject, ObjectType } from "../TrackingCache";
import { RangeCacheItemType, RangeCaches } from "../RangeCaches";
import { FastFormulaAreasItems } from "./FastFormulaAreasItems";
import { FastFormulaAreasItem } from "./FastFormulaAreasItem";
import { FastFormulaAreaDefinitions } from "./FastFormulaAreaDefinitions";

export class FastFormulaAreas
{
    static s_allSheetsCache = "allsheets-FastFormulaAreasCollection";

    static itemMax: number = 1000; // only 2000 items per rangearea...

    m_areasItems: FastFormulaAreasItem[] = [];
    m_sheetName: string;

    getAreasItemForRangeInfo(range: RangeInfo): FastFormulaAreasItem | null
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
            range = new RangeInfo(lastRow.LastRow + 1, rowCount, lastRow.FirstColumn, lastRow.ColumnCount);

        const areas = await context.getTrackedItemOrPopulate(
            key,
            async (context) =>
            {
                _TimerStack.pushTimer(`addMoreRows ${this.m_sheetName}`);

                const rangeAreas = FastFormulaAreas.loadRangeAreasFromRangeInfo(context, range, this.m_sheetName);
                await context.sync("addMoreRows");
                _TimerStack.popTimer();
                return { type: ObjectType.JsObject, o: rangeAreas };
            });

        if (!areas)
            throw new Error("could not get areas from worksheet");

        //at this point we have a 1:1 mapping of rangeInfo to areas. still need to teach the rest of the code that there isn't
        // and array of rangeAreas that we have to map to, but rather a single rangeArea we have to just index into. get rid of the 
        // formatting returns as we didn't cache it.
        this.m_areasItems.push(new FastFormulaAreasItem(areas, range));
    }

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
        const name = FastFormulaAreaDefinitions.getMapTypeNameFromType(type);

        // first see if we have this item cached
        const areas = context.getTrackedItemOrNull(name);
        const areasCollection: FastFormulaAreaCachesCollection = context.getTrackedItemOrNull(this.s_allSheetsCache);
        let areasFromCollection = null;
        let areasToUse = null;

        if (areasCollection != null)
        {
            // we have a collection. get the right areas from it
            areasFromCollection = areasCollection.get(type);
        }

        if (areasFromCollection != null && areas != null)
        {
            // figure out which is more recent
            if (context.compareKeyOrder(name, this.s_allSheetsCache) >= 0)
                areasToUse = areasFromCollection;
            else
                areasToUse = areas;
        }
        else
        {
            // use areasFromCollection if its not null, otherwise use areas
            areasToUse = areasFromCollection ?? areas;
        }

        return areasToUse;
    }

    static async populateFastFormulaAreaCache(context: JsCtx, range: RangeInfo, sheetName: string, name: string): Promise<FastFormulaAreas>
    {
        return await context.getTrackedItemOrPopulate(
            name,
            async (context): Promise<CacheObject> =>
            {
                try
                {
                    const areas = await FastFormulaAreas.createFastFormulaItemsForRangeInfo(
                        context,
                        `${name}-rangeAreas`,
                        sheetName,
                        range);

                    return { type: ObjectType.TrObject, o: areas };
                }
                catch (e)
                {
                    return null;
                }
            });
    }

    static requestMergedAreasType(context: JsCtx, type: FastFormulaAreasItems): Excel.RangeAreas
    {
        const rangeInfoForMerges = FastFormulaAreaDefinitions.getRangeFromType(type);
        const sheetForMerges = context.Ctx.workbook.worksheets.getItem(FastFormulaAreaDefinitions.getSheetNameFromType(type));;
        const rangeForMerges = Ranges.rangeFromRangeInfo(sheetForMerges, rangeInfoForMerges);
        const areasMerges = rangeForMerges.getMergedAreasOrNullObject();

        areasMerges.load("areaCount, areas");

        return areasMerges;
    }

    /*----------------------------------------------------------------------------
        %%Function: FastFormulaAreas.populateAllCaches

        Populate all the caches we know about, including all of the formula areas
        as well as the workbook names items.

        There are two parts to fast cache access:
            * The values/formulas cache (this cache)
            * The range caches (RangeCaches.ts)

        Both of these need to be populated to be effectively used.
    ----------------------------------------------------------------------------*/
    static async populateAllCaches(context: JsCtx, dontPopulateMergeAreas?: boolean): Promise<FastFormulaAreaCachesCollection>
    {
        const name = this.s_allSheetsCache;

        return await context.getTrackedItemOrPopulate(
            name,
            async (context): Promise<CacheObject> =>
            {
                const collection = new FastFormulaAreaCachesCollection();
                const bkmk = "allSheetsBookmark";

                context.pushTrackingBookmark(bkmk);

                for (let type of [FastFormulaAreasItems.GameGrid, FastFormulaAreasItems.GameData, FastFormulaAreasItems.BracketDefs, FastFormulaAreasItems.RulesData])
                {
                    const sheetName = FastFormulaAreaDefinitions.getSheetNameFromType(type);
                    const range = FastFormulaAreaDefinitions.getRangeFromType(type);
                    const name = FastFormulaAreaDefinitions.getMapTypeNameFromType(type);

                    const areas = new FastFormulaAreas();
                    areas.m_sheetName = sheetName;

                    const rangeAreas = this.loadRangeAreasFromRangeInfo(context, range, sheetName);
                    context.addCacheObject(`${name}-rangeAreas`, { type: ObjectType.JsObject, o: rangeAreas });

                    areas.m_areasItems.push(new FastFormulaAreasItem(rangeAreas, range));

                    collection.add(type, areas);
                }

                context.Ctx.workbook.load("names");

                let areasMerges = null;
                if (!dontPopulateMergeAreas)
                    areasMerges = this.requestMergedAreasType(context, FastFormulaAreasItems.GameGrid);
                try
                {
                    // one sync to rule them all
                    await context.sync("populateAllCaches");
                    context.addCacheObject("workbookNamesItems", { type: ObjectType.JsObject, o: context.Ctx.workbook.names.items });
                    if (areasMerges)
                    {
                        context.addCacheObject(
                            FastFormulaAreaDefinitions.getCacheNameFromType(FastFormulaAreasItems.GameGrid, "mergeAreas"),
                            { type: ObjectType.JsObject, o: areasMerges });
                    }
                }
                catch (e)
                {
                    // failure means we have to release everything we cached
                    context.releaseCacheObjectsUntil(bkmk);
                    return null;
                }

                return { type: ObjectType.TrObject, o: collection };
            });
    }

    static async populateFastFormulaAreaCacheForType(context: JsCtx, type: FastFormulaAreasItems): Promise<FastFormulaAreas>
    {
        const cached = this.getFastFormulaAreaCacheForType(context, type);

        if (cached != null)
            return cached;

        return await this.populateFastFormulaAreaCache(
            context,
            FastFormulaAreaDefinitions.getRangeFromType(type),
            FastFormulaAreaDefinitions.getSheetNameFromType(type),
            FastFormulaAreaDefinitions.getMapTypeNameFromType(type));
    }
}

export class FastFormulaAreaCachesCollection
{
    m_mapTypeAreas: Map<FastFormulaAreasItems, FastFormulaAreas> = new Map<FastFormulaAreasItems, FastFormulaAreas>();

    add(type: FastFormulaAreasItems, item: FastFormulaAreas)
    {
        this.m_mapTypeAreas.set(type, item);
    }

    get(type: FastFormulaAreasItems): FastFormulaAreas
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