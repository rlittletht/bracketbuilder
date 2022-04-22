import { RangeInfo, RangeOverlapKind, Ranges } from "../Interop/Ranges";
import { BracketDefinition } from "../Brackets/BracketDefinitions";
import { BracketGame, IBracketGame } from "./BracketGame";
import { BracketStructureBuilder } from "../Brackets/BracketStructureBuilder";
import { StructureEditor } from "./StructureEditor";
import { GameLines } from "./GameLines";
import { GameFormatting } from "./GameFormatting";
import { GridGameInsert } from "./GridGameInsert";
import { FormulaBuilder } from "./FormulaBuilder";

export class GridItem
{
    m_range: RangeInfo;
    m_topTeamRange: RangeInfo = null;
    m_bottomTeamRange: RangeInfo = null;
    m_gameNumberRange: RangeInfo = null;
    m_swapTopBottom: boolean = false; // we will save this from the bound game - allows us to find connecting lines

    m_gameNum: number = -1;

    get isLineRange(): boolean
    {
        return this.m_gameNum == -1;
    }

    get swapTopBottom(): boolean { return this.m_swapTopBottom; }

    get GameNum(): number
    {
        return this.m_gameNum;
    }

    get TopTeamRange(): RangeInfo
    {
        return this.m_topTeamRange;
    }

    get BottomTeamRange(): RangeInfo
    {
        return this.m_bottomTeamRange;
    }

    get GameNumberRange(): RangeInfo
    {
        return this.m_gameNumberRange;
    }

    get Range(): RangeInfo
    {
        return this.m_range;
    }

    constructor(range: RangeInfo, gameNum: number, isLine: boolean)
    {
        this.m_range = range;
        this.m_gameNum = isLine ? -1 : gameNum;
    }

    attachGame(game: IBracketGame)
    {
        if (!game.IsLinkedToBracket)
            throw "can't attach game that isn't linked";

        this.m_topTeamRange = RangeInfo.createFromRangeInfo(game.TopTeamRange);
        this.m_bottomTeamRange = RangeInfo.createFromRangeInfo(game.BottomTeamRange);
        this.m_gameNumberRange = RangeInfo.createFromRangeInfo(game.GameNumberRange);
        this.m_swapTopBottom = game.SwapTopBottom;
    }

    isEqual(item: GridItem): boolean
    {
        if (this.GameNum != item.GameNum)
            return false;

        if (RangeInfo.isOverlapping(this.Range, item.Range) != RangeOverlapKind.Equal)
            return false;
        if (RangeInfo.isOverlapping(this.TopTeamRange, item.TopTeamRange) != RangeOverlapKind.Equal)
            return false;
        if (RangeInfo.isOverlapping(this.BottomTeamRange, item.BottomTeamRange) != RangeOverlapKind.Equal)
            return false;
        if (RangeInfo.isOverlapping(this.GameNumberRange, item.GameNumberRange) != RangeOverlapKind.Equal)
            return false;

        return true;
    }

    static createFromItem(item: GridItem): GridItem
    {
        let itemNew = new GridItem(item.Range, item.GameNum, item.isLineRange);

        itemNew.m_topTeamRange = RangeInfo.createFromRangeInfo(item.TopTeamRange);
        itemNew.m_bottomTeamRange = RangeInfo.createFromRangeInfo(item.BottomTeamRange);
        itemNew.m_gameNumberRange = RangeInfo.createFromRangeInfo(item.GameNumberRange);
        itemNew.m_swapTopBottom = item.m_swapTopBottom;

        return itemNew;
    }
}

export enum GridChangeOperation
{
    Insert,
    Remove
}

export class GridChange
{
    m_changeOp: GridChangeOperation;
    m_gridItem: GridItem;

    get ChangeOp() { return this.m_changeOp };
    get Range() { return this.m_gridItem.Range; }
    get GameNumber() { return this.m_gridItem.GameNum; }
    get IsLine() { return this.m_gridItem.isLineRange; }

    constructor(op: GridChangeOperation, item: GridItem)
    {
        this.m_changeOp = op;
        this.m_gridItem = item;
    }

    toString(): string
    {
        return `${this.m_changeOp == GridChangeOperation.Remove ? "<" : ">"} ${this.GameNumber}: ${this.Range.toString()}`;
    }
}

export class Grid
{
    m_gridItems: GridItem[] = [];
    m_firstGridPattern: RangeInfo;

    addGameRange(range: RangeInfo, gameNum: number): GridItem
    {
        let item: GridItem = new GridItem(range, gameNum, false);
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

                this.addGameRange(game.FullGameRange, game.GameNum).attachGame(game);

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

        if ((game.BracketGameDefinition.winner[0] === "T" && item.swapTopBottom == false)
            || (game.BracketGameDefinition.winner[0] === "B" && item.swapTopBottom == true))
        {
            // the two cases we want the top game
            return item.TopTeamRange.offset(1, 1, -1, 1);
        }
        else
        {
            return item.TopTeamRange.offset(-1, 1, -1, 1);
        }
    }

    /*----------------------------------------------------------------------------
        %%Function: Grid.gridGameInsertForGame

        figure out the correct insert location for the given game.

        must provide a column for the game to be inserted into
    ----------------------------------------------------------------------------*/
    gridGameInsertForGame(game: IBracketGame, column: number): GridGameInsert
    {
        column;
        let gameInsert: GridGameInsert = new GridGameInsert();

        let sourceGameNum: number = -1;

        // figure out all the connecting info for the game
        sourceGameNum = FormulaBuilder.getSourceGameNumberIfWinner(game.TopTeamName);

        let sourceFeedFirst: RangeInfo = null;

        if (sourceGameNum != -1)
            sourceFeedFirst = this.getOutgoingConnectionForGameResult(sourceGameNum);

        let outgoingGameFeed: RangeInfo = this.getTargetGameFeedForGameResult(game);

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
}