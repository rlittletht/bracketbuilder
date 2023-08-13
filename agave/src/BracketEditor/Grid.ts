import { RangeInfo, RangeOverlapKind, Ranges } from "../Interop/Ranges";
import { BracketDefinition, BracketManager } from "../Brackets/BracketDefinitions";
import { BracketGame, IBracketGame } from "./BracketGame";
import { BracketStructureBuilder } from "../Brackets/BracketStructureBuilder";
import { StructureEditor } from "./StructureEditor/StructureEditor";
import { GameLines } from "./GameLines";
import { GameFormatting } from "./GameFormatting";
import { GridGameInsert } from "./GridGameInsert";
import { FormulaBuilder } from "./FormulaBuilder";
import { GridItem } from "./GridItem";
import { GridChange, GridChangeOperation } from "./GridChange";
import { AppContext } from "../AppContext/AppContext";
import { GridAdjust } from "./GridAdjusters/GridAdjust";
import { GameId } from "./GameId";
import { GameNum } from "./GameNum";
import { s_staticConfig } from "../StaticConfig";
import { OADate } from "../Interop/Dates";
import { TrackingCache } from "../Interop/TrackingCache";
import { JsCtx } from "../Interop/JsCtx";
import { PerfTimer } from "../PerfTimer";
import { FastRangeAreas } from "../Interop/FastRangeAreas";
import { Prioritizer } from "./StructureEditor/Prioritizer";
import { TrError } from "../Exceptions";

// We like to have an extra blank row at the top of the game body
// (because the "advance to" line is often blank at the bottom)
// Choose which way to grow the game range to accommodate that extra
// row
export enum AdjustRangeGrowExtraRow
{
    None, // don't try to add an extra row
    Up,
    Down
}

export interface RangeOverlapDelegate
{
    (range: RangeInfo, item: GridItem, kind: RangeOverlapKind): boolean;
}

export interface RangeOverlapMatch
{
    range: RangeInfo;
    delegate: RangeOverlapDelegate
}

export class Grid
{
    m_gridItems: GridItem[] = [];
    m_firstGridPattern: RangeInfo;
    m_datesForGrid: Date[];
    m_fieldsToUse: number = 2;
    m_fLogChanges: boolean = s_staticConfig.logGridChanges;
    m_fLogGrid: boolean = s_staticConfig.logGrid;
    m_startingSlots: number[] = [10 * 60, 18 * 60, 18 * 60, 18 * 60, 18 * 60, 18 * 60, 9 * 60];
    m_mapGameItem: Map<number, GridItem> = new Map<number, GridItem>();
    m_finishingTouchesApplied: boolean;

    static createBasedOn(base: Grid): Grid
    {
        const grid = new Grid();
        grid.m_firstGridPattern = base.m_firstGridPattern.clone();

        return grid;
    }

    createFromRange(range: RangeInfo): Grid
    {
        const grid = Grid.createBasedOn(this);

        this.enumerateOverlapping(
            [{
                range: range,
                delegate: (_range: RangeInfo, item: GridItem, kind: RangeOverlapKind) =>
                {
                    _range;
                    kind;
                    if (item.isLineRange)
                        grid.addLineRange(item.Range);
                    else
                        grid.addGameRange(item.Range, item.GameId, item.SwapTopBottom);

                    return true;
                }
            }]);

        return grid;
    }

    get IsEmpty(): boolean { return this.m_gridItems.length == 0; }
    get FirstGridPattern(): RangeInfo { return this.m_firstGridPattern; }
    get FieldsToUse(): number { return this.m_fieldsToUse; }
    get AreDatesLoaded(): boolean { return this.m_datesForGrid ? true : false; }

    getFirstSlotForDate(date: Date): number
    {
        return this.m_startingSlots[date.getDay()];
    }

    getDateFromGridColumn(column: number): Date
    {
        column = column - this.m_firstGridPattern.FirstColumn;

        return this.m_datesForGrid[column];
    }

    getDateFromGridItem(item: GridItem): Date
    {
        return this.getDateFromGridColumn(item.Range.FirstColumn);
    }

    /*----------------------------------------------------------------------------
        %%Function: Grid.getItemForGameId

        return the grid item for the given game id.
    ----------------------------------------------------------------------------*/
    getItemForGameId(gameId: GameId): GridItem
    {
        if (this.m_mapGameItem.has(gameId.Value))
            return this.m_mapGameItem.get(gameId.Value);

        return null;
    }

    /*----------------------------------------------------------------------------
        %%Function: Grid.getFeedingGamesForGame

        return the source game items for this game's feeding games.
    ----------------------------------------------------------------------------*/
    getFeedingGamesForGame(game: IBracketGame): [GridItem, GridItem]
    {
        let topSourceGame: GridItem = null;
        let bottomSourceGame: GridItem = null;

        if (!BracketGame.IsTeamSourceStatic(game.TopSource))
        {
            const gameId = BracketManager.GameIdFromWinnerLoser(game.TopSource);
            topSourceGame = this.getItemForGameId(gameId);
        }
        if (!BracketGame.IsTeamSourceStatic(game.BottomSource))
        {
            const gameId = BracketManager.GameIdFromWinnerLoser(game.BottomSource);
            bottomSourceGame = this.getItemForGameId(gameId);
        }

        return [topSourceGame, bottomSourceGame];
    }

    /*----------------------------------------------------------------------------
        %%Function: Grid.getLatestTimeForDate

        get the latest time used on this date (and how many times it is used) and
        the fields used for that time slot

        time is returned in minutes since 00:00
    ----------------------------------------------------------------------------*/
    getLatestTimeForDate(date: Date): [number, number, string[]]
    {
        let maxTime: number = 0;
        let count: number = 0;
        let fields: string[] = [];

        this.enumerateMatching(
            (item: GridItem) =>
            {
                if (item.StartTime > maxTime)
                {
                    maxTime = item.StartTime;
                    fields = [item.Field];
                    count = 1;
                }
                else if (item.StartTime == maxTime)
                {
                    fields.push(item.Field);
                    count++;
                }
                return true;
            },
            (item: GridItem) =>
            {
                const itemDate = this.getDateFromGridItem(item);

                return itemDate.valueOf() == date.valueOf();
            });

        return [maxTime, count, fields];
    }

    setInternalGridItems(items: GridItem[])
    {
        this.m_gridItems = items;
    }

    enumerate(fun: (item: GridItem) => boolean): boolean
    {
        for (let item of this.m_gridItems)
            if (!fun(item))
                return false;

        return true;
    }

    enumerateMatching(fun: (item: GridItem) => boolean, matchFun: (item: GridItem) => boolean): boolean
    {
        for (let item of this.m_gridItems)
            if (matchFun(item))
                if (!fun(item))
                    return false;

        return true;
    }

    addGameRangeByIdValue(range: RangeInfo, gameIdValue: number, swapTopBottom: boolean): GridItem
    {
        return this.addGameRange(range, gameIdValue == -1 ? null : new GameId(gameIdValue), swapTopBottom);
    }

    addGameRange(range: RangeInfo, gameId: GameId, swapTopBottom: boolean): GridItem
    {
        let item: GridItem = new GridItem(range, gameId, false);
        item.m_swapTopBottom = swapTopBottom;
        this.m_gridItems.push(item);

        return item;
    }

    addLineRange(range: RangeInfo): GridItem
    {
        const newItem = new GridItem(range, null, true);
        this.m_gridItems.push(newItem);

        return newItem;
    }

    enumerateOverlapping(ranges: RangeOverlapMatch[]): boolean
    {
        return this.enumerate(
            (item: GridItem) =>
            {
                for (let range of ranges)
                {
                    const overlapKind: RangeOverlapKind = RangeInfo.isOverlapping(range.range, item.Range);

                    if (overlapKind != RangeOverlapKind.None)
                    {
                        if (!range.delegate(range.range, item, overlapKind))
                            return false;
                    }
                }

                return true;
            });
    }

    enumerateOverlappingNotBackwards(ranges: RangeOverlapMatch[]): boolean
    {
        return this.enumerate(
            (item: GridItem) =>
            {
                for (let range of ranges)
                {
                    const overlapKind: RangeOverlapKind = RangeInfo.isOverlappingNotBackwards(range.range, item.Range);

                    if (overlapKind != RangeOverlapKind.None)
                    {
                        if (!range.delegate(range.range, item, overlapKind))
                            return false;
                    }
                }

                return true;
            });
    }

    /*----------------------------------------------------------------------------
        %%Function: Grid.getBestOverlappingItem

        get the "best" overlapping item. this is the item that overlaps the most,
        with preferences given to an exact match
    ----------------------------------------------------------------------------*/
    getBestOverlappingItem(range: RangeInfo): [GridItem, RangeOverlapKind]
    {
        let item: GridItem = null;
        let pctOverlapBest: number = 0;

        let overlapKind: RangeOverlapKind = RangeOverlapKind.None;

        if (this.enumerateOverlapping(
            [
                {
                    range: range,
                    delegate: (matchRange: RangeInfo, matchItem: GridItem, matchKind: RangeOverlapKind) =>
                    {
                        matchRange;
                        if (matchKind == RangeOverlapKind.Equal)
                        {
                            item = matchItem;
                            overlapKind = matchKind;
                            return false;
                        }
                        let rangeIntersection =
                            RangeInfo.createFromCornersCoord(
                                Math.max(matchItem.Range.FirstRow, range.FirstRow),
                                Math.max(matchItem.Range.FirstColumn, range.FirstColumn),
                                Math.min(matchItem.Range.LastRow, range.LastRow),
                                Math.min(matchItem.Range.LastColumn, range.LastColumn));

                        const pctOverlap: number = (rangeIntersection.Area * 100) / range.Area;

                        if (pctOverlap > pctOverlapBest)
                        {
                            pctOverlapBest = pctOverlap;
                            item = matchItem;
                            overlapKind = matchKind;
                        }
                        return true;
                    }
                }
            ]))
        {
            return [null, RangeOverlapKind.None];
        }

        return [item, overlapKind];
    }


    getFirstOverlappingItem(range: RangeInfo): [GridItem, RangeOverlapKind]
    {
        let item: GridItem = null;
        let overlapKind: RangeOverlapKind;

        if (this.enumerateOverlapping(
            [
                {
                    range: range,
                    delegate: (matchRange: RangeInfo, matchItem: GridItem, matchKind: RangeOverlapKind) =>
                    {
                        matchRange;
                        item = matchItem;
                        overlapKind = matchKind;
                        return false;
                    }
                }
            ]))
        {
            return [null, RangeOverlapKind.None];
        }

        return [item, overlapKind];
    }

    getFirstOverlappingItemNotBackwards(range: RangeInfo): [GridItem, RangeOverlapKind]
    {
        let item: GridItem = null;
        let overlapKind: RangeOverlapKind;

        if (this.enumerateOverlappingNotBackwards(
            [
                {
                    range: range,
                    delegate: (matchRange: RangeInfo, matchItem: GridItem, matchKind: RangeOverlapKind) =>
                    {
                        matchRange;
                        item = matchItem;
                        overlapKind = matchKind;
                        return false;
                    }
                }
            ]))
        {
            return [null, RangeOverlapKind.None];
        }

        return [item, overlapKind];
    }

