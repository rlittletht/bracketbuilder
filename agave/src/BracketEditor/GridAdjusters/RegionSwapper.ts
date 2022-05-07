import { Grid } from "../Grid";
import { RangeInfo, RangeOverlapKind } from "../../Interop/Ranges";

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
        if (!gridTry.isRangeSelfContained(regionTop))
            return false;

        if (!gridTry.isRangeSelfContained(regionBottom))
            return false;

        // we also require a blank row between the top and bottom region
        let rangeBlankCheck: RangeInfo = regionBottom.offset(-3, 3, 0, 100).newSetColumn(1);
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
        %%Function: RegionSwapper.regionSwapper

        Perform the swap of the two regions. Assumes its valid.
    ----------------------------------------------------------------------------*/
    static regionSwapper(
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
        for (let i: number = 0; i < gridTry.m_gridItems.length; i++)
        {
            if (gridTry.m_gridItems[i].Range.FirstRow <= regionTop.LastRow)
            {
                gridTry.m_gridItems[i].shiftByRows(regionBottom.RowCount + 1);
            }
            else if (gridTry.m_gridItems[i].Range.FirstRow <= regionBottom.LastRow)
            {
                gridTry.m_gridItems[i].shiftByRows(-regionTop.RowCount - 1);
            }
        }
    }
}