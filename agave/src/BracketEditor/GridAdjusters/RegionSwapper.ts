import { Grid } from "../Grid";
import { RangeInfo, RangeOverlapKind } from "../../Interop/Ranges";
import { GridItem } from "../GridItem";

export class RegionSwapper
{
    /*----------------------------------------------------------------------------
        %%Function: RegionSwapper.canRegionsSwap

        Can the two given regions swap?
    ----------------------------------------------------------------------------*/
    static canRegionsSwap(
        gridTry: Grid,
        regionTop: RangeInfo,
        regionBottom: RangeInfo)
    {
        if (!gridTry.isRangeIndependent(regionTop))
            return false;

        if (!gridTry.isRangeIndependent(regionBottom))
            return false;

        // we also require a blank row between the top and bottom region
        let rangeBlankCheck: RangeInfo = regionBottom.offset(-1, 1, 0, 100).newSetColumn(1);
        if (gridTry.doesRangeOverlap(rangeBlankCheck) != RangeOverlapKind.None)
            return false;

        // and we require that the two regions are adjacent
        if (regionTop.LastRow + 1 != regionBottom.FirstRow
            && regionTop.LastRow + 2 != regionBottom.FirstRow)
        {
            return false;
        }

        return true;
    }

    /*----------------------------------------------------------------------------
        %%Function: RegionSwapper.adjustRegionsForAdjacency

        Regions need to be adjacent for swapping. If two regions are separated
        by empty space, then absorb the empty space into the top region
    ----------------------------------------------------------------------------*/
    static adjustRegionsForAdjacency(
        gridTry: Grid,
        regionTop: RangeInfo,
        regionBottom: RangeInfo)
    {
        // check if they are already adjacent
        if (regionTop.LastRow + 1 == regionBottom.FirstRow
            || regionTop.LastRow + 2 == regionBottom.FirstRow)
        {
            return;
        }

        const regionBetween: RangeInfo =
            RangeInfo.createFromCorners(
                regionTop.bottomLeft().shiftByRows(2),
                regionBottom.topRight().shiftByRows(-2));

        // if the region isn't empty...
        if (gridTry.doesRangeOverlap(regionBetween) != RangeOverlapKind.None)
            return;

        regionTop.setLastRow(regionBottom.FirstRow - 2);
    }

    /*----------------------------------------------------------------------------
        %%Function: RegionSwapper.swapRegions

        Perform the swap of the two regions. Assumes its valid.
    ----------------------------------------------------------------------------*/
    static swapRegions(
        gridTry: Grid,
        regionTop: RangeInfo,
        regionBottom: RangeInfo)
    {
        // now, swap regionTop with regionBottom

        // well, we implemented a very clever region swap. but that's not what we wanted.
        // we want 3 regions. region 1 & 2 swap, and region 3 stays the same.  region 2
        // needs to be the last item inthe first column (lastItem from above).

        // all 3 regions shoudl be distinct.  and region 1 and 2 swap just as we had, but everything
        // in region3 (the distinct region after the last item in column 1) has to remain unchanged.
        // ok, we have a clear break between the regions. shift one set down and the others up

        // now, swap regionTop with regionBottom

        // since we know there is a clear break between the regions, there is no chance
        // a range overlaps the two regions. So, we only need to check the first row.

        // these aren't difficult calculations, but the names help make things
        // clear
        const topRegionRowDelta: number = regionBottom.RowCount - regionTop.RowCount;
        const newBottomRegionFirstRow: number = regionBottom.FirstRow + topRegionRowDelta;

        for (let i: number = 0; i < gridTry.m_gridItems.length; i++)
        {
            let item: GridItem = gridTry.m_gridItems[i];

            if (item.Range.LastRow < regionTop.FirstRow)
            {
                continue;
            }
            else if (RangeInfo.isOverlappingRows(item.Range, regionTop))
            {
                // we are in the top region. we now want to be in the bottom
                // region
                item.rebase(regionTop.FirstRow, newBottomRegionFirstRow);
            }
            else if (RangeInfo.isOverlappingRows(item.Range, regionBottom))
            {
                // we are in the bottom region. we now want to be in the top
                // region
                // can't just rebase the game range -- what about the rest of the
                // ranges in the item?!?
                item.rebase(regionBottom.FirstRow, regionTop.FirstRow);
            }
            else if (item.Range.FirstRow < regionBottom.FirstRow)
            {
                // we are before the bottom region, but (by exclusion)
                // we aren't in the top region or before the top region.
                // move us down by the change in the top region
                item.shiftByRows(topRegionRowDelta);
            }
            // if we are after the last region, there's nothing to do...
        }
    }
}