    getOverlappingItems(range: RangeInfo): GridItem[]
    {
        let items: GridItem[] = [];

        this.enumerateOverlapping(
            [
                {
                    range: range,
                    delegate: (matchRange: RangeInfo, matchItem: GridItem, matchKind: RangeOverlapKind) =>
                    {
                        matchRange;
                        matchKind;
                        items.push(matchItem);
                        return true;
                    }
                }
            ]);

        return items;
    }

    getMatchingItemOnGrid(range: RangeInfo, gameId: GameId): GridItem
    {
        const items: GridItem[] = this.getOverlappingItems(range);

        let match: GridItem = null;

        for (let item of items)
        {
            if (item.Range.isEqual(range) && item.GameId.equals(gameId))
            {
                match = item;
                break;
            }
        }

        if (match == null)
            throw new Error("old item not found on original grid");

        if (!GameId.compare(match.GameId, gameId))
            throw new Error("old item not found on original grid with matching id");

        return match;
    }
    
    /*----------------------------------------------------------------------------
        %%Function: Grid.isItemOnGrid

        return true if this item is on the grid, exactly as given
    ----------------------------------------------------------------------------*/
    isItemOnGrid(item: GridItem): boolean
    {
        const match: GridItem = this.getMatchingItemOnGrid(item.Range, item.GameId);

        return match != null && match.GameId.equals(item.GameId);
    }

    doesRangeOverlap(range: RangeInfo): RangeOverlapKind
    {
        let item: GridItem;
        let kind: RangeOverlapKind;

        [item, kind] = this.getFirstOverlappingItem(range);

        return kind;
    }

    /*----------------------------------------------------------------------------
        %%Function: Grid.isRowEmptyAround

        determines if the space *around* this column (the game width to the left
        and right) is empty.
    ----------------------------------------------------------------------------*/
    isRowEmptyAround(row: number, column: number): boolean
    {
        const blankCheck: RangeInfo = new RangeInfo(row, 1, column - 3, column + 5);

        return this.doesRangeOverlap(blankCheck) == RangeOverlapKind.None;
    }

    isBlankRow(row: number): boolean
    {
        const blankCheck: RangeInfo = new RangeInfo(row, 1, 0, 1000);

        return this.doesRangeOverlap(blankCheck) == RangeOverlapKind.None;
    }

    /*----------------------------------------------------------------------------
        %%Function: Grid.isRangeIndependent

        return true if there are no items spanning into or out of this range.

        Its OK for items to be on the boundary, but they must not cross into or
        out of this range
    ----------------------------------------------------------------------------*/
    isRangeIndependent(range: RangeInfo): boolean
    {
        let items: GridItem[] = this.getOverlappingItems(range);

        for (let item of items)
        {
            // we know that item overlaps our range. make sure it doesn't extend
            // out of our range
            if (item.Range.FirstRow < range.FirstRow
                || item.Range.LastRow > range.LastRow
                || item.Range.FirstColumn < range.FirstColumn
                || item.Range.LastColumn > range.LastColumn)
            {
                return false;
            }
        }

        return true;
    }
    /*----------------------------------------------------------------------------
        %%Function: Grid.diff
    ----------------------------------------------------------------------------*/
    diff(gridRight: Grid, bracket: string): GridChange[]
    {
        let changes: GridChange[] = [];

        // lets do this the horrible n^2 way first

        for (let itemLeft of this.m_gridItems)
        {
            let itemRight: GridItem;
            let kind: RangeOverlapKind;

            [itemRight, kind] = gridRight.getFirstOverlappingItem(itemLeft.Range);

            if (kind != RangeOverlapKind.Equal
                || !GameId.compare(itemLeft.GameId, itemRight.GameId)
                || (!itemLeft.isLineRange && itemLeft.SwapTopBottom != itemRight.SwapTopBottom))
            {
                // any kind of difference means this has to be removed
                changes.push(new GridChange(GridChangeOperation.Remove, itemLeft));
            }
        }

        // now diff the other way
        for (let itemRight of gridRight.m_gridItems)
        {
            let itemLeft: GridItem;
            let kind: RangeOverlapKind;

            [itemLeft, kind] = this.getFirstOverlappingItem(itemRight.Range);

            if (kind != RangeOverlapKind.Equal
                || !GameId.compare(itemRight.GameId, itemLeft.GameId)
                || (!itemRight.isLineRange && itemRight.SwapTopBottom != itemLeft.SwapTopBottom))
            {
                let connectedTop: boolean = false;
                let connectedBottom: boolean = false;

                if (!itemRight.isLineRange)
                {
                    let gameStatic: IBracketGame = BracketGame.CreateFromGameSync(bracket, itemRight.GameNumber);

                    itemRight.inferGameInternalsIfNecessary();
                    const [top, bottom] = gridRight.getConnectedGridItemsForGameFeeders(itemRight, gameStatic);

                    connectedTop = top != null;
                    connectedBottom = bottom != null;
                }
                // any kind of difference means this is an add
                changes.push(new GridChange(GridChangeOperation.Insert, itemRight, connectedTop, connectedBottom));
            }
        }

        return changes;
    }

    /*----------------------------------------------------------------------------
        %%Function: Grid.clone
    ----------------------------------------------------------------------------*/
    clone(): Grid
    {
        let grid: Grid = new Grid();

        for (let item of this.m_gridItems)
        {
            grid.m_gridItems.push(GridItem.createFromItem(item));
        }

        grid.m_firstGridPattern = this.m_firstGridPattern;
        return grid;
    }

    /*----------------------------------------------------------------------------
        %%Function: Grid.findGameItem
    ----------------------------------------------------------------------------*/
    findGameItem(gameId: GameId): GridItem
    {
        for (let item of this.m_gridItems)
        {
            if (GameId.compare(item.GameId, gameId))
                return item;
        }

        return null;
    }

    /*----------------------------------------------------------------------------
        %%Function: Grid.findContainingItem
    ----------------------------------------------------------------------------*/
    findContainingItem(range: RangeInfo): GridItem
    {
        for (let item of this.m_gridItems)
        {
            if (RangeInfo.isOverlapping(item.Range, range) != RangeOverlapKind.None)
                return item;
        }

        return null;
    }

    inferGameItemFromSelection(rangeSelected: RangeInfo): GridItem
    {
        // see if we are intersecting a game and that is what we will remove
        const [item, kind] = this.getFirstOverlappingItem(rangeSelected);

        if (kind != RangeOverlapKind.None && item != null && !item.isLineRange)
            return item;

        return null;
    }

    /*----------------------------------------------------------------------------
        %%Function: Grid.getAllGameLines

        find the in and out lines for this game
    ----------------------------------------------------------------------------*/
    getAllGameLines(gameItem: GridItem): GridItem[]
    {
        let items: GridItem[] = [];

        let item = this.findContainingItem(gameItem.TopTeamRange.offset(1, 1, -1, 1));
        if (item != null && item.isLineRange)
            items.push(item);

        if (gameItem.BottomTeamRange != null)
        {
            item = this.findContainingItem(gameItem.BottomTeamRange.offset(-1, 1, -1, 1));
            if (item != null && item.isLineRange)
                items.push(item);
        }

        if (gameItem.GameNumberRange != null)
        {
            item = this.findContainingItem(gameItem.GameNumberRange.offset(1, 1, 2, 1));
            if (item != null && item.isLineRange)
                items.push(item);
        }

        return items;
    }

    /*----------------------------------------------------------------------------
        %%Function: Grid.getAllGameItems

        return all of the items for this game -- game item and all in and out
        lines.

        the game item will be the first item in the array
    ----------------------------------------------------------------------------*/
    getAllGameItems(gameId: GameId): GridItem[]
    {
        let items: GridItem[] = [];

        let item = this.findGameItem(gameId);
        if (item == null)
            return [];

        items.push(item);
        return items.concat(this.getAllGameLines(item));
    }

    /*----------------------------------------------------------------------------
        %%Function: Grid.removeItem
    ----------------------------------------------------------------------------*/
    removeItem(item: GridItem)
    {
        for (let i: number = 0; i < this.m_gridItems.length; i++)
        {
            if (item.isEqual(this.m_gridItems[i]))
            {
                this.m_gridItems.splice(i, 1);
                return;
            }
        }
    }

    /*----------------------------------------------------------------------------
        %%Function: Grid.removeItems
    ----------------------------------------------------------------------------*/
    removeItems(items: GridItem[])
    {
        for (let item of items)
        {
            this.removeItem(item);
        }
    }

    static async isFinishingTouchesApplied(context: JsCtx): Promise<boolean>
    {
        const sheet: Excel.Worksheet = context.Ctx.workbook.worksheets.getActiveWorksheet();

        let range: RangeInfo = new RangeInfo(0, 1, 0, 100);
        const rng: Excel.Range = Ranges.rangeFromRangeInfo(sheet, range);
        let areas: Excel.RangeAreas = rng.getMergedAreasOrNullObject();

        areas.load("areaCount");
        areas.load("areas");
        await context.sync();

        // the presence of any merge areas means some finishing touches have been applied
        return (!areas.isNullObject);
    }

    /*----------------------------------------------------------------------------
        %%Function: Grid.createGridFromBracket
    ----------------------------------------------------------------------------*/
    static async createGridFromBracket(context: JsCtx, bracketName: string): Promise<Grid>
    {
        let grid: Grid = new Grid();

        AppContext.checkpoint("cgfb.1");
        await grid.loadGridFromBracket(context, bracketName);
        return grid;
    }

