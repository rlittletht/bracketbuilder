import { RangeInfo, RangeOverlapKind, Ranges } from "../Interop/Ranges";
import { BracketDefinition } from "../Brackets/BracketDefinitions";
import { BracketGame, IBracketGame } from "./BracketGame";
import { BracketStructureBuilder } from "../Brackets/BracketStructureBuilder";
import { StructureEditor } from "./StructureEditor";
import { GameLines } from "./GameLines";
import { GameFormatting } from "./GameFormatting";
import { GridGameInsert } from "./GridGameInsert";
import { FormulaBuilder } from "./FormulaBuilder";
import { GridItem } from "./GridItem";
import { GridChange, GridChangeOperation } from "./GridChange";
import { AppContext } from "../AppContext";

// We like to have an extra blank row at the top of the game body
// (because the "advance to" line is often blank at the bottom)
// Choose which way to grow the game range to accommodate that extra
// row
enum AdjustRangeGrowExtraRow
{
    None, // don't try to add an extra row
    Up,
    Down
}

export class Grid
{
    m_gridItems: GridItem[] = [];
    m_firstGridPattern: RangeInfo;

    addGameRange(range: RangeInfo, gameNum: number, swapTopBottom: boolean): GridItem
    {
        let item: GridItem = new GridItem(range, gameNum, false);
        item.m_swapTopBottom = swapTopBottom;
        this.m_gridItems.push(item);

        return item;
    }

    addLineRange(range: RangeInfo)
    {
        this.m_gridItems.push(new GridItem(range, -1, true));
    }

    getOverlappingItem(range: RangeInfo): [GridItem, RangeOverlapKind]
    {
        for (let item of this.m_gridItems)
        {
            const overlapKind: RangeOverlapKind = RangeInfo.isOverlapping(range, item.Range);

            if (overlapKind != RangeOverlapKind.None)
                return [item, overlapKind];
        }

        return [null, RangeOverlapKind.None];
    }


    doesRangeOverlap(range: RangeInfo): RangeOverlapKind
    {
        let item: GridItem;
        let kind: RangeOverlapKind;

        [item, kind] = this.getOverlappingItem(range);

        return kind;
    }

