import { IGridAdjuster } from "./IGridAdjuster";
import { Grid, AdjustRangeGrowExtraRow } from "../Grid";
import { GridItem } from "../GridItem";
import { RangeInfo, RangeOverlapKind } from "../../Interop/Ranges";
import { GridAdjust } from "./GridAdjust";
import { IBracketGame, BracketGame } from "../BracketGame";
import { RegionSwapper } from "./RegionSwapper";
import { IAppContext } from "../../AppContext/AppContext";
import { GameNum } from "../GameNum";
import { UnitTestContext } from "../../taskpane/components/App";

// THIS ADJUSTER IS is for the insert of Game 19 on a 14 team bracket
// W15 and W13 will overlap game 16.  To fix this (and to fix the next problem
// of Game 20), swap Game12/Game 16 region with game 13 region.

export class Adjuster_SwapGameRegonsForOverlap implements IGridAdjuster
{
    /*----------------------------------------------------------------------------
        %%Function: Adjuster_SwapGameRegonsForOverlap.getRegionAroundSource

        get the smallest region that is independent around the given source range
    ----------------------------------------------------------------------------*/
    getRegionAroundSource(grid: Grid, source: RangeInfo, wholeRow: boolean): RangeInfo
    {
        wholeRow;
        // don't change the input range
        source = grid.adjustRangeForGridAlignment(
            RangeInfo.createFromRangeInfo(source),
            AdjustRangeGrowExtraRow.None);

        // expand region up and down until we are independent
        // (always expand by 2 rows...)

        // find the first row where we are independent from above
        let region: RangeInfo = source.offset(0, 1000, 0, 1000).newSetColumn(0);

        // start with an effectively infinite region starting at the current row
        // the only independence that is effectively being checked here is from
        // above

        while (region.FirstRow)
        {
            if (grid.isRangeIndependent(region))
                break;

            region.setRow(region.FirstRow - 2);
        }

        // now, expand down until we are independent from below

        region.setLastRow(source.LastRow);

        while (region.RowCount < 1000)
        {
            if (grid.isRangeIndependent(region))
                break;

            region.setLastRow(region.LastRow + 2);
        }

        return region;
    }

    doesAdjusterApply(
        gridTry: Grid,
        game: IBracketGame,
        column: number): boolean
    {
        const [doesApply, region1, region2, region3] = this.doesAdjusterApplyWithRegions(gridTry, game, column);

        return doesApply;
    }
    
    /*----------------------------------------------------------------------------
        %%Function: Adjuster_SwapGameRegonsForOverlap.doesAdjusterApply

        In order to apply, we have to have:
        * both sources defined
        * no outgoing
        * the range between the top source and the bottom source has to overlap
          existing items
          
        FUTURE: Should also include checks for the matching game being the last
        game in the first column

    ----------------------------------------------------------------------------*/
    doesAdjusterApplyWithRegions(
        gridTry: Grid,
        game: IBracketGame,
        column: number): [boolean, RangeInfo, RangeInfo, RangeInfo]
    {
        let f: boolean = false;

        let [source1, source2, outgoing] = gridTry.getRangeInfoForGameFeederItemConnectionPoints(game);
        [source1, source2, f] = Grid.normalizeSources(source1, source2, f);

        if (outgoing != null)
            return [false, null, null, null];

        if (source1 == null || source2 == null)
            return [false, null, null, null];

        if (!gridTry.doesSourceOverlapAreaRangeOverlap(source1, source2, column).overlaps)
            return [false, null, null, null];

        const [region1, region2, region3] = this.getRegionsForSources(gridTry, source1, source2);

        if (region1 == null)
            return [false, null, null, null];

        return [true, region1, region2, region3];
    }

    getRegionsForSources(
        gridTry: Grid,
        source1: RangeInfo,
        source2: RangeInfo): [RangeInfo, RangeInfo, RangeInfo]
    {
        const region1: RangeInfo = this.getRegionAroundSource(gridTry, source1, true);
        const region3: RangeInfo = this.getRegionAroundSource(gridTry, source2, true);

        // two calculated regions aren't independent of each other
        if (RangeInfo.isOverlapping(region1, region3) != RangeOverlapKind.None)
            return [null, null, null];

        // only a single line between the regions. cannot have an intervening region
        if (region3.FirstRow - region1.LastRow < 4)
            return [null, null, null];

        const region2: RangeInfo = RangeInfo.createFromCorners(
            region1.bottomLeft().offset(2, 1, 0, 1),
            region3.topRight().offset(-2, 1, 0, 1));

        if (gridTry.doesRangeOverlap(region2) == RangeOverlapKind.None)
        {
            // there are no items in region2 -- we would be swapping
            // empty space
            return [null, null, null];
        }

        if (!gridTry.isRangeIndependent(region2))
            throw new Error("how is the middle region not independent?!");

        return [region1, region2, region3];
    }

    /*----------------------------------------------------------------------------
        %%Function: Adjuster_SwapGameRegonsForOverlap.doAdjustment

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
        let [doesApply, region1, region2, region3] = this.doesAdjusterApplyWithRegions(grid, game, column);

        if (!doesApply)
            return false;

        // ok, swap region2 and region3
        let gridTry: Grid = grid.clone();

        if (!RegionSwapper.canRegionsSwap(gridTry, region2, region3))
            return false;

        RegionSwapper.swapRegions(gridTry, region2, region3);

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

    static testSwapRegionsForGameOverlap(appContext: IAppContext, testContext: UnitTestContext)
    {
        appContext;
        testContext.StartTest("Adjuster_SwapGameRegonsForOverlap. testSwapRegionsForGameOverlap");

        let grid: Grid = new Grid();
        grid.m_firstGridPattern = new RangeInfo(9, 1, 6, 1);

        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 6, 23, 8), 1, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(27, 6, 37, 8), 2, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(41, 6, 51, 8), 3, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(55, 6, 65, 8), 4, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(69, 6, 79, 8), 5, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(83, 6, 93, 8), 6, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 9, 19, 11), 7, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(14, 12, 14, 17), -1, false);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(31, 9, 47, 11), 8, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(38, 12, 38, 17), -1, false);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(59, 9, 75, 11), 9, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(66, 12, 66, 17), -1, false);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(87, 9, 97, 11), 10, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(92, 12, 92, 17), -1, false);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(99, 12, 109, 14), 11, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(104, 15, 104, 20), -1, false);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(115, 12, 125, 14), 12, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(120, 15, 120, 20), -1, false);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(127, 15, 137, 17), 13, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(141, 15, 151, 17), 14, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(95, 21, 105, 23), 15, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(111, 21, 121, 23), 16, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 18, 39, 20), 17, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(65, 18, 93, 20), 18, false).inferGameInternals();

        // now try to insert game 19

        let game: IBracketGame = BracketGame.CreateFromGameSync("T14", new GameNum(19));

        let gridNew: Grid = grid.clone();
        let reqColumn: number = 21;

        GridAdjust.rearrangeGridForCommonConflicts(gridNew, game, reqColumn);

        // now verify that we have fixed the problem
        let [source1, source2, outgoing] = gridNew.getRangeInfoForGameFeederItemConnectionPoints(game);
        if (gridNew.doesSourceOverlapAreaRangeOverlap(source1, source2, reqColumn).overlaps)
        {
            throw new Error("testSwapRegionsForGameOverlap: FAILED: rearrange failed to resolve");
        }
    }
}