    /*----------------------------------------------------------------------------
        %%Function: Grid.getGridColumnDateValues

        This requires thet m_firstGridPattern is already loaded (we will use the
        first repeating column as the first column we need a date for)
    ----------------------------------------------------------------------------*/
    async getGridColumnDateValues(context: JsCtx): Promise<Date[]>
    {
        const sheet: Excel.Worksheet = context.Ctx.workbook.worksheets.getActiveWorksheet();
        context.Ctx.trackedObjects.add(sheet);

        const columns: RangeInfo = this.m_firstGridPattern.offset(-this.m_firstGridPattern.FirstRow, this.m_firstGridPattern.FirstRow, 0, 1);
        const rngColumns: Excel.Range = Ranges.rangeFromRangeInfo(sheet, columns);

        rngColumns.load("values");
        await context.sync();

        // walk backwards up the column to find the first non-empty cell. This is the date row
        const colData: any[][] = rngColumns.values;
        let rowDates: number = -1;

        for (let i = this.m_firstGridPattern.FirstRow - 1; i >= 0; i--)
        {
            if (colData[i][0] != null && colData[i][0] != "")
            {
                rowDates = i;
                break;
            }
        }

        if (rowDates == -1)
        {
            context.Ctx.trackedObjects.remove(sheet);
            throw new Error("couldn't find date for column");
        }

        let range: RangeInfo = new RangeInfo(rowDates, 1, this.m_firstGridPattern.FirstColumn, 18 * 3);
        const rng: Excel.Range = Ranges.rangeFromRangeInfo(sheet, range);
        let areas: Excel.RangeAreas = rng.getMergedAreasOrNullObject();

        areas.load("areaCount");
        areas.load("rowIndex");
        areas.load("columnIndex");
        areas.load("columnCount");
        areas.load("areas");
        rng.load("values");
        await context.sync();

        // build an array of merged area mappings
        const data: any[][] = rng.values;

        let merges: number[] = Array.from({ length: data[0].length }, () => 0);

        if (!areas.isNullObject)
        {
            for (let i = 0; i < areas.areaCount; i++)
            {
                const rangeAreas: Excel.RangeCollection = areas.areas;
                const rangeArea: Excel.Range = rangeAreas.items[i];

                let iMerge = rangeArea.columnIndex - range.FirstColumn;

                if (iMerge < merges.length)
                {
                    let count = rangeArea.columnCount + 1;
                    while (count > 0)
                        merges[iMerge--] = count--;
                }
            }
        }

        let dates: Date[] = [];

        let i = 0;
        while (i < data[0].length)
        {
            let item = data[0][i];
            if (item == null || item == "")
            {
                i++;
                dates.push(null);
                continue;
            }

            const date: Date = OADate.FromOADate(item);
            dates.push(date);
            const mergeCount = merges[i];
            i++;
            for (let i2 = mergeCount - 1; i2 > 0; i2--)
            {
                dates.push(date);
                i++;
            }
        }

        // now 
        context.Ctx.trackedObjects.remove(sheet);
        return dates;
    }

    /*----------------------------------------------------------------------------
        %%Function: Grid.getFirstGridPatternCell

        we rely on a regular pattern of cell formatting to make the bracket work.

        to be robust with users inserting extra rows at the top and the left,
        we will automatically figure out where this pattern stars.

        For rows, we are looking for
            Full Height
            [line row]
            Full Height
            [line row]
        
        For columns, we are looking for
            Title | Score | Line | Title | Score | Line

    ----------------------------------------------------------------------------*/
    getFirstGridPatternCell(fastRangeAreas: FastRangeAreas): RangeInfo
    {
        let range: RangeInfo = new RangeInfo(8, 1, 0, 1);

        let matchedPatterns = 0;
        let firstMatchedRow = -1;

        while (range.FirstRow < 20 && matchedPatterns < 3)
        {
            if (GameFormatting.isCellInLineRowFaster(fastRangeAreas, range))
            {
                firstMatchedRow = -1;
                matchedPatterns = 0;
                range = range.offset(1, 1, 0, 1);
                continue;
            }

            if (firstMatchedRow == -1)
                firstMatchedRow = range.FirstRow;

            range = range.offset(1, 1, 0, 1);
            if (!GameFormatting.isCellInLineRowFaster(fastRangeAreas, range))
            {
                firstMatchedRow = -1;
                matchedPatterns = 0;
                continue;
            }
            matchedPatterns++;
            range = range.offset(1, 1, 0, 1);
        }

        if (matchedPatterns < 3)
        {
            console.log('returning null for gridPattern');
            return null;
        }

        matchedPatterns = 0;
        let firstMatchedColumn = -1;
        range = new RangeInfo(firstMatchedRow, 1, 2, 1);

        while (range.FirstColumn + 3 < 25 && matchedPatterns < 3)
        {
            if (!GameFormatting.isCellInGameTitleColumnFaster(fastRangeAreas, range))
            {
                firstMatchedColumn = -1;
                matchedPatterns = 0;
                range = range.offset(0, 1, 1, 1);
                continue;
            }

            if (firstMatchedColumn == -1)
                firstMatchedColumn = range.FirstColumn;

            range = range.offset(0, 1, 1, 1);
            if (!GameFormatting.isCellInGameScoreColumnFaster(fastRangeAreas, range))
            {
                firstMatchedColumn = -1;
                matchedPatterns = 0;
                // don't advance -- we want to consider the current column
                // as a title column
                continue;
            }

            range = range.offset(0, 1, 1, 1);
            if (!GameFormatting.isCellInLineColumnFaster(fastRangeAreas, range))
            {
                firstMatchedColumn = -1;
                matchedPatterns = 0;
                range = range.offset(0, 1, 1, 1);
                continue;
            }
            range = range.offset(0, 1, 1, 1);
            matchedPatterns++;
        }

        if (matchedPatterns < 3)
        {
            console.log('returning null for gridPattern');
            return null;
        }

        const rangeReturn: RangeInfo = new RangeInfo(firstMatchedRow, 1, firstMatchedColumn, 1);
        console.log(`returning ${rangeReturn.toString()} for gridPattern`);

        return rangeReturn;
    }

    /*----------------------------------------------------------------------------
        %%Function: Grid.inferGamePriorityFromSource

        Infer the priority for this team based on its source.
        If the source game has the same priority for both teams, then the result
        of the game is irrelevant -- the priority will be the same.

        returns < 0 if we can't infer or if its not set.
    ----------------------------------------------------------------------------*/
    inferGamePriorityFromSource(teamSource: string): number
    {
        // need to see if we can infer the priority of this game
        // get the source
        const source: string = teamSource;
        const gameId: GameId = BracketManager.GameIdFromWinnerLoser(source);
        const sourceItem: GridItem = this.getItemForGameId(gameId);

        if (sourceItem == null)
            return -1;

        return sourceItem.GamePriority;
    }

    /*----------------------------------------------------------------------------
        %%Function: Grid.loadGridFromBracket
    ----------------------------------------------------------------------------*/
    async loadGridFromBracket(context: JsCtx, bracketName: string)
    {
        const timer: PerfTimer = new PerfTimer();
        const priorityMap: Map<string, number> = await Prioritizer.getTeamPriorityMap(context, null);

        timer.pushTimer("buld fastRangeAreas");
        let sheet: Excel.Worksheet = context.Ctx.workbook.worksheets.getActiveWorksheet();
        const fastRangeAreas: FastRangeAreas =
            await FastRangeAreas.getRangeAreasGridForRangeInfo(
                context,
                "bigGridCache",
                sheet,
                new RangeInfo(8, 150, 0, 50));

        timer.popTimer();

        AppContext.checkpoint("lgfb.1");
        timer.pushTimer("getFirstGridPatternCell");
        this.m_firstGridPattern = this.getFirstGridPatternCell(fastRangeAreas);
        if (this.m_firstGridPattern == null)
            throw new Error("could not load grid pattern");

        timer.popTimer();
        timer.pushTimer("getGridColumnDateValues");
        this.m_datesForGrid = await this.getGridColumnDateValues(context);
        timer.popTimer();
        timer.pushTimer("getFieldCount");
        this.m_fieldsToUse = await StructureEditor.getFieldCount(context);
        timer.popTimer();

        // go through all the game definitions and try to add them to the grid
        let bracketDef: BracketDefinition = BracketStructureBuilder.getBracketDefinition(`${bracketName}Bracket`);

        AppContext.checkpoint("lgfb.2");
        timer.pushTimer("loadGridFromBracket::loop");
        for (let i: number = 0; i < bracketDef.games.length; i++)
        {
            let game: BracketGame = new BracketGame()
            let feederTop: RangeInfo = null;
            let feederBottom: RangeInfo = null;
            let feederWinner: RangeInfo = null;

            AppContext.checkpoint("lgfb.3");
            await game.Load(context, null, bracketName, new GameNum(i));
            AppContext.checkpoint("lgfb.4");
            if (game.IsLinkedToBracket)
            {
                let overlapKind: RangeOverlapKind = this.doesRangeOverlap(game.FullGameRange);

                // the game can't overlap anything
                if (overlapKind != RangeOverlapKind.None)
                    throw new Error(`overlapping detected on loadGridFromBracket: game ${game.GameId.Value}`);

                const gameItem: GridItem = this.addGameRange(game.FullGameRange, game.GameId, false);

                gameItem.attachGame(game);

                // the feeder lines are allowed to perfectly overlap other feeder lines
                AppContext.checkpoint("lgfb.5");
                // before we try this, check to see if we need to expand our fastRangeAreas
                const moreRowsNeeded = fastRangeAreas.rowCountNeededToExpand(game.FullGameRange.bottomRight());
                if (moreRowsNeeded)
                    await fastRangeAreas.addRangeAreaGridForRangeInfo(context, `bigGridCache${game.FullGameRange.bottomRight().FirstRow}`, sheet, moreRowsNeeded);

                [feederTop, feederBottom, feederWinner] = await GameLines.getInAndOutLinesForGame(context, fastRangeAreas, game);
                AppContext.checkpoint("lgfb.6");

                // We are going to be tolerant here -- sometimes our feeder calculations
                // identify game underlines as actual feeder lines. that means we would
                // get an overlap here. just ignore those.
                if (feederTop != null)
                {
                    overlapKind = this.doesRangeOverlap(feederTop);

                    if (overlapKind == RangeOverlapKind.None)
                        this.addLineRange(feederTop);
                }
                if (feederBottom != null)
                {
                    overlapKind = this.doesRangeOverlap(feederBottom);

                    if (overlapKind == RangeOverlapKind.None)
                        this.addLineRange(feederBottom);
                }
                if (feederWinner != null)
                {
                    overlapKind = this.doesRangeOverlap(feederWinner);

                    if (overlapKind == RangeOverlapKind.None)
                        this.addLineRange(feederWinner);
                }

                // get the priority for the top and bottom games
                if (game.TopTeamNameValue != "")
                {
                    if (priorityMap.has(game.TopTeamNameValue))
                        gameItem.setTopPriority(priorityMap.get(game.TopTeamNameValue));
                }
                else
                {
                    const priority: number = this.inferGamePriorityFromSource(game.TopTeamName);
                    if (priority >= 0)
                            gameItem.setTopPriority(priority);
                }

                if (game.BottomTeamNameValue != "")
                {
                    if (priorityMap.has(game.BottomTeamNameValue))
                        gameItem.setBottomPriority(priorityMap.get(game.BottomTeamNameValue));
                }
                else
                {
                    const priority: number = this.inferGamePriorityFromSource(game.BottomTeamName);
                    if (priority >= 0)
                        gameItem.setBottomPriority(priority);
                }

                this.m_mapGameItem.set(gameItem.GameId.Value, gameItem);
            }
            timer.stopAllAggregatedTimers();
        }
        timer.popTimer();
        this.logGrid();
    }

    getOutgoingConnectionForGameResult(gameId: GameId): RangeInfo
    {
        const item: GridItem = this.findGameItem(gameId);

        if (item == null || item.GameNumberRange == null)
            return null;

        return item.OutgoingFeederPoint;
    }

