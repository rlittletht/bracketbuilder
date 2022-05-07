import { IGridAdjuster } from "./IGridAdjuster";
import { Grid } from "../Grid";
import { GridItem } from "../GridItem";
import { RangeInfo } from "../../Interop/Ranges";
import { GridAdjust } from "./GridAdjust";
import { IBracketGame } from "../BracketGame";
import { RegionSwapper } from "./RegionSwapper";

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

        RegionSwapper.regionSwapper(gridTry, regionTop, regionBottom);

        // now, see if we still have an overlap problem. if we do, well, we failed...
        if (this.doesAdjusterApply(gridTry, game, column))
        {
            console.log(`no region swapping needed, no overlap detected.`);
            return false;
        }

        let outgoing: RangeInfo;

        // awesome, the swap helped
        grid.setInternalGridItems(gridTry.m_gridItems);
        gridTry.m_gridItems = null; // just to make sure nobody ever tries to use it!

        return true;
    }
}