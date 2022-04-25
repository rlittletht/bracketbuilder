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

    doesRangeOverlap(range: RangeInfo): RangeOverlapKind
    {
        for (let item of this.m_gridItems)
        {
            const overlapKind: RangeOverlapKind = RangeInfo.isOverlapping(range, item.Range);

            if (overlapKind != RangeOverlapKind.None)
                return overlapKind;
        }

        return RangeOverlapKind.None;
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
            if (gridRight.doesRangeOverlap(itemLeft.Range) != RangeOverlapKind.Equal)
            {
                // any kind of difference means this has to be removed
                changes.push(new GridChange(GridChangeOperation.Remove, itemLeft));
            }
        }

        // now diff the other way
        for (let itemRight of gridRight.m_gridItems)
        {
            if (this.doesRangeOverlap(itemRight.Range) != RangeOverlapKind.Equal)
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

        console.log("cgfb.1");
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
        console.log("lgfb.1");
        this.m_firstGridPattern = await this.getFirstGridPatternCell(ctx);

        // go through all the game definitions and try to add them to the grid
        let bracketDef: BracketDefinition = BracketStructureBuilder.getBracketDefinition(`${bracketName}Bracket`);

        console.log("lgfb.2");
        for (let i: number = 0; i < bracketDef.games.length; i++)
        {
            let game: BracketGame = new BracketGame()
            let feederTop: RangeInfo = null;
            let feederBottom: RangeInfo = null;
            let feederWinner: RangeInfo = null;

            console.log("lgfb.3");
            await game.Load(ctx, bracketName, i);
            console.log("lgfb.4");
            if (game.IsLinkedToBracket)
            {
                let overlapKind: RangeOverlapKind = this.doesRangeOverlap(game.FullGameRange);

                // the game can't overlap anything
                if (overlapKind != RangeOverlapKind.None)
                    throw `overlapping detected on loadGridFromBracket: game ${game.GameNum}`;

                this.addGameRange(game.FullGameRange, game.GameNum, false).attachGame(game);

                // the feeder lines are allowed to perfectly overlap other feeder lines
                console.log("lgfb.5");
                [feederTop, feederBottom, feederWinner] = await GameLines.getInAndOutLinesForGame(ctx, game);
                console.log("lgfb.6");
                if (feederTop != null)
                {
                    overlapKind = this.doesRangeOverlap(feederTop);

                    if (overlapKind == RangeOverlapKind.None)
                        this.addLineRange(feederTop);
                    else if (overlapKind == RangeOverlapKind.Partial)
                        throw `line range overlaps another range`;
                }
                if (feederBottom != null)
                {
                    overlapKind = this.doesRangeOverlap(feederBottom);

                    if (overlapKind == RangeOverlapKind.None)
                        this.addLineRange(feederBottom);
                    else if (overlapKind == RangeOverlapKind.Partial)
                        throw `line range overlaps another range`;
                }
                if (feederWinner != null)
                {
                    overlapKind = this.doesRangeOverlap(feederWinner);

                    if (overlapKind == RangeOverlapKind.None)
                        this.addLineRange(feederWinner);
                    else if (overlapKind == RangeOverlapKind.Partial)
                        throw `line range overlaps another range`;
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
            return `Bottom feeder line (${source1.toString()}) overlaps existing item`;
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
    adjustRangeForGridAlignment(range: RangeInfo)
    {
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

        range.m_columnCount = 1;
    }

    /*----------------------------------------------------------------------------
        %%Function: Grid.gridGameFromConstraints

        Given a set of constraints (feeder lines in, and feeder line out, and the
        column the game should go in), figure out where to place the game.

        If a large enough non-overlapping range is provided for the game, that
        will be given priority, even if the feeder lines would overlap.
    ----------------------------------------------------------------------------*/
    gridGameFromConstraints(game: IBracketGame, source1: RangeInfo, source2: RangeInfo, outgoing: RangeInfo, requested: RangeInfo): GridGameInsert
    {
        let gameInsert: GridGameInsert = new GridGameInsert();
        let fSwapTopBottom: boolean = game.SwapTopBottom;

        // normalize the sources
        if (source1 != null && source2 != null)
        {
            if (source1.FirstRow > source2.FirstRow)
            {
                let temp = source2;
                source2 = source1;
                source1 = temp;
                fSwapTopBottom = !fSwapTopBottom;
            }
        }

        // first, see if we have a requested range and if it is good
        if (requested.RowCount > 8)
        {
            // (we can always adjust +/- 1 row to make the requested range work)
            if (source1 != null)
            {
                if (source1.fuzzyMatchRow(requested.FirstRow + 1, 1))
                {
                    requested.setRow(source1.FirstRow - 1);
                }
                else if (source1.fuzzyMatchRow(requested.LastRow - 1, 1))
                {
                    // if the top game (source1) matches the bottom of our requested range
                    // then we have to swap whatever the state of swap is
                    requested.setRow(source1.LastRow + 1);
                    fSwapTopBottom = !fSwapTopBottom
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
                    fSwapTopBottom = !fSwapTopBottom
                }
            }
            // now adjust the range so it aligns with the grid. (it should align if there were
            // feeder lines, but when there aren't feeder lines we might have to nudge it)
            this.adjustRangeForGridAlignment(requested);

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

        gameInsert.m_failReason = "NYI";
        return null;

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
    /*----------------------------------------------------------------------------
        %%Function: Grid.gridGameInsertForGame

        figure out the correct insert location for the given game.

        must provide a column for the game to be inserted into
    ----------------------------------------------------------------------------*/
    gridGameInsertForGame(game: IBracketGame, requested: RangeInfo): GridGameInsert
    {
        let gameInsert: GridGameInsert = new GridGameInsert();

        let sourceGameNum: number = -1;

        // figure out all the connecting info for the game
        sourceGameNum = FormulaBuilder.getSourceGameNumberIfWinner(game.TopTeamName);

        let sourceFeedFirst: RangeInfo = null;

        if (sourceGameNum != -1)
            sourceFeedFirst = this.getOutgoingConnectionForGameResult(sourceGameNum);

        let outgoingGameFeed: RangeInfo = this.getTargetGameFeedForGameResult(game);

        // figure out all the connecting info for the game
        sourceGameNum = FormulaBuilder.getSourceGameNumberIfWinner(game.BottomTeamName);

        let sourceFeedSecond: RangeInfo = null;
        if (sourceGameNum != -1)
            sourceFeedSecond = this.getOutgoingConnectionForGameResult(sourceGameNum);

        gameInsert = this.gridGameFromConstraints(
            game,
            sourceFeedFirst,
            sourceFeedSecond,
            outgoingGameFeed,
            requested);

        // now, in theory we have the rows we would like to place this game...

        // if we have a source, figure out if we shoudl swap to make it work better
        // and what row we have to have to make the connection happen

        // and the outgoing feed (if we have one) will dictate where our middle
        // wants to be in order to line up.
        // since we can't have two sources feeding into us, one of our games will
        // always be allowed to float, which means we should be able to stretch
        // the height of the game tall enough to make the middle calculation work

        // then figure out if we overlap anything
        // or if we want to swap home/away (though the feeder line relative to
        // the middle might already dictate that....if it doesn't, then maybe
        // swapping home/away will avoid an overlap)

        // also look for places where we fall off the top of the sheet because we have to go up too high

        // also look for places where the overlap can only be resolved by swapping a game around
        // (though might want to just give up on that case for right now.)

        return gameInsert;
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
    ----------------------------------------------------------------------------*/
    static getRangeInfoForGameInfo(rangeInfo: RangeInfo): RangeInfo
    {
        if (rangeInfo.RowCount < 9)
            throw new Error("bad rangeInfo param");

        // this is the total number of full height rows to fill information into
        const bodyRowCount: number = Math.floor((rangeInfo.RowCount - 3 - 1) / 2 + 0.5);

        // this is the offset to the first row of body text, in full height rows.
        // We need 3 full height rows for our data, so the remaining is divided between the two
        const bodyTopText: number = Math.floor((bodyRowCount - 3) / 2 + 0.5);

        // now we have to convert this offset to full height rows into actual row offsets
        // and calculate the offset from the start of the game info region (which will
        // always start at least after the game title and the underline row)
        return new RangeInfo(rangeInfo.FirstRow + 2 + bodyTopText * 2, 5, rangeInfo.FirstColumn, rangeInfo.ColumnCount);
    }
}