    /*----------------------------------------------------------------------------
        %%Function: Grid.getTargetGameFeedForGameResult

        Given a result (e.g. W5), find the feeder cell for the game that wants to
        connect to this game result
    ----------------------------------------------------------------------------*/
    getTargetGameFeedForGameResult(game: IBracketGame): RangeInfo
    {
        const targetGameId: GameId = game.WinningTeamAdvancesToGameId;
        if (targetGameId == null)
            return null; // winner goes nowhere

        const item: GridItem = this.findGameItem(targetGameId);

        if (item == null)
            return null;

        if ((game.BracketGameDefinition.winner[0] === "T" && item.SwapTopBottom == false)
            || (game.BracketGameDefinition.winner[0] === "B" && item.SwapTopBottom == true))
        {
            // the two cases we want the top game
            return item.TopTeamRange.offset(1, 1, -1, 1);
        }
        else
        {
            return item.BottomTeamRange.offset(-1, 1, -1, 1);
        }
    }

    /*----------------------------------------------------------------------------
        %%Function: Grid.doFeederLinesOverlap

        return string describing the overlap, or null if no overlap

        the column value is the actual insert column, so adjust it to be the
        first non-game column before this game insert
    ----------------------------------------------------------------------------*/
    doFeederLinesOverlap(source1: RangeInfo, source2: RangeInfo, column: number): string
    {
        if (source1 != null)
        {
            const range1: RangeInfo = RangeInfo.createFromCorners(
                source1,
                source1.newSetColumn(column - 1));

            if (range1.ColumnCount > 0 && this.doesRangeOverlap(range1) != RangeOverlapKind.None)
            {
                return `Top feeder line (${source1.toString()}) overlaps existing item`;
            }
        }

        if (source2 != null)
        {
            const range2: RangeInfo = RangeInfo.createFromCorners(
                source2,
                source2.newSetColumn(column - 1));

            if (range2.ColumnCount > 0 && this.doesRangeOverlap(range2) != RangeOverlapKind.None)
            {
                return `Bottom feeder line (${source2.toString()}) overlaps existing item`;
            }
        }

        return null;
    }

    /*----------------------------------------------------------------------------
        %%Function: Grid.adjustRangeForGridAlignment

        adjust the given rangeInfo to align with:
        
        * the top left cell should be in a full height row, and should be in a
          game title column)
        * bottom right cell should be in a full height row, and should be in the
          same game title column
        
        use the calculated pattern start location as the basis for this alignment

        nudge up for top cell and down for bottom cell
    ----------------------------------------------------------------------------*/
    adjustRangeForGridAlignment(range: RangeInfo, addExtraRow: AdjustRangeGrowExtraRow): RangeInfo
    {
        if (addExtraRow != AdjustRangeGrowExtraRow.None)
        {
            const dcRows: number = (range.RowCount - 7) % 4;
        }

        if ((range.FirstRow & 0x01) != (this.m_firstGridPattern.FirstRow & 0x01))
        {
            range.m_rowStart--;
            range.m_rowCount++;
        }

        if ((range.LastRow & 0x01) != (this.m_firstGridPattern.LastRow & 0x01))
        {
            range.m_rowCount++;
        }

        const colAdjust: number =
            Math.abs(range.FirstColumn - this.m_firstGridPattern.FirstColumn) % 3;

        if (colAdjust > 0)
            range.m_columnStart += colAdjust;

        if (addExtraRow != AdjustRangeGrowExtraRow.None)
        {
            const dcRows: number = (range.RowCount - 7) % 4;
            if (addExtraRow == AdjustRangeGrowExtraRow.Up)
            {
                range.m_rowStart -= dcRows;
                range.m_rowCount += dcRows;
            }
            else
            {
                range.m_rowCount += dcRows;
            }
        }

        return range;
    }

    buildGridGameForSpecificRequestedRange(
        source1: RangeInfo,
        source2: RangeInfo,
        outgoing: RangeInfo,
        requested: RangeInfo,
        fSwapTopBottom: boolean): GridGameInsert
    {
        let gameInsert: GridGameInsert = new GridGameInsert();

        // (we can always adjust +/- 1 row to make the requested range work)
        if (source1 != null) {
            if (source1.fuzzyMatchRow(requested.FirstRow + 1, 1)) {
                requested.setRow(source1.FirstRow - 1);
            }
            else if (source1.fuzzyMatchRow(requested.LastRow - 1, 1)) {
                // if the top game (source1) matches the bottom of our requested range
                // then we have to swap whatever the state of swap is
                const temp = source1;
                source1 = source2;
                source2 = temp;
                fSwapTopBottom = !fSwapTopBottom
                if (source1 != null)
                    requested.setRow(source1.FirstRow - 1);
                else
                {
                    if (requested.RowCount < 11)
                        requested.setRow(source2.offset(-11 + 2, 1, 0, 1).FirstRow);
                }
            }
        }
        if (source2 != null)
        {
            if (source2.fuzzyMatchRow(requested.LastRow - 1, 1))
            {
                requested.setLastRow(source2.LastRow + 1);
            }
            else if (source2.fuzzyMatchRow(requested.FirstRow + 1, 1))
            {
                requested.setRow(source2.FirstRow - 1);
                const temp = source1;
                source1 = source2;
                source2 = temp;
                fSwapTopBottom = !fSwapTopBottom
            }
        }
        // now adjust the range so it aligns with the grid. (it should align if there were
        // feeder lines, but when there aren't feeder lines we might have to nudge it)
        this.adjustRangeForGridAlignment(requested, AdjustRangeGrowExtraRow.None);

        const fIncludeFeederLines = this.doFeederLinesOverlap(source1, source2, requested.FirstColumn) == null;

        // lastly figure out if we can include the winner feeder output
        const fIncludeWinnerLine = outgoing != null
            && this.doesRangeOverlap(
                RangeInfo.createFromCorners(
                    outgoing.newSetColumn(requested.FirstColumn + 3),
                    outgoing)) == RangeOverlapKind.None;

        gameInsert.m_rangeGame = new RangeInfo(requested.FirstRow, requested.RowCount, requested.FirstColumn, 3);

        gameInsert.setFeedersFromSources(
            fIncludeFeederLines ? source1 : null,
            fIncludeFeederLines ? source2 : null,
            fIncludeWinnerLine ? outgoing : null,
            requested.FirstColumn,
            fSwapTopBottom);

        gameInsert.m_swapTopBottom = fSwapTopBottom;

        return gameInsert;
    }

    /*----------------------------------------------------------------------------
        %%Function: Grid.shouldGrowUpInstead

        most times we want to grow down. but sometimes growing up makes more
        sense:
        * we are at the top of the grid
        * growing down will overlap something
        * growing down will mean our immedate left neighbord will overlap
          something
    ----------------------------------------------------------------------------*/
    shouldGrowUpInstead(requested: RangeInfo): boolean
    {
        // are we at the top of the grid?
        if (requested.FirstRow - 6 > this.m_firstGridPattern.FirstRow
            && this.doesRangeOverlap(
                RangeInfo.createFromCorners(
                    this.m_firstGridPattern,
                    requested.offset(-6, 1, 0, 1)))
            == RangeOverlapKind.None)
        {
            return true;
        }

        // will growing down overlap something, but growing up won't?
        if (this.doesRangeOverlap(
                RangeInfo.createFromCorners(
                    requested,
                    requested.offset(11 - 1, 1, 2, 1)))
            != RangeOverlapKind.None)
        {
            return true;
        }

        // will growing down overlap something on our left?
        const check: RangeInfo = RangeInfo.createFromCorners(
            requested.offset(11 - 3, 1, -1, 1),
            requested.offset(11 - 1, 1, 1, 1));

        if (this.doesRangeOverlap(check) != RangeOverlapKind.None)
        {
            // one more check -- does growing up conflict too?
            const check2: RangeInfo = RangeInfo.createFromCorners(
                requested.offset(-11, 1, -1, 1),
                requested.offset(-11 + 1 + 1, 1, 1, 1));

            if (this.doesRangeOverlap(check2) == RangeOverlapKind.None)
                return true;
        }


        return false;
    }

    /*----------------------------------------------------------------------------
        %%Function: Grid.growUnanchoredRangeUpToAvoidConflictsOnLeft

        We have a range that is not anchored on the top, so there shouldn't be
        a feeder line. this means that our title line and our underline should
        have nothing to the left. If they do, then grow until they don't
    ----------------------------------------------------------------------------*/
    growUnanchoredRangeUpToAvoidConflictsOnLeft(range: RangeInfo): RangeInfo
    {
        let rangeReturn: RangeInfo = RangeInfo.createFromRangeInfo(range);
        let rangeCheck: RangeInfo = range.offset(0, 4, -1, 2);

        while (rangeCheck.FirstRow >= this.FirstGridPattern.FirstRow)
        {
            if (this.doesRangeOverlap(rangeCheck) == RangeOverlapKind.None)
                return rangeReturn;

            rangeCheck.setRow(rangeCheck.FirstRow - 2);
            rangeReturn.setRowResize(rangeReturn.FirstRow - 2);
        }

        return null;
    }

    /*----------------------------------------------------------------------------
        %%Function: Grid.growUnanchoredRangeDownToAvoidConflictsOnLeft
    ----------------------------------------------------------------------------*/
    growUnanchoredRangeDownToAvoidConflictsOnLeft(range: RangeInfo): RangeInfo
    {
        let rangeReturn: RangeInfo = RangeInfo.createFromRangeInfo(range);
        let rangeCheck: RangeInfo = range.bottomLeft().offset(-2, 2, -1, 2);

        while (rangeCheck.LastRow <= 1000)
        {
            if (this.doesRangeOverlap(rangeCheck) == RangeOverlapKind.None)
                return rangeReturn;

            rangeCheck.setRow(rangeCheck.FirstRow + 2);
            rangeReturn.setLastRow(rangeReturn.LastRow + 2);
        }

        return null;
    }


