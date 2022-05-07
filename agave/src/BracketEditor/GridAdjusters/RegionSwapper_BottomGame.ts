import { IGridAdjuster } from "./IGridAdjuster";
import { Grid } from "../Grid";
import { GridItem } from "../GridItem";
import { RangeInfo } from "../../Interop/Ranges";
import { GridAdjust } from "./GridAdjust";
import { IBracketGame, BracketGame } from "../BracketGame";
import { RegionSwapper } from "./RegionSwapper";
import { IAppContext } from "../../AppContext";

export class RegionSwapper_BottomGame implements IGridAdjuster
{
    /*----------------------------------------------------------------------------
        %%Function: RegionSwapper_BottomGame.doesAdjusterApply

        In order to apply, we have to have:
        * both sources defined
        * no outgoing
        * the range between the top source and the bottom source has to overlap
          existing items
          
        FUTURE: Should also include checks for the matching game being the last
        game in the first column
    ----------------------------------------------------------------------------*/
    doesAdjusterApply(
        gridTry: Grid,
        game: IBracketGame,
        column: number): boolean
    {
        let f: boolean = false;

        let [source1, source2, outgoing] = gridTry.getFeederInfoForGame(game);
        [source1, source2, f] = Grid.normalizeSources(source1, source2, f);

        if (outgoing != null)
            return false;

        if (source1 == null || source2 == null)
            return false;

        if (!gridTry.doesSourceOverlapRangeOverlap(source1, source2, column))
        {
            console.log(`no region swapping needed, no overlap detected.`);
            return false;
        }

        return true;
    }

    /*----------------------------------------------------------------------------
        %%Function: RegionSwapper_BottomGame.doAdjustment

        two source feeds overlap a range of games. this specific case we know
        about happens when the top game feed path combines with a bottom game
        from the first day. to fix that, bubble that bottom game region to the
        top (effectively swapping the top and bottom regions)
    ----------------------------------------------------------------------------*/
    doAdjustment(
        grid: Grid,
        game: IBracketGame, // so we can reload the sources...
        column: number): boolean
    {
        if (!this.doesAdjusterApply(grid, game, column))
        {
            console.log(`no region swapping needed, no overlap detected.`);
            return false;
        }

        let gridTry: Grid = grid.clone();

        // ok, we have an overlap.  see if moving the bottom game to the top fixes it
        let lastItem: GridItem = gridTry.getLastItemInColumn(gridTry.m_firstGridPattern.FirstColumn);

        const regionTop: RangeInfo = new RangeInfo(
            grid.FirstGridPattern.FirstRow,
            lastItem.Range.FirstRow - grid.FirstGridPattern.FirstRow + 1 - 2, // go to the empty row
            0,
            1000);

        const regionBottom: RangeInfo = new RangeInfo(
            lastItem.Range.FirstRow,
            lastItem.Range.RowCount,
            0,
            1000);

        if (!RegionSwapper.canRegionsSwap(gridTry, regionTop, regionBottom))
            return false;

        RegionSwapper.swapRegions(gridTry, regionTop, regionBottom);

        // now, see if we still have an overlap problem. if we do, well, we failed...
        if (this.doesAdjusterApply(gridTry, game, column))
        {
            console.log(`region swapping didn't help.`);
            return false;
        }

        // awesome, the swap helped
        grid.setInternalGridItems(gridTry.m_gridItems);
        gridTry.m_gridItems = null; // just to make sure nobody ever tries to use it!

        return true;
    }

    /*----------------------------------------------------------------------------
        %%Function: RegionSwapper_BottomGame.testRegionSwap1

        In a 9 team grid, when game 10 is inserted, Game 4 and Game 5 need to
        combine for a game. This requires the bottom game in the grid
        and the top game in the grid to combine, which naturally causes a conflict
        and requires a region swap.  Test this.
    ----------------------------------------------------------------------------*/
    static testRegionSwap1(appContext: IAppContext) {
        appContext;
        let grid: Grid = new Grid();

        grid.m_firstGridPattern = new RangeInfo(9, 1, 6, 1);

        // setup the precondition
        grid.addGameRange(RangeInfo.createFromCornersCoord(9, 6, 19, 8), 1, false).inferGameInternals();
        grid.addGameRange(RangeInfo.createFromCornersCoord(23, 6, 33, 8), 2, false).inferGameInternals();
        grid.addGameRange(RangeInfo.createFromCornersCoord(28, 9, 28, 11), -1, false);
        grid.addGameRange(RangeInfo.createFromCornersCoord(37, 6, 47, 8), 3, false).inferGameInternals();
        grid.addGameRange(RangeInfo.createFromCornersCoord(42, 9, 42, 11), -1, false);
        grid.addGameRange(RangeInfo.createFromCornersCoord(51, 6, 61, 8), 4, false).inferGameInternals();
        grid.addGameRange(RangeInfo.createFromCornersCoord(13, 9, 23, 11), 5, false).inferGameInternals();
        grid.addGameRange(RangeInfo.createFromCornersCoord(63, 9, 73, 11), 6, false).inferGameInternals();
        grid.addGameRange(RangeInfo.createFromCornersCoord(77, 9, 87, 11), 7, false).inferGameInternals();
        grid.addGameRange(RangeInfo.createFromCornersCoord(67, 12, 77, 14), 8, false).inferGameInternals();
        grid.addGameRange(RangeInfo.createFromCornersCoord(27, 12, 43, 14), 9, false).inferGameInternals();

        // now try to insert game...
        let game: IBracketGame = BracketGame.CreateFromGameSync("T9", 9);

        let gridNew: Grid = grid.clone();
        let reqColumn: number = 14;

        GridAdjust.rearrangeGridForCommonConflicts(gridNew, game, reqColumn);

        // now verify that we have fixed the problem
        let [source1, source2, outgoing] = gridNew.getFeederInfoForGame(game);
        if (gridNew.doesSourceOverlapRangeOverlap(source1, source2, reqColumn)) {
            throw Error("testRegionSwap1: FAILED: rearrange failed to resolve");
        }
    }
}