import { Grid } from "../Grid";
import { GridItem } from "../GridItem";
import { GridRanker } from "../GridRanker";
import { RangeOverlapKind, RangeInfo } from "../../Interop/Ranges";
import { BracketGame, IBracketGame } from "../BracketGame";

interface GridOption
{
    grid: Grid,
    rank: number
}

export class GameMover
{
    m_originalGrid: Grid;
    m_grids: Grid[] = [];

    constructor(grid: Grid)
    {
        this.m_originalGrid = grid;
    }

    moveGame(itemOld: GridItem, itemNew: GridItem, bracket: string): Grid
    {
        const gridNew: Grid = this.m_originalGrid.clone();
        const options: GridOption[] = this.moveGameInternal(gridNew, itemOld, itemNew, bracket);
        const best: GridOption = { grid: gridNew, rank: GridRanker.getGridRank(gridNew, bracket)};

        for (let option of options)
        {
            option.rank = GridRanker.getGridRank(option.grid, bracket);

            if (best.rank == -1 || (option.rank != -1 && option.rank < best.rank))
            {
                best.rank = option.rank;
                best.grid = option.grid;
            }
        }

        if (best.rank == -1)
            return null;

        return best.grid;
    }

    /*----------------------------------------------------------------------------
        %%Function: GameMover.moveGameInternal

        move the game from itemOld to itemNew on the given grid.

        return an array of possible outcome grids for this move.
        If the move is impossible, return []
        If the move is unambiguous, return [grid]
        If the move has possible branches, return [grid, ...]

        for now, this cannot break any incoming connections -- only 

        NOTE on Branch Creation.  This routine will do the requested move in the
        grid provided. Sometimes we have to make a choice that may or may not
        be good. In those cases, we clone the grid we're working with and apply
        one choice to the current grid, and one choice to the clone (and if there
        were more than 2 choices, even more clones).

        As this function accumulates branch options, it is required to make sure
        that all changes it makes are made to all branches. It follows, then, that
        the first adjustment need only be made to the current grid. The next
        adjustment needs to be made to the current grid AND any options created
        by the first adjustment. And so on.

        On return, all accumulated options are returned (NOT including the
        current grid -- that is always implit)
    ----------------------------------------------------------------------------*/
    moveGameInternal(grid: Grid, itemOld: GridItem, itemNew: GridItem, bracket: string): GridOption[]
    {
        const items: GridOption[] = [];
        const shiftTop: number = itemNew.Range.FirstRow - itemOld.Range.FirstRow;
        const shiftBottom: number = itemNew.Range.LastRow - itemOld.Range.LastRow;

        const fMovedUp: boolean = itemOld.Range.FirstRow > itemNew.Range.FirstRow;
        const fMovedDown: boolean = itemOld.Range.LastRow < itemNew.Range.LastRow;

        if (itemOld.GameNum != itemNew.GameNum)
            throw Error("can't change game while moving");

        // make this change
        // get the matching item
        let [match, kind] = grid.getFirstOverlappingItem(itemOld.Range);

        if (kind != RangeOverlapKind.Equal)
            throw Error("old item not found on original grid");

        match.setGameInternals(itemNew.Range, itemNew.TopTeamRange, itemNew.BottomTeamRange, itemNew.GameNumberRange);

        const moveItemAwayFromItem = (range: RangeInfo, item: GridItem, kind: RangeOverlapKind) =>
        {
            if (item.isEqual(itemNew))
                return true;

            range;
            kind;
            // the given item overlaps with the range. move it away (either up or down)
            // if we moved up AND we didn't move down, OR we moved down and the lastRow
            // of this overlapping item at or beyond our new last row. that last part covers
            // the new item growing up AND down, but this overlapping item was above us so
            // it should move up.
            
            if (fMovedUp && (!fMovedDown || item.Range.LastRow >= itemNew.Range.LastRow))
            {
                const newItem: GridItem = item.clone().shiftByRows(shiftTop);

                // don't make an adjustment if its still going to fail.
                if (RangeInfo.isOverlapping(range, newItem.Range) == RangeOverlapKind.None)
                {
                    const newItems: GridOption[] = this.moveGameInternal(grid, item, newItem, bracket);

                    for (let item of newItems)
                        items.push(item);
                }
            }
            else if (fMovedDown && (!fMovedUp || item.Range.FirstRow <= itemNew.Range.FirstRow))
            {
                const newItem: GridItem = item.clone().shiftByRows(shiftBottom);

                // don't make an adjustment if its still going to fail.
                if (RangeInfo.isOverlapping(range, newItem.Range) == RangeOverlapKind.None)
                {
                    const newItems: GridOption[] = this.moveGameInternal(grid, item, newItem, bracket);

                    for (let item of newItems)
                        items.push(item);
                }
            }

            return true;
        }

        // move things away from us that we now collide with (up and down)
        let rangeOverlapCheck: RangeInfo = new RangeInfo(
            itemNew.Range.FirstRow - 2,
            itemNew.Range.RowCount + 4,
            itemNew.Range.FirstColumn,
            itemNew.Range.ColumnCount);

        grid.enumerateOverlapping(
            [{ range: rangeOverlapCheck, delegate: moveItemAwayFromItem }]);

        const game: IBracketGame = itemNew.isLineRange ? null : BracketGame.CreateFromGameSync(bracket, itemNew.GameNum);
        const maxItemForOutgoingDrag: number = items.length;
        // be sure to capture the length right now. any items that get added during this work should not be considered
        // in this adjustment...
        // (FUTURE: maybe a more robust way to do it? maybe have a "generation" id, so each adjustment gets a new
        // generation, and we only consider options belonging to previous generations? that way we aren't order depended)
        for (let i = -1; i < maxItemForOutgoingDrag; i++)
        {
            let gridWork: Grid = i == -1 ? grid : items[i].grid;

            // skip working with disqualified options
            if (i >= 0 && items[i].rank == -1)
                continue;

            if (!gridWork.isItemOnGrid(itemNew))
            {
                if (i == -1)
                    throw Error("current grid has been corrupted. itemNew has moved");

                items[i].rank = -1;
                continue;
            }

            // now, see if our move changed the location of our outgoing feed point
            if (itemOld.isLineRange)
                continue;

            const outgoingPointOld: RangeInfo = itemOld.OutgoingFeederPoint;
            const outgoingPointNew: RangeInfo = itemNew.OutgoingFeederPoint;
            const dRows: number = outgoingPointNew.FirstRow - outgoingPointOld.FirstRow;

            if (dRows == 0)
                continue;

            // see if we actually are connected to anyone
            let [connectedItem, kindConnected] = gridWork.getFirstOverlappingItem(outgoingPointOld);
            let [connectedGame, kindGame] =
                (connectedItem == null || kindConnected == RangeOverlapKind.None || !connectedItem.isLineRange)
                    ? [null, RangeOverlapKind.None]
                    : gridWork.getFirstOverlappingItem(connectedItem.Range.offset(0, 1, connectedItem.Range.ColumnCount, 1));

            if (connectedGame == null || connectedGame.isLineRange || connectedGame.GameNum != game.WinningTeamAdvancesToGame)
                continue;

            // we have a game connected to us and we now have to "drag it along"
            if (connectedItem.isLineRange)
            {
                // move the line range
                connectedItem.shiftByRows(dRows);
            }

            {
                const newItems: GridOption[] = this.moveGameInternal(gridWork, connectedGame, connectedGame.clone().shiftByRows(dRows), bracket);

                for (let item of newItems)
                    items.push(item);
            }
        }

        // we dont have to move ourselves away in the other items because that list was empty when we started
        // (later rules WILL have to)

        // now, check and apply the "outgoing feeder moved so it will drag the attached game with it")
        // apply this rule to grid and every grid in items

        // before applying it to a grid in items, make sure that itemNew hasn't moved in the
        // grid. if an option moves the newItem we are working with, its tossed.

        return items;
    }
}