    /*----------------------------------------------------------------------------
        %%Function: Grid.buildGridGameForAnchoredSourceNoOutgoingPresent

        Note that we don't take the other match since there's only one match...

        This also handles the championship game
    ----------------------------------------------------------------------------*/
    buildGridGameForAnchoredSourceNoOutgoingPresent(
        source1: RangeInfo,
        source2: RangeInfo,
        anchor: RangeInfo,
        other: RangeInfo,
        requested: RangeInfo,
        fChampionshipGame: boolean,
        fSwapTopBottom: boolean)
    {
        let gameInsert: GridGameInsert = new GridGameInsert();

        if (anchor != null && other != null)
        {
            if (fChampionshipGame)
                return GridGameInsert.createFailedGame("championship game can't have two feeder sources");

            // we passed the check, we know our dimensions
            gameInsert.m_rangeGame =
                RangeInfo.createFromCorners(
                    source1.offset(-1, 1, 0, 1).newSetColumn(requested.FirstColumn),
                    source2.offset(1, 1, 0, 1).newSetColumn(requested.FirstColumn + 2));

            gameInsert.setFeedersFromSources(
                source1,
                source2,
                null,
                requested.FirstColumn,
                fSwapTopBottom);

            gameInsert.m_swapTopBottom = fSwapTopBottom;

            if (!this.isValidGridGameInsert(gameInsert))
                return gameInsert;

            return gameInsert;
        }

        // no outgoing, so just grow down unless we are the top game
        // (offset from the requested cell by 6 rows to clear any feeding games)
        if (this.shouldGrowUpInstead(requested) && !fChampionshipGame)
        {
            const temp = source1;
            source1 = source2;
            source2 = temp;

            // we are growing up. have to swap
            fSwapTopBottom = !fSwapTopBottom;
            gameInsert.m_rangeGame =
                RangeInfo.createFromCorners(
                    anchor.offset(
                        -11 + 1 + 1,
                        1,
                        0,
                        1).newSetColumn(requested.FirstColumn),
                    anchor.offset(1, 1, 2, 1).newSetColumn(requested.FirstColumn + 2));

            gameInsert.m_rangeGame = this.growUnanchoredRangeUpToAvoidConflictsOnLeft(gameInsert.m_rangeGame);
            if (gameInsert.m_rangeGame == null)
                return GridGameInsert.createFailedGame("couldn't adjust the range to avoid a conflict on the left");

            gameInsert.setFeedersFromSources(
                source1,
                source2,
                null,
                requested.FirstColumn,
                fSwapTopBottom);

            if (!this.isValidGridGameInsert(gameInsert))
                return gameInsert;

            gameInsert.m_swapTopBottom = fSwapTopBottom;
            return gameInsert;
        }

        // we are growing down
        gameInsert.m_rangeGame =
            RangeInfo.createFromCorners(
                anchor.offset(-1, 1, 0, 1).newSetColumn(requested.FirstColumn),
                anchor.offset(
                    fChampionshipGame ? (3 - 2) : (11 - 2),
                    1,
                    0,
                    1).newSetColumn(requested.FirstColumn + 2));

        if (!fChampionshipGame)
        {
            gameInsert.m_rangeGame = this.growUnanchoredRangeDownToAvoidConflictsOnLeft(gameInsert.m_rangeGame);
            if (gameInsert.m_rangeGame == null)
                return GridGameInsert.createFailedGame("couldn't adjust the range to avoid a conflict on the left");
        }

        gameInsert.m_isChampionshipGame = fChampionshipGame;

        gameInsert.setFeedersFromSources(
            source1,
            source2,
            null,
            requested.FirstColumn,
            fSwapTopBottom);

        if (!this.isValidGridGameInsert(gameInsert))
            return gameInsert;

        gameInsert.m_swapTopBottom = fSwapTopBottom;
        return gameInsert;
    }

    buildGridGameFor2Feeders(
        source1: RangeInfo,
        source2: RangeInfo,
        outgoing: RangeInfo,
        requested: RangeInfo,
        fSwapTopBottom: boolean)
    {
        let gameInsert: GridGameInsert = new GridGameInsert();

        gameInsert.m_rangeGame =
            RangeInfo.createFromCorners(
                source1.offset(-1, 1, 0, 1).newSetColumn(requested.FirstColumn),
                source2.offset(1, 1, 0, 1).newSetColumn(requested.FirstColumn + 2));

        if (outgoing != null)
        {
            const check: RangeInfo = Grid.getRangeInfoForGameInfo(gameInsert.m_rangeGame);
            if (check.FirstRow + 1 != outgoing.FirstRow)
            {
                gameInsert.m_failReason =
                    `Feeder ranges can't line up without outgoing feeder: rows ${check.FirstRow + 1} != ${outgoing
                    .FirstRow
                    }`;
                return gameInsert;
            }
        }

        gameInsert.setFeedersFromSources(
            source1,
            source2,
            outgoing,
            requested.FirstColumn,
            fSwapTopBottom);

        if (!this.isValidGridGameInsert(gameInsert))
            return gameInsert;

        gameInsert.m_swapTopBottom = fSwapTopBottom;

        return gameInsert;
    }


    buildGridGameForOneAnchoredSourceWithOutgoingPresent(
        source1: RangeInfo,
        source2: RangeInfo,
        outgoing: RangeInfo,
        anchor: RangeInfo,
        other: RangeInfo,
        requested: RangeInfo,
        fSwapTopBottom: boolean)
    {
        let gameInsert: GridGameInsert = new GridGameInsert();

        if (anchor != null && other != null)
        {
            // find out if its possible to hook everything up
            const check: RangeInfo = Grid.getRangeInfoForGameInfo(
                RangeInfo.createFromCornersSafe(anchor.offset(-1, 1, 0, 1), other.offset(1, 1, 0, 1)));

            if (check.FirstRow + 1 != outgoing.FirstRow)
            {
                // the outgoing line can't be accommodated
                gameInsert.m_failReason = "outgoing line can't fit with top and bottom feeders";
                return gameInsert;
            }

            // we passed the check, we know our dimensions
            gameInsert.m_rangeGame =
                RangeInfo.createFromCorners(
                    source1.offset(-1, 1, 0, 1).newSetColumn(requested.FirstColumn),
                    source2.offset(1, 1, 0, 1).newSetColumn(requested.FirstColumn + 2));

            gameInsert.setFeedersFromSources(
                source1,
                source2,
                outgoing,
                requested.FirstColumn,
                fSwapTopBottom);

            gameInsert.m_swapTopBottom = fSwapTopBottom;

            if (!this.isValidGridGameInsert(gameInsert))
                return gameInsert;

            return gameInsert;
        }

        if (outgoing.FirstRow < anchor.FirstRow)
        {
            // we are growing up. have to swap
            const temp = source1;
            source1 = source2;
            source2 = temp;
            fSwapTopBottom = !fSwapTopBottom;
            gameInsert.m_rangeGame =
                this.adjustRangeForGridAlignment(
                    RangeInfo.createFromCorners(
                        anchor.offset(
                            -(anchor.FirstRow - outgoing.FirstRow) - 1 - 1,
                            1,
                            0,
                            1).newSetColumn(requested.FirstColumn),
                        anchor.offset(1, 1, 2, 1).newSetColumn(requested.FirstColumn + 2)),
                    AdjustRangeGrowExtraRow.Up);

            gameInsert.setFeedersFromSources(
                source1,
                source2,
                outgoing,
                requested.FirstColumn,
                fSwapTopBottom);

            if (!this.isValidGridGameInsert(gameInsert))
                return gameInsert;

            gameInsert.m_swapTopBottom = fSwapTopBottom;
            return gameInsert;
        }

        // growing down
        gameInsert.m_rangeGame =
            RangeInfo.createFromCorners(
                anchor.offset(-1, 1, 0, 1).newSetColumn(requested.FirstColumn),
                anchor.offset(
                    (outgoing.FirstRow - anchor.FirstRow) * 2 + 3,
                    1,
                    0,
                    1).newSetColumn(requested.FirstColumn + 2));

        gameInsert.setFeedersFromSources(
            source1,
            source2,
            outgoing,
            requested.FirstColumn,
            fSwapTopBottom);

        if (!this.isValidGridGameInsert(gameInsert))
            return gameInsert;

        gameInsert.m_swapTopBottom = fSwapTopBottom;
        return gameInsert;
    }

    /*----------------------------------------------------------------------------
        %%Function: Grid.extendUnconnectedOutgoingFeeders

        For any unconnected outgoing feeder in a game, extend it with a line at
        least 3 games wide to anticipate overlapping collisions

        nrmal operation here is to do all of this in a clone so we don't have
        to worry about cleaning these up.

        don't do this for any of the ranges in excludes (these are probably
        the very game lines we're trying to insert!)
    ----------------------------------------------------------------------------*/
    extendUnconnectedOutgoingFeeders(excludes: RangeInfo[])
    {
        this.enumerateMatching(
            (item: GridItem) =>
            {
                const outgoingCheck = item.OutgoingFeederPoint.offset(0, 1, 1, 1);
                let excludeThisItem = false;

                for (let exclude of excludes)
                {
                    if (RangeInfo.isOverlappingRows(exclude, item.OutgoingFeederPoint))
                        {
                        excludeThisItem = true;
                        break;
                    }
                }

                if (!excludeThisItem
                    && this.doesRangeOverlap(outgoingCheck) == RangeOverlapKind.None)
                {
                    // there is nothing next to the outgoing feeder point. add an item
                    const newItem = this.addLineRange(outgoingCheck.offset(0, 1, 0, 9));
                    newItem.IsEphemeral = true;
                }

                return true;
            },
            (item: GridItem) => !item.isLineRange && !item.IsChampionshipGame);
    }

