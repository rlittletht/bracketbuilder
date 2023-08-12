import { IGridAdjuster } from "./IGridAdjuster";
import { Grid } from "../Grid";
import { IBracketGame, BracketGame } from "../BracketGame";
import { RangeInfo, RangeOverlapKind } from "../../Interop/Ranges";
import { Spacer } from "./Spacer";
import { GridAdjust } from "./GridAdjust";
import { IAppContext } from "../../AppContext/AppContext";
import { GridItem } from "../GridItem";
import { GameNum } from "../GameNum";
import { GameId } from "../GameId";
import { UnitTestContext } from "../../taskpane/components/App";

/*----------------------------------------------------------------------------
    Adjuster_WantToGrowUpAtTopOfGrid.Adjuster_WantToGrowUpAtTopOfGrid

    This adjuster is about wanting to insert a game that has a single
    source and wants to grow up because its at the top of the bracket, but
    it can't because the grid pattern doesn't have enough space
----------------------------------------------------------------------------*/
export class Adjuster_WantToGrowUpAtTopOfGrid implements IGridAdjuster
{
    doesAdjusterApply(
        gridTry: Grid,
        game: IBracketGame,
        column: number): boolean
    {
        let [source1, source2, outgoing] = gridTry.getRangeInfoForGameFeederItemConnectionPoints(game);

        if (source1 != null && source2 != null)
            return false;

        if (outgoing != null)
            return false;

        if (source1 == null && source2 == null)
            return false;

        // make source1 be the connecting source
        if (source1 == null)
            source1 = source2;

        if (source1.FirstRow - 5 == gridTry.FirstGridPattern.FirstRow
            || gridTry.doesRangeOverlap(
                RangeInfo.createFromCornersCoord(
                    gridTry.FirstGridPattern.FirstRow,
                    gridTry.FirstGridPattern.FirstColumn,
                    source1.FirstRow - 6,
                    column))
            == RangeOverlapKind.None)
        {
            // there's no overlap between the source feed in
            // and the top left of the grid pattern
            const countToGrow: number = this.getCountToGrow(gridTry, source1);

            if (countToGrow <= 0)
                return false;

            if (Spacer.canInsertRowSpaceBefore(gridTry, gridTry.FirstGridPattern.FirstRow))
                return true;
        }

        return false;
    }

    /*----------------------------------------------------------------------------
        %%Function: Adjuster_WantToGrowUpAtTopOfGrid.getCountToGrow

        figure out the number of rows we have to grow given the topTeam range.

        NOTE: This topTeam range was derived from the outgoing range of the source
        game, then we offset by -1. This is because the assumption is that the top
        team will have its underline meet up with the outgoing of the source, so
        the team name is on the top.

        When we go to swap top/bottom in order to grow up, we will accommodate
        this and shift back down 2 rows (to make the team name be BELOW the line
        instead of on top).  All this means we have a subtle size change for the
        space needed for the game. Instead of favoring 11 rows, we favor 9 to
        account for this.
    ----------------------------------------------------------------------------*/
    getCountToGrow(gridTry: Grid, topTeamFromSource: RangeInfo): number
    {
        return gridTry.FirstGridPattern.FirstRow - topTeamFromSource.FirstRow + 9;

    }

    doAdjustment(grid: Grid, game: IBracketGame, column: number): boolean
    {
        if (!this.doesAdjusterApply(grid, game, column))
            return false;

        let gridTry: Grid = grid.clone();

        let [source1, source2, outgoing] = gridTry.getRangeInfoForGameFeederItemConnectionPoints(game);

        if (source1 == null)
            source1 = source2;

        const countToGrow: number = this.getCountToGrow(gridTry, source1);

        if (countToGrow <= 0)
            throw new Error(`trying to insert negative rows: ${countToGrow}`);

        Spacer.insertRowSpaceBefore(gridTry, gridTry.FirstGridPattern.FirstRow, countToGrow);

        if (this.doesAdjusterApply(gridTry, game, column))
        {
            console.log("inserting space at top of grid didn't help");
            return false;
        }

        grid.setInternalGridItems(gridTry.m_gridItems);
        gridTry.m_gridItems = null; // just to make sure nobody ever tries to use it!

        return true;
    }

    /*----------------------------------------------------------------------------
        %%Function: Adjuster_WantToGrowUpAtTopOfGrid.testInsertSpaceAtTopOfGrid

        
    ----------------------------------------------------------------------------*/
    static testInsertSpaceAtTopOfGrid(appContext: IAppContext, testContext: UnitTestContext)
    {
        appContext;
        testContext.StartTest("Adjuster_WantToGrowUpAtTopOfGrid. testInsertSpaceAtTopOfGrid");
        let grid: Grid = new Grid();

        grid.m_firstGridPattern = new RangeInfo(9, 1, 6, 1);

        // setup the precondition
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8), 1, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(23, 6, 33, 8), 2, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(37, 6, 47, 8), 3, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(51, 6, 61, 8), 4, false).inferGameInternals();

        // now try to insert game...
        let game: IBracketGame = BracketGame.CreateFromGameSync("T9", new GameNum(4));

        let gridNew: Grid = grid.clone();
        let reqColumn: number = 14;

        GridAdjust.rearrangeGridForCommonConflicts(gridNew, game, reqColumn);

        // now verify that the grid was adjusted
        let item: GridItem = gridNew.findGameItem(new GameId(1));

        if (item == null)
            throw new Error("testInsertSpaceAtTopOfGrid: game 1 disappeared?");

        if (item.Range.FirstRow != 13)
            throw new Error("testInsertSpaceAtTopOfGrid: game 1 didn't move!");
    }
}