    /*----------------------------------------------------------------------------
        %%Function: Grid.diff
    ----------------------------------------------------------------------------*/
    diff(gridRight: Grid): GridChange[]
    {
        let changes: GridChange[] = [];

        // lets do this the horrible n^2 way first

        for (let itemLeft of this.m_gridItems)
        {
            let itemRight: GridItem;
            let kind: RangeOverlapKind;

            [itemRight, kind] = gridRight.getOverlappingItem(itemLeft.Range);

            if (kind != RangeOverlapKind.Equal
                || itemLeft.GameNum != itemRight.GameNum)
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

            [itemLeft, kind] = this.getOverlappingItem(itemRight.Range);

            if (kind != RangeOverlapKind.Equal
                || itemRight.GameNum != itemLeft.GameNum)

            {
                // any kind of difference means this is an add
                changes.push(new GridChange(GridChangeOperation.Insert, itemRight));
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
    findGameItem(gameNumber: number): GridItem
    {
        for (let item of this.m_gridItems)
        {
            if (item.GameNum == gameNumber)
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

        item = this.findContainingItem(gameItem.BottomTeamRange.offset(-1, 1, -1, 1));
        if (item != null && item.isLineRange)
            items.push(item);

        item = this.findContainingItem(gameItem.GameNumberRange.offset(1, 1, 2, 1));
        if (item != null && item.isLineRange)
            items.push(item);

        return items;
    }

    /*----------------------------------------------------------------------------
        %%Function: Grid.getAllGameItems

        return all of the items for this game -- game item and all in and out
        lines.

        the game item will be the first item in the array
    ----------------------------------------------------------------------------*/
    getAllGameItems(gameNumber: number): GridItem[]
    {
        let items: GridItem[] = [];

        let item = this.findGameItem(gameNumber);
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

    /*----------------------------------------------------------------------------
        %%Function: Grid.createGridFromBracket
    ----------------------------------------------------------------------------*/
    static async createGridFromBracket(ctx: any, bracketName: string): Promise<Grid>
    {
        let grid: Grid = new Grid();

        AppContext.checkpoint("cgfb.1");
        await grid.loadGridFromBracket(ctx, bracketName);
        return grid;
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
    async getFirstGridPatternCell(ctx: any): Promise<RangeInfo>
    {
        let range: RangeInfo = new RangeInfo(8, 1, 0, 1);
        let sheet: Excel.Worksheet = ctx.workbook.worksheets.getActiveWorksheet();
        ctx.trackedObjects.add(sheet);

        let matchedPatterns = 0;
        let firstMatchedRow = -1;

        while (range.FirstRow < 20 && matchedPatterns < 3)
        {
            if (await GameFormatting.isCellInLineRow(ctx, Ranges.rangeFromRangeInfo(sheet, range)))
            {
                firstMatchedRow = -1;
                matchedPatterns = 0;
                range = range.offset(1, 1, 0, 1);
                continue;
            }

            if (firstMatchedRow == -1)
                firstMatchedRow = range.FirstRow;

            range = range.offset(1, 1, 0, 1);
            if (!await GameFormatting.isCellInLineRow(ctx, Ranges.rangeFromRangeInfo(sheet, range)))
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
            ctx.trackedObjects.remove(sheet);
            return null;
        }

        matchedPatterns = 0;
        let firstMatchedColumn = -1;
        range = new RangeInfo(firstMatchedRow, 1, 6, 1);

        while (range.FirstColumn < 25 && matchedPatterns < 3)
        {
            if (!await GameFormatting.isCellInGameTitleColumn(ctx, Ranges.rangeFromRangeInfo(sheet, range)))
            {
                firstMatchedColumn = -1;
                matchedPatterns = 0;
                range = range.offset(0, 1, 1, 1);
                continue;
            }

            if (firstMatchedColumn == -1)
                firstMatchedColumn = range.FirstColumn;

            range = range.offset(0, 1, 1, 1);
            if (!await GameFormatting.isCellInGameScoreColumn(ctx, Ranges.rangeFromRangeInfo(sheet, range)))
            {
                firstMatchedColumn = -1;
                matchedPatterns = 0;
                range = range.offset(0, 1, 1, 1);
                continue;
            }

            range = range.offset(0, 1, 1, 1);
            if (!await GameFormatting.isCellInLineColumn(ctx, Ranges.rangeFromRangeInfo(sheet, range)))
            {
                firstMatchedColumn = -1;
                matchedPatterns = 0;
                range = range.offset(0, 1, 1, 1);
                continue;
            }
            range = range.offset(0, 1, 1, 1);
            matchedPatterns++;
        }

        ctx.trackedObjects.remove(sheet);
        if (matchedPatterns < 3)
            return null;

        return new RangeInfo(firstMatchedRow, 1, firstMatchedColumn, 1);
    }


    /*----------------------------------------------------------------------------
        %%Function: Grid.loadGridFromBracket
    ----------------------------------------------------------------------------*/
    async loadGridFromBracket(ctx: any, bracketName: string)
    {
        AppContext.checkpoint("lgfb.1");
        this.m_firstGridPattern = await this.getFirstGridPatternCell(ctx);

        // go through all the game definitions and try to add them to the grid
        let bracketDef: BracketDefinition = BracketStructureBuilder.getBracketDefinition(`${bracketName}Bracket`);

        AppContext.checkpoint("lgfb.2");
        for (let i: number = 0; i < bracketDef.games.length; i++)
        {
            let game: BracketGame = new BracketGame()
            let feederTop: RangeInfo = null;
            let feederBottom: RangeInfo = null;
            let feederWinner: RangeInfo = null;

            AppContext.checkpoint("lgfb.3");
            await game.Load(ctx, bracketName, i);
            AppContext.checkpoint("lgfb.4");
            if (game.IsLinkedToBracket)
            {
                let overlapKind: RangeOverlapKind = this.doesRangeOverlap(game.FullGameRange);

                // the game can't overlap anything
                if (overlapKind != RangeOverlapKind.None)
                    throw `overlapping detected on loadGridFromBracket: game ${game.GameNum}`;

                this.addGameRange(game.FullGameRange, game.GameNum, false).attachGame(game);

                // the feeder lines are allowed to perfectly overlap other feeder lines
                AppContext.checkpoint("lgfb.5");
                [feederTop, feederBottom, feederWinner] = await GameLines.getInAndOutLinesForGame(ctx, game);
                AppContext.checkpoint("lgfb.6");

                // We are going to be tolerant here -- sometimes our feeder calculations
                // identify game underlines as actual feeder lines. that means we would
                // get an overlap here. just ignore those.
                if (feederTop != null)
                {
                    overlapKind = this.doesRangeOverlap(feederTop);

                    if (overlapKind == RangeOverlapKind.None)
                        this.addLineRange(feederTop);
//                    else if (overlapKind == RangeOverlapKind.Partial)
//                        throw `line range overlaps another range`;
                }
                if (feederBottom != null)
                {
                    overlapKind = this.doesRangeOverlap(feederBottom);

                    if (overlapKind == RangeOverlapKind.None)
                        this.addLineRange(feederBottom);
//                    else if (overlapKind == RangeOverlapKind.Partial)
//                        throw `line range overlaps another range`;
                }
                if (feederWinner != null)
                {
                    overlapKind = this.doesRangeOverlap(feederWinner);

                    if (overlapKind == RangeOverlapKind.None)
                        this.addLineRange(feederWinner);
//                    else if (overlapKind == RangeOverlapKind.Partial)
//                        throw `line range overlaps another range`;
                }
            }
        }
        this.logGrid();
    }

    getOutgoingConnectionForGameResult(gameNumber: number): RangeInfo
    {
        const item: GridItem = this.findGameItem(gameNumber);

        if (item == null)
            return null;

        return item.GameNumberRange.offset(1, 1, 2, 1);
    }

    /*----------------------------------------------------------------------------
        %%Function: Grid.getTargetGameFeedForGameResult

        Given a result (e.g. W5), find the feeder cell for the game that wants to
        connect to this game result
    ----------------------------------------------------------------------------*/
    getTargetGameFeedForGameResult(game: IBracketGame): RangeInfo
    {
        // we know what game we want to have
        if (game.BracketGameDefinition.winner == "")
            return null; // winner goes nowhere

        const targetGameNumber: number = Number(game.BracketGameDefinition.winner.substring(1));
        const item: GridItem = this.findGameItem(targetGameNumber);

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
        if (source1 != null
            && this.doesRangeOverlap(
                RangeInfo.createFromCorners(
                    source1,
                    source1.newSetColumn(column - 1))) != RangeOverlapKind.None)
        {
            return `Top feeder line (${source1.toString()}) overlaps existing item`;
        }

        if (source2 != null
            && this.doesRangeOverlap(
                RangeInfo.createFromCorners(
                    source2,
                    source2.newSetColumn(column - 1))) != RangeOverlapKind.None)
        {
            return `Bottom feeder line (${source2.toString()}) overlaps existing item`;
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
                    requested.setRow(source2.offset(-11 + 2, 1, 0, 1).FirstRow);
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

        return false;
    }

    /*----------------------------------------------------------------------------
        %%Function: Grid.buildGridGameForAnchoredSourceNoOutgoingPresent

        Note that we don't take the other match since there's only one match...
    ----------------------------------------------------------------------------*/
    buildGridGameForAnchoredSourceNoOutgoingPresent(
        source1: RangeInfo,
        source2: RangeInfo,
        anchor: RangeInfo,
        other: RangeInfo,
        requested: RangeInfo,
        fSwapTopBottom: boolean)
    {
        let gameInsert: GridGameInsert = new GridGameInsert();

        if (anchor != null && other != null)
        {
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
        if (this.shouldGrowUpInstead(requested))
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
                    11 - 2,
                    1,
                    0,
                    1).newSetColumn(requested.FirstColumn + 2));

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
        %%Function: Grid.isValidGridGameInsert

        if any of the ranges overlap things already in the grid, then
        fill in the reason why this game can't be inserted and return false
    ----------------------------------------------------------------------------*/
    isValidGridGameInsert(gameInsert: GridGameInsert): boolean
    {
        if (gameInsert.m_rangeFeederTop != null
            && this.doesRangeOverlap(gameInsert.m_rangeFeederTop) != RangeOverlapKind.None)
        {
            gameInsert.m_failReason = `rangeFeederTop (${gameInsert.m_rangeFeederTop.toString()}) overlaps`;
            return false;
        }

        if (gameInsert.m_rangeFeederBottom != null
            && this.doesRangeOverlap(gameInsert.m_rangeFeederBottom) != RangeOverlapKind.None)
        {
            gameInsert.m_failReason = `rangeFeederTop (${gameInsert.m_rangeFeederBottom.toString()}) overlaps`;
            return false;
        }

        if (gameInsert.m_rangeWinnerFeeder != null
            && this.doesRangeOverlap(gameInsert.m_rangeWinnerFeeder) != RangeOverlapKind.None)
        {
            gameInsert.m_failReason = `m_rangeWinnerFeeder (${gameInsert.m_rangeWinnerFeeder.toString()}) overlaps`;
            return false;
        }

        if (gameInsert.m_rangeGame != null
            && this.doesRangeOverlap(gameInsert.m_rangeGame) != RangeOverlapKind.None)
        {
            gameInsert.m_failReason = `m_rangeGame (${gameInsert.m_rangeGame.toString()}) overlaps`;
            return false;
        }

        if (this.doesSourceOverlapRangeOverlap(
            gameInsert.m_rangeFeederTop,
            gameInsert.m_rangeFeederBottom,
            gameInsert.m_rangeGame.FirstColumn))
        {
            gameInsert.m_failReason = `overlap region overlapped`;
            return false;
        }

        return true;
    }

    doesSourceOverlapRangeOverlap(
        source1: RangeInfo,
        source2: RangeInfo,
        targetColumn: number): boolean
    {
        let f: boolean = false;

        [source1, source2, f] = this.normalizeSources(source1, source2, f);

        if (source1 == null || source2 == null)
            return false;

        const maxColumn: number = Math.max(
            source1 != null ? source1.FirstColumn : targetColumn,
            source2 != null ? source2.FirstColumn : targetColumn);

        let overlapRegion: RangeInfo;

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

        if (this.doesRangeOverlap(overlapRegion) != RangeOverlapKind.None)
        {
            return true;
        }
        return false;
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

        return maxRow;
    }

    normalizeSources(source1: RangeInfo, source2: RangeInfo, fSwapTopBottom: boolean): [RangeInfo, RangeInfo, boolean]
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
        %%Function: Grid.rearrangeGridForCommonConflicts

        Find very specific conflicts and see if we can make a simple rearrangment
        to the games to make them fit.

        This can only be done when we are doing linear building of the bracket
        (i.e. there is no outgoing feed to match up with)
    ----------------------------------------------------------------------------*/
    rearrangeGridForCommonConflicts(
        game: IBracketGame, // so we can reload the sources...
        source1: RangeInfo,
        source2: RangeInfo,
        outgoing: RangeInfo,
        column: number)
    {
        // detect the most common conflict -- two source feeds overlap
        // a range of games. the specific case we know about happens when the
        // top game feed path combines with a bottom game from the first day.

        if (outgoing != null)
            return;

        let gridTry: Grid = this.clone();
        let f = false;

        [source1, source2, f] = this.normalizeSources(source1, source2, f);

        if (source1 == null && source2 == null)
        {
            // can't determine an overlap to correct with no sources
            return;
        }

        if (!gridTry.doesSourceOverlapRangeOverlap(source1, source2, column))
        {
            console.log(`no region swapping needed, no overlap detected.`);
            return;
        }

        // ok, we have an overlap.  see if moving the bottom game to the top fixes it
        let lastItem: GridItem = gridTry.getLastItemInColumn(gridTry.m_firstGridPattern.FirstColumn);
        const firstEmptyRowInGrid: number = gridTry.getFirstEmptyRowToUse(0, 1000, 2);

        // first, there has to be a completely empty row between the two regions we want to swap
        // (check the underline above and below the full height range as well)
        let rangeBlankCheck: RangeInfo = lastItem.Range.offset(-3, 3, 0, 100).newSetColumn(1);

        if (gridTry.doesRangeOverlap(rangeBlankCheck) != RangeOverlapKind.None)
        {
            console.log(`no blank row at ${rangeBlankCheck.toString()}. regions not distinct`);
            return;
        }

        rangeBlankCheck = lastItem.Range.offset(lastItem.Range.RowCount - 2, 3, 0, 100).newSetColumn(lastItem.Range.FirstColumn + 3);

        if (gridTry.doesRangeOverlap(rangeBlankCheck) != RangeOverlapKind.None)
        {
            console.log(`bottom of item is not blank beyond at ${rangeBlankCheck.toString()}. regions not distinct`);
            return;
        }

        // well, we implemented a very clever region swap. but that's not what we wanted.
        // we want 3 regions. region 1 & 2 swap, and region 3 stays the same.  region 2
        // needs to be the last item inthe first column (lastItem from above).

        // all 3 regions shoudl be distinct.  and region 1 and 2 swap just as we had, but everything
        // in region3 (the distinct region after the last item in column 1) has to remain unchanged.
        // ok, we have a clear break between the regions. shift one set down and the others up

        const regionTop: RangeInfo = new RangeInfo(
            this.m_firstGridPattern.FirstRow,
            lastItem.Range.FirstRow - this.m_firstGridPattern.FirstRow + 1 - 2, // go to the empty row
            0,
            1000);

        const regionBottom: RangeInfo = new RangeInfo(
            lastItem.Range.FirstRow,
            lastItem.Range.RowCount,
            0,
            1000);

        // now, swap regionTop with regionBottom

        // since we know there is a clear break between the regions, there is no chance
        // a range overlaps the two regions. So, we only need to check the first row.
        for (let i: number = 0; i < gridTry.m_gridItems.length; i++)
        {
            if (gridTry.m_gridItems[i].Range.FirstRow <= regionTop.LastRow)
            {
                gridTry.m_gridItems[i].shiftByRows(regionBottom.RowCount + 1);
            }
            else if (gridTry.m_gridItems[i].Range.FirstRow <= regionBottom.LastRow)
            {
                gridTry.m_gridItems[i].shiftByRows(-regionTop.RowCount - 1);
            }
        }

        // now, see if we still have an overlap problem. if we do, well, we failed...
        [source1, source2, outgoing] = gridTry.getFeederInfoForGame(game);
        [source1, source2, f] = this.normalizeSources(source1, source2, f);

        if (gridTry.doesSourceOverlapRangeOverlap(source1, source2, column))
        {
            // this means we failed to relocate -- we still have an overlap...
            console.log("still overlaps, no region swap will help");
            return;
        }

        // awesome, the swap helped

        this.m_gridItems = gridTry.m_gridItems;
        gridTry.m_gridItems = null; // just to make sure nobody ever tries to use it!
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
        source1: RangeInfo,
        source2: RangeInfo,
        outgoing: RangeInfo,
        requested: RangeInfo): GridGameInsert
    {
        let gameInsert: GridGameInsert = new GridGameInsert();
        let fSwapTopBottom: boolean = game.SwapTopBottom;

        // normalize the sources
        if (source1 != null && source2 != null)
        {
            [source1, source2, fSwapTopBottom] = this.normalizeSources(source1, source2, fSwapTopBottom);
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
            [source1, source2, fSwapTopBottom] = this.normalizeSources(source1, source2, fSwapTopBottom);
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

            // now grow to including outgoing
            if (outgoing != null)
            {
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
                fSwapTopBottom);
        }

        // ok, our requested range has no relationship to either sources. now figure out
        // the placement given just the matches we know about

        // if we have both sources, then we either work or not
        if (source1 != null && source2 != null)
        {
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

            // now grow to including outgoing
            if (outgoing != null)
            {
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

        gameInsert.m_rangeGame =
            RangeInfo.createFromCorners(
                requested.offset(0, 1, 0, 1).newSetColumn(requested.FirstColumn),
                requested.offset(
                    10,
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

        // now with just one source, let's insert
        gameInsert.m_failReason = "NYI";
        return gameInsert;

        if (source1 == null && source2 == null)
        {
            // we only have outgoing to worry about
        }

        if (source1 != null && source2 != null)
        {
            if (source1.FirstRow > source2.FirstRow)
            {
                gameInsert.m_swapTopBottom = true;
                let temp = source2;
                source2 = source1;
                source1 = temp;
            }

            if (source2.FirstRow - source1.FirstRow < 9)
            {
                gameInsert.m_failReason = "Not enough space between source games to automatically insert";
                return gameInsert;
            }

            if ((gameInsert.m_failReason = this.doFeederLinesOverlap(source1, source2, requested.FirstColumn)) != null)
                return gameInsert;

            // we are good to insert
            return gameInsert;
        }

        let source: RangeInfo = source1 == null ? source2 : source1;

        // generally we want to insert with the winning feeder game on top
        if (this.doesRangeOverlap(RangeInfo.createFromCorners(source.newSetRow(1), source.newSetColumn(requested.FirstColumn))) == RangeOverlapKind.None)
        {
            // exception 1: if there are no games above where we are trying to insert, then we will
            // 'insert up'
            if (source2 != null)
            {
                gameInsert.m_swapTopBottom = true;

            }

        }
    }

    getFeederInfoForGame(game: IBracketGame): [RangeInfo, RangeInfo, RangeInfo]
    {
        let source1: RangeInfo = null;
        let source2: RangeInfo = null;
        let outgoing: RangeInfo = null;

        // figure out all the connecting info for the game
        let gameNumber: number = FormulaBuilder.getSourceGameNumberIfWinner(game.TopTeamName);

        if (gameNumber != -1)
            source1 = this.getOutgoingConnectionForGameResult(gameNumber);

        outgoing = this.getTargetGameFeedForGameResult(game);

        // figure out all the connecting info for the game
        gameNumber = FormulaBuilder.getSourceGameNumberIfWinner(game.BottomTeamName);

        if (gameNumber != -1)
            source2 = this.getOutgoingConnectionForGameResult(gameNumber);

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
        let gameInsert: GridGameInsert = new GridGameInsert();

        let source1, source2, outgoing: RangeInfo;
        
        [source1, source2, outgoing] = gridNew.getFeederInfoForGame(game);

        // first, try to do some adjustments...
        gridNew.rearrangeGridForCommonConflicts(game, source1, source2, outgoing, requested.FirstColumn);

        [source1, source2, outgoing] = gridNew.getFeederInfoForGame(game);

        gameInsert = gridNew.gridGameFromConstraints(
            game,
            source1,
            source2,
            outgoing,
            requested);


        if (gameInsert.m_failReason != null)
        {
            return [null, `failed: ${gameInsert.m_failReason}`];
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
        gridNew.addGameRange(gameInsert.m_rangeGame, game.GameNum, gameInsert.m_swapTopBottom);

        return [gridNew, null];
    }

    logGrid()
    {
        console.log(`first repeating: ${this.m_firstGridPattern.toString()}`);

        for (let item of this.m_gridItems)
        {
            console.log(`${item.GameNum}: ${item.Range.toString()}`);
        }
    }

    logChanges(changes: GridChange[])
    {
        for (let item of changes)
        {
            console.log(`${item.toString()}`);
        }
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
}