    /*----------------------------------------------------------------------------
        %%Function: Grid.isValidGridGameInsert

        if any of the ranges overlap things already in the grid, then
        fill in the reason why this game can't be inserted and return false
    ----------------------------------------------------------------------------*/
    isValidGridGameInsert(gameInsert: GridGameInsert): boolean
    {
        const extendedOutgoing = this.clone();

        // use the actual range for the exclusion rows -- it doesn't matter if we aren't going to have
        // a feeder line, we still want to inhibit the feeder line from being extended
        extendedOutgoing.extendUnconnectedOutgoingFeeders(
            [gameInsert.Range.topLeft().offset(1, 1, 0, 1), gameInsert.Range.bottomLeft().offset(-1, 1, 0, 1)]);

        if (gameInsert.m_rangeFeederTop != null
            && extendedOutgoing.doesRangeOverlap(gameInsert.m_rangeFeederTop) != RangeOverlapKind.None)
        {
            const [item, kind] = extendedOutgoing.getFirstOverlappingItem(gameInsert.m_rangeFeederTop);

            if (s_staticConfig.debuggingInfo)
            {
                gameInsert.m_failReason = `rangeFeederTop (${gameInsert.m_rangeFeederTop.toString()}) overlaps ${item.toString()}`;
            }
            else
            {
                const [item, kind] = extendedOutgoing.getFirstOverlappingItem(gameInsert.m_rangeFeederTop);

                if (item.IsEphemeral)
                    gameInsert.m_failReason = `Can't insert game here. The line connecting the top would overlap the result of an existing game at ${item.Range.toFriendlyString()}`;
                else
                    gameInsert.m_failReason = `Can't insert game here. The line connecting the top would overlap another already on the bracket at ${item.Range.toFriendlyString()}`;
            }

            return false;
        }

        if (gameInsert.m_rangeFeederBottom != null
            && extendedOutgoing.doesRangeOverlap(gameInsert.m_rangeFeederBottom) != RangeOverlapKind.None)
        {
            if (s_staticConfig.debuggingInfo)
            {
                const [item, kind] = extendedOutgoing.getFirstOverlappingItem(gameInsert.m_rangeFeederBottom);

                gameInsert.m_failReason = `rangeFeederTop (${gameInsert.m_rangeFeederBottom.toString()}) overlaps ${item.toString()}`;
            }
            else
            {
                const [item, kind] = extendedOutgoing.getFirstOverlappingItem(gameInsert.m_rangeFeederBottom);

                if (item.IsEphemeral)
                    gameInsert.m_failReason = `Can't insert game here. The line connecting the bottom would overlap the result of an existing game on the bracket at ${item.Range.toFriendlyString()}`;
                else
                    gameInsert.m_failReason = `Can't insert game here. The line connecting the bottom would overlap another already on the bracket at ${item.Range.toFriendlyString()}`;
            }
            return false;
        }

        if (gameInsert.m_rangeWinnerFeeder != null
            && extendedOutgoing.doesRangeOverlap(gameInsert.m_rangeWinnerFeeder) != RangeOverlapKind.None)
        {
            if (s_staticConfig.debuggingInfo)
            {
                const [item, kind] = extendedOutgoing.getFirstOverlappingItem(gameInsert.m_rangeWinnerFeeder);

                gameInsert.m_failReason = `m_rangeWinnerFeeder (${gameInsert.m_rangeWinnerFeeder.toString()}) overlaps ${item.toString()}`;
            }
            else
            {
                const [item, kind] = extendedOutgoing.getFirstOverlappingItem(gameInsert.m_rangeWinnerFeeder);

                if (item.IsEphemeral)
                    gameInsert.m_failReason = `Can't insert game here. The line connecting the winner would overlap the result of an existing game on the bracket at ${item.Range.toFriendlyString()}`;
                else
                    gameInsert.m_failReason = `Can't insert game here. The line connecting the winner would overlap another already on the bracket at ${item.Range.toFriendlyString()}`;
            }

            return false;
        }

        if (gameInsert.m_rangeGame != null
            && extendedOutgoing.doesRangeOverlap(gameInsert.m_rangeGame) != RangeOverlapKind.None)
        {
            if (s_staticConfig.debuggingInfo)
            {
                const [item, kind] = extendedOutgoing.getFirstOverlappingItem(gameInsert.m_rangeGame);

                gameInsert.m_failReason = `m_rangeGame (${gameInsert.m_rangeGame.toString()}) overlaps ${item.toString()}`;
            }
            else
            {
                const [item, kind] = extendedOutgoing.getFirstOverlappingItem(gameInsert.m_rangeGame);

                if (item.IsEphemeral)
                    gameInsert.m_failReason = `Can't insert game here. The game would overlap the result of an existing game already on the bracket at ${item.Range.toFriendlyString()}`;
                else
                    gameInsert.m_failReason = `Can't insert game here. The game would overlap an item already on the bracket at ${item.Range.toFriendlyString()}`;
            }

            return false;
        }

        // don't do this any more -- we have the extended lines above that will catch these overlaps

        // TEST THIS

//        let source1: RangeInfo = gameInsert.m_rangeFeederTop;
//        let source2: RangeInfo = gameInsert.m_rangeFeederBottom;
//
//        if (!source1 || source1 == null)
//        {
//            // for this comparison, we have to have a source, even if there's no feeder line
//            source1 = gameInsert.m_rangeGame.offset(1, 1, 0, 1);
//        }
//
//        if (!source2 || source2 == null)
//        {
//            source2 = gameInsert.m_rangeGame.bottomLeft().offset(-1, 1, 0, 1);
//        }
//
//        const { overlaps, firstOverlapItem } =
//            extendedOutgoing.doesSourceOverlapAreaRangeOverlap(
//                source1,
//                source2,
//                gameInsert.m_rangeGame.FirstColumn);
//
//        if (overlaps)
//        {
//            if (firstOverlapItem.IsEphemeral)
//                gameInsert.m_failReason = `Can't insert game here. The game would overlap the result of an existing game already on the bracket at ${firstOverlapItem.Range.toFriendlyString()}`;
//            else
//                gameInsert.m_failReason = `Can't insert game here. The game would overlap an existing item already on the bracket at ${firstOverlapItem.Range.toFriendlyString()}`;
//
//            return false;
//        }

        return true;
    }

    excludeConnectedGameItemFromOverlapCheck(topSource: RangeInfo, bottomSource: RangeInfo, overlapRegion: RangeInfo, stopColumn: number, depth: number)
    {
        if (depth > 10)
            return;

        if (topSource != null)
        {
            const [gameItem, kind] = this.getFirstOverlappingItem(topSource.offset(0, 1, -1, 1));

            if (gameItem != null)
            {
                if (gameItem.Range.LastColumn > stopColumn)
                {
                    overlapRegion.excludeRangeByRows(gameItem.Range);

                    const connectedItem: GridItem = this.getGridItemConnectedToFeederRange(gameItem.BottomTeamRange.offset(-1, 1, 0, 1));
                    if (connectedItem != null)
                        overlapRegion.excludeRangeByRows(connectedItem.Range);

                    this.excludeConnectedGameItemFromOverlapCheck(
                        gameItem.TopTeamRange?.offset(0, 1, 0, 1),
                        gameItem.BottomTeamRange?.offset(0, 1, 0, 1),
                        overlapRegion,
                        Math.min(topSource.FirstColumn, bottomSource?.FirstColumn ?? Number.MAX_VALUE),
                        depth + 1);
                }
            }
        }

        if (bottomSource != null)
        {
            const [gameItem, kind] = this.getFirstOverlappingItem(bottomSource.offset(0, 1, -1, 1));

            if (gameItem != null)
            {
                if (gameItem.Range.LastColumn > stopColumn)
                {
                    overlapRegion.excludeRangeByRows(gameItem.Range);
                    const connectedItem: GridItem = this.getGridItemConnectedToFeederRange(gameItem.TopTeamRange.offset(1, 1, 0, 1));
                    if (connectedItem != null)
                        overlapRegion.excludeRangeByRows(connectedItem.Range);

                    this.excludeConnectedGameItemFromOverlapCheck(
                        gameItem.TopTeamRange?.offset(0, 1, 0, 1),
                        gameItem.BottomTeamRange?.offset(0, 1, 0, 1),
                        overlapRegion,
                        Math.min(topSource?.FirstColumn ?? Number.MAX_VALUE, bottomSource.FirstColumn),
                        depth + 1);
                }
            }
        }
    }

    doesSourceOverlapAreaRangeOverlap(
        source1: RangeInfo,
        source2: RangeInfo,
        targetColumn: number): {  overlaps: boolean, firstOverlapItem?: GridItem}
    {
        let f: boolean = false;

        [source1, source2, f] = Grid.normalizeSources(source1, source2, f);

//        if (source1 == null || source2 == null)
//            return false;

        let overlapRegion: RangeInfo;

        const minColumn: number = Math.min(
            source1 != null ? source1.FirstColumn : targetColumn,
            source2 != null ? source2.FirstColumn : targetColumn);

        if (source1 == null || source2 == null)
        {
            // assume we're going to grow down
            overlapRegion = RangeInfo.createFromCorners(
                source1.offset(-1, 1, 0, 1).newSetColumn(minColumn),
                source1.offset(11 - 2, 1, 0, 1).newSetColumn(targetColumn + 2));
        }
        else
        {
            overlapRegion = RangeInfo.createFromCorners(
                source1.offset(-1, 1, 0, 1).newSetColumn(minColumn),
                source2.offset(1, 0, 0, 1).newSetColumn(targetColumn + 2));
        }

        this.excludeConnectedGameItemFromOverlapCheck(source1, source2, overlapRegion, 1, 1);

//        if (source1 != null)
//        {
//            const [gameItem, kind] = this.getFirstOverlappingItem(source1.offset(0, 1, -1, 1));
//
//            if (gameItem != null)
//            {
//                overlapRegion.excludeRangeByRows(gameItem.Range);
//                const connectedItem: GridItem = this.getGridItemConnectedToFeederRange(gameItem.BottomTeamRange.offset(-1, 1, 0, 1));
//                if (connectedItem != null)
//                    overlapRegion.excludeRangeByRows(connectedItem.Range);
//            }
//        }
//
//        if (source2 != null)
//        {
//            const [gameItem, kind] = this.getFirstOverlappingItem(source2.offset(0, 1, -1, 1));
//
//            if (gameItem != null)
//            {
//                overlapRegion.excludeRangeByRows(gameItem.Range);
//                const connectedItem: GridItem = this.getGridItemConnectedToFeederRange(gameItem.TopTeamRange.offset(1, 1, 0, 1));
//                if (connectedItem != null)
//                    overlapRegion.excludeRangeByRows(connectedItem.Range);
//            }
//        }

        const [item, kind] = this.getFirstOverlappingItem(overlapRegion);

        if (kind != RangeOverlapKind.None)
        {
            return { overlaps: true, firstOverlapItem: item };
        }

        return { overlaps: false };
    }

    /*----------------------------------------------------------------------------
        %%Function: Grid.doesSourceOverlapRangeOverlap

        we have two choices when it comes to overlap checking. one is strict
        overlap checking, which asks if any line crosses our regions.

        the other also checks area overlapping -- does the area created by the
        source ranges overlap. this may not strictly overlap, but we still want
        to flag it. ask for this using enforceAreaOverlap
    ----------------------------------------------------------------------------*/
    doesSourceOverlapRangeOverlap(
        source1: RangeInfo,
        source2: RangeInfo,
        targetColumn: number,
        enforceAreaOverlap: boolean): boolean
    {
        let f: boolean = false;

        [source1, source2, f] = Grid.normalizeSources(source1, source2, f);

        if (source1 == null || source2 == null)
            return false;

        let overlapRegion: RangeInfo;

        if (enforceAreaOverlap)
        {
            const minColumn: number = Math.min(
                source1 != null ? source1.FirstColumn : targetColumn,
                source2 != null ? source2.FirstColumn : targetColumn);

            if (source1 == null || source2 == null)
            {
                // assume we're going to grow down
                overlapRegion = RangeInfo.createFromCorners(
                    source1.offset(-1, 1, 0, 1).newSetColumn(minColumn),
                    source1.offset(11 - 2, 1, 0, 1).newSetColumn(targetColumn + 2));
            }
            else
            {
                overlapRegion = RangeInfo.createFromCorners(
                    source1.offset(-1, 1, 0, 1).newSetColumn(minColumn),
                    source2.offset(1, 0, 0, 1).newSetColumn(targetColumn + 2));
            }
        }
        else
        {
            const maxColumn: number = Math.max(
                source1 != null ? source1.FirstColumn : targetColumn,
                source2 != null ? source2.FirstColumn : targetColumn);

            if (source1 == null || source2 == null)
            {
                // assume we're going to grow down
                overlapRegion = RangeInfo.createFromCorners(
                    source1.offset(-1, 1, 0, 1).newSetColumn(maxColumn),
                    source1.offset(11 - 2, 1, 0, 1).newSetColumn(targetColumn + 2));
            }
            else
            {
                overlapRegion = RangeInfo.createFromCorners(
                    source1.offset(-1, 1, 0, 1).newSetColumn(maxColumn),
                    source2.offset(1, 0, 0, 1).newSetColumn(targetColumn + 2));
            }
        }
        if (this.doesRangeOverlap(overlapRegion) != RangeOverlapKind.None)
        {
            return true;
        }
        return false;
    }

