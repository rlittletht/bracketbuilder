import { IGridAdjuster } from "./IGridAdjuster";
import { Grid, AdjustRangeGrowExtraRow } from "../Grid";
import { GridItem } from "../GridItem";
import { RangeInfo, RangeOverlapKind } from "../../Interop/Ranges";
import { GridAdjust } from "./GridAdjust";
import { IBracketGame, BracketGame } from "../BracketGame";
import { RegionSwapper } from "./RegionSwapper";
import { IAppContext } from "../../AppContext";
import { GameNum } from "../GameNum";
import { UnitTestContext } from "../../taskpane/components/App";

// THIS ADJUSTER IS is for the insert of Game 16 on a 14 team bracket
// W12 and L10. Since L10 is unanchored, it just needs space to insert into
// but G13 prevents it from being inserted. Rather than adding empty space,
// G12 and G13 should be swapped (or rather, the regions they are in)
export class Adjuster_SwapAdjacentGameRegonsForOverlap implements IGridAdjuster
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
        const [doesApply, region1, region2] = this.doesAdjusterApplyWithRegions(gridTry, game, column);

        return doesApply;
    }

    /*----------------------------------------------------------------------------
        %%Function: Adjuster_SwapGameRegonsForOverlap.doesAdjusterApply

        In order to apply, we have to have:
        * at least one source defined
        * no outgoing
        * the regions are adjacent
          
    ----------------------------------------------------------------------------*/
    doesAdjusterApplyWithRegions(
        gridTry: Grid,
        game: IBracketGame,
        column: number): [boolean, RangeInfo, RangeInfo]
    {
        let f: boolean = false;

        let [source1, source2, outgoing] = gridTry.getFeederInfoForGame(game);
        [source1, source2, f] = Grid.normalizeSources(source1, source2, f);

        if (outgoing != null)
            return [false, null, null];

        if (source1 == null && source2 == null)
            return [false, null, null];

        // normalize to source1 as the match and grow down
        if (source1 == null)
        {
            source1 = source2;
            source2 = null;
        }

        if (!gridTry.doesSourceOverlapAreaRangeOverlap(source1, source2, column))
            return [false, null, null];

        if (source2 == null)
            source2 = new RangeInfo(source1.FirstRow + 11, 1, column, 1);

        const [region1, region2] = this.getAdjacentRegionsForSources(gridTry, source1, source2);

        if (region1 == null)
            return [false, null, null];

        return [true, region1, region2];
    }

    getAdjacentRegionsForSources(
        gridTry: Grid,
        source1: RangeInfo,
        source2: RangeInfo): [RangeInfo, RangeInfo]
    {
        const region1: RangeInfo = this.getRegionAroundSource(gridTry, source1, true);
        const region2: RangeInfo = this.getRegionAroundSource(gridTry, source2, true);

        // two calculated regions aren't independent of each other
        if (RangeInfo.isOverlapping(region1, region2) != RangeOverlapKind.None)
            return [null, null];

        // only a single line between the regions. cannot have an intervening region
        if (region2.FirstRow - region1.LastRow < 2)
            return [null, null];

        return [region1, region2];
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
        let [doesApply, region1, region2] = this.doesAdjusterApplyWithRegions(grid, game, column);

        if (!doesApply)
            return false;

        // ok, swap region2 and region3
        let gridTry: Grid = grid.clone();

        let cTriesRemaining: number = 5;

        // we may have several games we have to swap in order for the swaps to fix
        while (cTriesRemaining > 0)
        {
            RegionSwapper.adjustRegionsForAdjacency(gridTry, region1, region2);

            if (!RegionSwapper.canRegionsSwap(gridTry, region1, region2))
                return false;

            RegionSwapper.swapRegions(gridTry, region1, region2);

            // now, see if we still have an overlap problem. if we do, well, we failed...
            [doesApply, region1, region2] = this.doesAdjusterApplyWithRegions(gridTry, game, column);

            if (!doesApply)
                break;

            cTriesRemaining--;
        }

        if (doesApply)
        {
            console.log("failed to correct after max retries");
            return false;
        }

        // awesome, the swap helped
        grid.setInternalGridItems(gridTry.m_gridItems);
        gridTry.m_gridItems = null; // just to make sure nobody ever tries to use it!

        return true;
    }

    static testSwapAdjacentRegionsForGameOverlap(appContext: IAppContext, testContext: UnitTestContext)
    {
        appContext;
        testContext.StartTest("Adjuster_SwapGameRegonsForOverlap. testSwapAdjacentRegionsForGameOverlap");

        let grid: Grid = new Grid();
        grid.m_firstGridPattern = new RangeInfo(9, 1, 6, 1);

        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 6, 23, 8,), 1, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(27, 6, 37, 8,), 2, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(41, 6, 51, 8,), 3, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(55, 6, 65, 8,), 4, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(69, 6, 79, 8,), 5, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(83, 6, 93, 8,), 6, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 9, 19, 11,), 7, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(31, 9, 47, 11,), 8, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(59, 9, 75, 11,), 9, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(87, 9, 97, 11,), 10, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(101, 9, 111, 11,), 11, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(106, 12, 106, 14,), -1, false);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(117, 9, 127, 11,), 12, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(129, 12, 139, 14,), 13, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(143, 12, 153, 14,), 14, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(105, 15, 115, 17,), 15, false).inferGameInternals();

        // now try to insert game 16
        let game: IBracketGame = BracketGame.CreateFromGameSync("T14", new GameNum(15));

        let gridNew: Grid = grid.clone();
        let reqColumn: number = 15;

        GridAdjust.rearrangeGridForCommonConflicts(gridNew, game, reqColumn);

        // now verify that we have fixed the problem
        let [source1, source2, outgoing] = gridNew.getFeederInfoForGame(game);
        // source2 should be null
        if (source2 != null)
            throw Error("bracket definition unexpected");

        if (gridNew.doesSourceOverlapAreaRangeOverlap(source1, source2, reqColumn))
        {
            throw Error("testSwapAdjacentRegionsForGameOverlap: FAILED: rearrange failed to resolve");
        }
    }
}