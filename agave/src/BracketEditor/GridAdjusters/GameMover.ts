import { Grid } from "../Grid";
import { GridItem } from "../GridItem";
import { GridRanker } from "../GridRanker";
import { RangeOverlapKind, RangeInfo } from "../../Interop/Ranges";
import { BracketGame, IBracketGame } from "../BracketGame";
import { GameId } from "../GameId";
import { Mover } from "../GameMovers/Mover";
import { PushAway } from "../GameMovers/PushAway";
import { FeederDrag } from "../GameMovers/FeederDrag";

export interface GridOption
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

    static createNewGridOption(gridWork: Grid): GridOption
    {
        return { grid: gridWork.clone(), rank: 0 };
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
        const mover: Mover = new Mover(grid, itemOld, itemNew, bracket);

        if (!GameId.compare(itemOld.GameId, itemNew.GameId))
            throw Error("can't change game while moving");

        // make this change
        // get the matching item
        let [match, kind] = grid.getFirstOverlappingItem(itemOld.Range);

        if (kind != RangeOverlapKind.Equal)
            throw Error("old item not found on original grid");

        match.setGameInternals(itemNew.Range, itemNew.TopTeamRange, itemNew.BottomTeamRange, itemNew.GameNumberRange);

        mover.invokeSingleMover(this, PushAway.checkAndMoveItemsAway);

        // now, check and apply the "outgoing feeder moved so it will drag the attached game with it")
        // apply this rule to grid and every grid in items
        mover.invokeSingleMover(this, FeederDrag.checkAndDragByOutgoingFeeder);

        return mover.Items;
    }
}