    getPrintArea(blankRowsAtBottom: number): RangeInfo
    {
        let printArea: RangeInfo = this.FirstGridPattern.offset(0, 1, 0, 1);

        this.enumerate(
            (item: GridItem) =>
            {
                if (item.Range.LastColumn > printArea.LastColumn)
                    printArea.setLastColumn(item.Range.LastColumn);

                if (item.Range.LastRow > printArea.LastRow)
                    printArea.setLastRow(item.Range.LastRow);

                return true;
            });

        if (blankRowsAtBottom > 0)
            printArea.setLastRow(printArea.LastRow + blankRowsAtBottom);

        return printArea;
    }

    getFirstItemInColumn(column: number): GridItem
    {
        let minRow = this.m_firstGridPattern.FirstRow;
        let minItem: GridItem = null;

        for (let item of this.m_gridItems)
        {
            if (RangeInfo.isOverlappingSegment(item.Range.FirstColumn, item.Range.LastColumn, column, column))
            {
                if (item.Range.FirstRow < minRow)
                {
                    minRow = item.Range.FirstRow;
                    minItem = item;
                }
            }
        }

        return minItem;
    }

    getLastItemInColumn(column: number): GridItem
    {
        let maxRow = this.m_firstGridPattern.FirstRow;
        let maxItem: GridItem = null;

        for (let item of this.m_gridItems)
        {
            if (RangeInfo.isOverlappingSegment(item.Range.FirstColumn, item.Range.LastColumn, column, column))
            {
                if (item.Range.LastRow > maxRow)
                {
                    maxRow = item.Range.LastRow;
                    maxItem = item;
                }
            }
        }

        return maxItem;
    }

    /*----------------------------------------------------------------------------
        %%Function: Grid.getFirstEmptyRowToUse

        return the first non-empty row in the column that we can use for this
        game, allowing for the given padding.

        make sure we return a content line and not a border line (which can
        happen if the thing we are avoiding is a connecting line and not a
        game content item)
    ----------------------------------------------------------------------------*/
    getFirstEmptyRowToUse(firstColumn: number, lastColumn: number, padding): number
    {
        /*
        let rowSegments: number[][] = [];

        // build an array of used regions
        for (let item of this.m_gridItems)
        {
            if (RangeInfo.isOverlappingSegment(item.Range.FirstColumn, item.Range.LastColumn, column, column))
            {
                rowSegments.push([item.Range.FirstRow, item.Range.LastRow]);
            }
        }

        // now sort the array
        rowSegments = rowSegments.sort(
            (left, right) => left[0] - right[0]);
            */

        let maxRow = this.m_firstGridPattern.FirstRow;

        for (let item of this.m_gridItems)
        {
            if (RangeInfo.isOverlappingSegment(item.Range.FirstColumn, item.Range.LastColumn, firstColumn, lastColumn))
            {
                maxRow = Math.max(maxRow, item.Range.LastRow + padding);
            }
        }

        maxRow = maxRow + ((maxRow - this.FirstGridPattern.FirstRow) % 2);
        return maxRow;
    }

    static normalizeSources(source1: RangeInfo, source2: RangeInfo, fSwapTopBottom: boolean): [RangeInfo, RangeInfo, boolean]
    {
        if (source1 == null || source2 == null)
            return [source1, source2, fSwapTopBottom];

        if (source1.FirstRow > source2.FirstRow)
        {
            return [source2, source1, !fSwapTopBottom];
        }

        return [source1, source2, fSwapTopBottom];
    }


    /*----------------------------------------------------------------------------
        %%Function: Grid.gridGameFromConstraints

        Given a set of constraints (feeder lines in, and feeder line out, and the
        column the game should go in), figure out where to place the game.

        If a large enough non-overlapping range is provided for the game, that
        will be given priority, even if the feeder lines would overlap.
    ----------------------------------------------------------------------------*/
    gridGameFromConstraints(
        game: IBracketGame,
        requested: RangeInfo): GridGameInsert
    {
        let [source1, source2, outgoing] = this.getRangeInfoForGameFeederItemConnectionPoints(game);

        let fSwapTopBottom: boolean = game.SwapTopBottom;

        // normalize the sources
        if (source1 != null && source2 != null)
        {
            [source1, source2, fSwapTopBottom] = Grid.normalizeSources(source1, source2, fSwapTopBottom);
        }

        // first, see if we have a requested range and if it is good
        if (requested.RowCount > 8)
        {
            return this.buildGridGameForSpecificRequestedRange(
                source1,
                source2,
                outgoing,
                requested,
                fSwapTopBottom);
        }

        // normalize source1/source2
        if (source1 != null && source2 != null && source1.FirstRow > source2.FirstRow)
        {
            [source1, source2, fSwapTopBottom] = Grid.normalizeSources(source1, source2, fSwapTopBottom);
        }

        // ok, we don't have a big enough selection. reduce to a single point which we will consider the "top request"
        requested = requested.offset(0, 1, 0, 1); // no offset, just collapse the row and cell counts

        let matched: RangeInfo;
        let other: RangeInfo;

        // see if one of the sources matches our request
        if ((source1 != null && source1.fuzzyMatchRow(requested.FirstRow, 3))
            || (source2 != null && (source2.fuzzyMatchRow(requested.FirstRow, 3))))
        {
            if (source1 != null && source1.fuzzyMatchRow(requested.FirstRow, 3))
            {
                matched = source1;
                other = source2;
            }
            else
            {
                matched = source2;
                other = source1;
                const temp = source1;
                source1 = source2;
                source2 = temp;
                fSwapTopBottom = !fSwapTopBottom;
            }
            requested.setRow(matched.FirstRow - 1);

            if (source1 && source2 && source1.FirstRow > source2.FirstRow)
                return GridGameInsert.createFailedGame("Can't insert the game as requested -- the top game would be below the bottom game");

            // now grow to including outgoing
            if (outgoing != null)
            {
                if (game.IsChampionship)
                    return GridGameInsert.createFailedGame("championship game can't have outgoing feed");

                return this.buildGridGameForOneAnchoredSourceWithOutgoingPresent(
                    source1,
                    source2,
                    outgoing,
                    matched,
                    other,
                    requested,
                    fSwapTopBottom);
            }

            return this.buildGridGameForAnchoredSourceNoOutgoingPresent(
                source1,
                source2,
                matched,
                other,
                requested,
                game.IsChampionship,
                fSwapTopBottom);
        }

        // ok, our requested range has no relationship to either sources. now figure out
        // the placement given just the matches we know about

        // if we have both sources, then we either work or not
        if (source1 != null && source2 != null)
        {
            if (game.IsChampionship)
                return GridGameInsert.createFailedGame("championship game can't have 2 sources");

            return this.buildGridGameFor2Feeders(
                source1,
                source2,
                outgoing,
                requested,
                fSwapTopBottom);
        }

        if (source1 != null || source2 != null)
        {
            if (source1 != null)
            {
                matched = source1;
                other = source2;
            }
            else
            {
                matched = source2;
                other = source1;
                const temp = source1;
                source1 = source2;
                source2 = temp;
                fSwapTopBottom = !fSwapTopBottom;
            }
            requested.setRow(matched.FirstRow - 1);

            if (source1 && source2 && source1.FirstRow > source2.FirstRow)
                return GridGameInsert.createFailedGame("Can't insert the game as requested -- the top game would be below the bottom game");

            // now grow to including outgoing
            if (outgoing != null)
            {
                if (game.IsChampionship)
                    return GridGameInsert.createFailedGame("championship game can't have outgoing feed");

                return this.buildGridGameForOneAnchoredSourceWithOutgoingPresent(
                    source1,
                    source2,
                    outgoing,
                    matched,
                    other,
                    requested,
                    fSwapTopBottom);
            }

            return this.buildGridGameForAnchoredSourceNoOutgoingPresent(
                source1,
                source2,
                matched,
                other,
                requested,
                game.IsChampionship,
                fSwapTopBottom);
        }

        // and lastly, what to do if there are no sources at all...just find the first non-conflicting
        // place to put it
        if (requested.FirstColumn == this.m_firstGridPattern.FirstColumn)
        {
            requested.setRow(this.getFirstEmptyRowToUse(requested.FirstColumn, requested.FirstColumn, 4));
        }
        else
        {
            requested.setRow(
                Math.max(
                    this.getFirstEmptyRowToUse(requested.FirstColumn - 1, requested.FirstColumn - 1, 2),
                    this.getFirstEmptyRowToUse(requested.FirstColumn, requested.FirstColumn, 4)));
        }

        let gameInsert: GridGameInsert = new GridGameInsert();

        gameInsert.m_rangeGame =
            RangeInfo.createFromCorners(
                requested.offset(0, 1, 0, 1).newSetColumn(requested.FirstColumn),
                requested.offset(
                    game.IsChampionship ? 2 : 10,
                    1,
                    0,
                    1).newSetColumn(requested.FirstColumn + 2));

        gameInsert.m_isChampionshipGame = game.IsChampionship;

        gameInsert.setFeedersFromSources(
            source1,
            source2,
            outgoing,
            requested.FirstColumn,
            fSwapTopBottom);

        if (!this.isValidGridGameInsert(gameInsert))
            return gameInsert;

        gameInsert.m_swapTopBottom = fSwapTopBottom;
        return gameInsert;
    }

    /*----------------------------------------------------------------------------
        %%Function: Grid.getGridItemConnectedToFeederRange

        return the grid item that connects to this feeder range. if that's a game,
        also make sure it lines up with the outgoing item location on the game

        NOTE: If you give the outgoing result range it will return the source
        game, not the target game.
    ----------------------------------------------------------------------------*/
    getGridItemConnectedToFeederRange(range: RangeInfo): GridItem
    {
        const [item, kind] = this.getFirstOverlappingItem(range);

        if (item != null && kind == RangeOverlapKind.Equal)
            return item;

        if (kind == RangeOverlapKind.Partial && range.ColumnCount == 0 && !item.isLineRange)
        {
            // this means that the feeder line we calculated was 0 width,
            // so the source game is immediately adjacent.

            if (item.OutgoingFeederPoint.offset(0, 1, -1, 0).isEqual(range))
                return item;
        }

        return null;
    }

    /*----------------------------------------------------------------------------
        %%Function: Grid.getGridItemConnectedToFeederRange

        return the grid item that connects to this feeder range. if that's a game,
        also make sure it lines up with the outgoing item location on the game

        NOTE: If you give the outgoing result range it will return the source
        game, not the target game.
    ----------------------------------------------------------------------------*/
    getGridItemConnectedToOutgoingRange(range: RangeInfo): GridItem
    {
        const [item, kind] = this.getFirstOverlappingItemNotBackwards(range);

        if (item != null && kind == RangeOverlapKind.Equal)
            return item;

        if (kind == RangeOverlapKind.Partial && range.ColumnCount == 0 && !item.isLineRange)
        {
            // this means that the feeder line we calculated was 0 width,
            // so the source game is immediately adjacent.
            return item;
//            if (item.OutgoingFeederPoint.offset(0, 1, -1, 0).isEqual(range))
//                return item;
        }

        return null;
    }

    /*----------------------------------------------------------------------------
        %%Function: Grid.getConnectedGridItemsForGameFeeders

        This will get the actual grid items for the feeder items for this game
        (if the items aren't on the grid, then null will be returned for it)

        if this game is immediately adjacent to its feeder game and the outgoing
        point of the source game matches our incoming feeder, then return that
        game item

        NOTE: This is subtlely different than Grid.GetAllGameLines. This will
        return the connected game if the game is immediately adjacent to our
        feeder connection point. GetAllGameLines will only return the actual
        lines, which means you might get null even if you are connected but
        adjacent

        This function is tolerant of SwapTopBottom being set on BOTH gridGame
        AND game, or only on either.
    ----------------------------------------------------------------------------*/
    getConnectedGridItemsForGameFeeders(gridGame: GridItem, game: IBracketGame): [GridItem, GridItem]
    {
        let [source1, source2, outgoing] = this.getRangeInfoForGameFeederItemConnectionPoints(game);
        let fSwap: boolean = false;

        if (source1 != null && source1.FirstColumn > gridGame.Range.FirstColumn)
            source1 = null;

        if (source2 != null && source2.FirstColumn > gridGame.Range.FirstColumn)
            source2 = null;

        // if the GridItem AND the game both say they are swapped, then we have already accounted 
        // for the swap. otherwise, make sure to obey what the game item has

        // (REVIEW: Maybe we want gridGame.SwapTopBottom != game.SwapTopBottom)
        if (gridGame.SwapTopBottom && game.SwapTopBottom != true)
        {
            const t = source1;
            source1 = source2;
            source2 = t;
        }

        let overlapRange1: RangeInfo = null;

        if (source1 != null)
        {
            if (source1.FirstRow <= gridGame.TopTeamRange.FirstRow + 1)
            {
                if (source1.FirstColumn == gridGame.TopTeamRange.FirstColumn)
                    overlapRange1 = new RangeInfo(source1.FirstRow, (gridGame.TopTeamRange.FirstRow + 1) - source1.FirstRow + 1, source1.FirstColumn - 1, 0);
                else
                    overlapRange1 = RangeInfo.createFromCorners(source1, gridGame.TopTeamRange.offset(1, 1, -1, 1));
            }
        }

        // now we know where they are supposed to be going...
        const item1: GridItem =
            source1 != null
                ? this.getGridItemConnectedToFeederRange(overlapRange1)
                : null;

        let overlapRange2: RangeInfo = null;

        if (source2 != null)
        {
            if (source2.FirstRow < gridGame.BottomTeamRange.FirstRow)
            {
                if (source2.FirstColumn == gridGame.BottomTeamRange.FirstColumn)
                    overlapRange2 = new RangeInfo(source2.FirstRow, (gridGame.BottomTeamRange.FirstRow - 1) - source2.FirstRow + 1, source2.FirstColumn - 1, 0);
                else
                    overlapRange2 = RangeInfo.createFromCorners(source2, gridGame.BottomTeamRange.offset(-1, 1, -1, 1));
            }
        }

        const item2: GridItem =
            source2 != null
                ? this.getGridItemConnectedToFeederRange(overlapRange2)
                : null;

        return [item1, item2];
    }


    /*----------------------------------------------------------------------------
        %%Function: Grid.getConnectedGridItemForGameResult

        return the gridItem for the result of the given gridGame
    ----------------------------------------------------------------------------*/
    getConnectedGridItemForGameResult(game: IBracketGame): GridItem
    {
        let [source1, source2, outgoing] = this.getRangeInfoForGameFeederItemConnectionPoints(game);
        let fSwap: boolean = false;

        let overlapRange1: RangeInfo;

        if (outgoing != null)
        {
            // getRangeInfo above returns the connection point *outside* the item, so we have
            // to move 1 column over to make sure we get the actual item
            overlapRange1 = new RangeInfo(outgoing.FirstRow, 1, outgoing.FirstColumn + 1, 0);
        }

        // now we know where they are supposed to be going...
        const item1: GridItem =
            overlapRange1 != null
                ? this.getGridItemConnectedToOutgoingRange(overlapRange1)
                : null;

        return item1;
    }


    /*----------------------------------------------------------------------------
        %%Function: Grid.getRangeInfoForGameFeederItemConnectionPoints

        this function finds the various connected items (the source game items,
        if there are any, and the target game item if we have one), then returns
        the connection point for each of those game items.

        these points tell you one end of the feeder line, or if adjacent, the
        connection point of the adjacent game item.

        THIS FUNCTION ASSUMES THAT game.SwapTopBottom is properly set!!
    ----------------------------------------------------------------------------*/
    getRangeInfoForGameFeederItemConnectionPoints(
        game: IBracketGame): [RangeInfo, RangeInfo, RangeInfo]
    {
        let source1: RangeInfo = null;
        let source2: RangeInfo = null;
        let outgoing: RangeInfo = null;

        // figure out all the connecting info for the game
        let gameId: GameId = FormulaBuilder.getSourceGameIdIfWinner(game.TopTeamName);

        if (gameId != null)
            source1 = this.getOutgoingConnectionForGameResult(gameId);

        outgoing = this.getTargetGameFeedForGameResult(game);

        // figure out all the connecting info for the game
        gameId = FormulaBuilder.getSourceGameIdIfWinner(game.BottomTeamName);

        if (gameId != null)
            source2 = this.getOutgoingConnectionForGameResult(gameId);

        return [source1, source2, outgoing];
    }

    /*----------------------------------------------------------------------------
        %%Function: Grid.buildNewGridForGameAdd

        figure out the correct insert location for the given game.

        must provide a column for the game to be inserted into
    ----------------------------------------------------------------------------*/
    buildNewGridForGameAdd(game: IBracketGame, requested: RangeInfo): [Grid, string]
    {
        let gridNew: Grid = this.clone();
        let gameInsert: GridGameInsert;

        // before we do any clever readjustments of the grid for common conflicts,
        // first see if they are requesting a speciric range for insertion. if they
        // are, then we don't want to try to second guess them...

        if (requested.RowCount <= 8)
        {
            // first, try to do some adjustments...
            GridAdjust.rearrangeGridForCommonConflicts(gridNew, game, requested.FirstColumn);
        }

        let fAdjusted: boolean;
        let cAdjusted = 0;

        do
        {
            gameInsert = gridNew.gridGameFromConstraints(game, requested);
            if (!gameInsert.Range)
                break;

            fAdjusted = GridAdjust.rearrangeGridForCommonAdjustments(gridNew, gameInsert, [requested]);
        } while (fAdjusted && cAdjusted++ < 10);


        if (gameInsert.m_failReason != null)
        {
            return [null, gameInsert.m_failReason];
        }

        if (gameInsert.m_rangeFeederTop != null)
            gridNew.addLineRange(gameInsert.m_rangeFeederTop);
        if (gameInsert.m_rangeFeederBottom != null)
            gridNew.addLineRange(gameInsert.m_rangeFeederBottom);
        if (gameInsert.m_rangeWinnerFeeder != null)
            gridNew.addLineRange(gameInsert.m_rangeWinnerFeeder);

        // this IBracketGame probably won't get anywhere right now, so setting the top/bottom
        // is probably pointless.  the addGameRange below will capture the swap.
        // FUTURE: When we implement persistent game data (like team names, game times, etc),
        // we *could* persist the swap data at this point, and when they build the game for insert
        // we *could* try to read the swap data during that load.  but that might be overkill
        // it might be better to just let the game insert handle the swap setting
        game.SetSwapTopBottom(gameInsert.m_swapTopBottom);
        let newItem: GridItem = gridNew.addGameRange(gameInsert.m_rangeGame, game.GameId, gameInsert.m_swapTopBottom);

        newItem.inferGameInternals();
        newItem.setStartTime(game.StartTime);
        newItem.setField(game.Field);

        return [gridNew, null];
    }

    logGridCondensedString(): string
    {
        let s: string = "";

        for (let item of this.m_gridItems)
        {
            s += `${item.GameId == null ? -1 : item.GameId.Value}:${item.SwapTopBottom ? "S" : ""} ${item.Range.toString()}(${item.m_topPriority},${item.m_bottomPriority},${item.GamePriority})`;
        }

        return s;
    }

    logGridCondensed()
    {
        console.log(this.logGridCondensedString());
    }

    logGrid()
    {
        if (!this.m_fLogGrid)
            return;

        console.log(`first repeating: ${this.m_firstGridPattern.toString()}`);

        for (let item of this.m_gridItems)
        {
            console.log(`${item.GameId == null ? -1 : item.GameId.Value }:${item.SwapTopBottom ? "S" : ""} ${item.Range.toString()}(${item.m_topPriority},${item.m_bottomPriority},${item.GamePriority})`);
        }
    }

    logChangesToString(changes: GridChange[])
    {
        let s: string = "";

        for (let item of changes)
            s += `${item.toString()}\n`;

        return s;
    }

    logChanges(changes: GridChange[])
    {
        if (!this.m_fLogChanges)
            return;

        console.log(this.logChangesToString(changes));
    }


    /*----------------------------------------------------------------------------
        %%Function: Grid.getRangeInfoForGameInfo

        given the full range for a game (including the top and bottom title lines),
        return the range for the game info.
    ----------------------------------------------------------------------------*/
    static getRangeInfoForGameInfo(gameRange: RangeInfo): RangeInfo
    {
        if (gameRange.RowCount < 9) 
            throw new Error("bad rangeInfo param");

        const infoRowCount = gameRange.RowCount - 4; // remove top and bottom game titles\
        const offsetToFirstGameInfo = Math.floor((infoRowCount - 5) / 2);

        // now, we have to make sure it starts on full height line, distributing
        // error to the top (by rounding up to nearest even number)
        const rounded = offsetToFirstGameInfo + (offsetToFirstGameInfo % 2);

        return new RangeInfo(
            gameRange.FirstRow + 2 + rounded,
            5,
            gameRange.FirstColumn, 
            gameRange.ColumnCount);
    }

    static getGameInfoHeightFromOffsetToGameInfo(offsetToInfo: number): number
    {
        return offsetToInfo * 2 + 5;
    }

    adjustSelectionForGameInsertOrMove(selected: RangeInfo)
    {
        if (selected.FirstRow < this.m_firstGridPattern.FirstRow
            || selected.FirstColumn < this.m_firstGridPattern.FirstColumn)
        {
            throw new TrError([`The current selection is outside the current bracket grid. Please select a cell on the grid starting at ${this.m_firstGridPattern.toFriendlyString()}`]);
        }

        if (selected.RowCount == 1)
            selected.setLastRow(selected.FirstRow + 10);

        this.adjustRangeForGridAlignment(selected, AdjustRangeGrowExtraRow.None);
    }

}