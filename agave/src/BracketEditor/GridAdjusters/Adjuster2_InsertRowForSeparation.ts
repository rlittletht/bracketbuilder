import { IGridAdjuster2 } from "./IGridAdjuster2";
import { Grid } from "../Grid";
import { GridGameInsert } from "../GridGameInsert";
import { RangeInfo, RangeOverlapKind } from "../../Interop/Ranges";
import { Spacer } from "./Spacer";

/*----------------------------------------------------------------------------
    Adjuster2_InsertRowForSeparation.Adjuster2_InsertRowForSeparation 

    this will detect cases where the inserted game is going to crowd an
    existing item on the grid, and would benefit from a row being insert
    immediately before or after the game we are trying to insert.
----------------------------------------------------------------------------*/
export class Adjuster2_InsertRowForSeparation implements IGridAdjuster2
{
    doesAdjusterApply(
        gridTry: Grid,
        gameInsert: GridGameInsert): boolean
    {
        const [regionIncludingTop, regionIncludingBottom] = this.regionsCalculate(gridTry, gameInsert);
        let fTopIndependent = gridTry.isRangeIndependent(regionIncludingTop);
        let fBottomIndependent = gridTry.isRangeIndependent(regionIncludingBottom)
            && !gridTry.isBlankRow(regionIncludingBottom.LastRow + 1);

        // if the top conflicts, return true if we can grow above or below
        if (!gridTry.isRowEmptyAround(regionIncludingTop.LastRow, gameInsert.Range.FirstColumn))
            return fTopIndependent || fBottomIndependent;

        if (!gridTry.isRowEmptyAround(regionIncludingBottom.LastRow + 1, gameInsert.Range.FirstColumn))
            return fBottomIndependent; // consider: do we want to allow if we can adjust top?

        return false;
    }

    regionsCalculate(gridTry: Grid, gameInsert: GridGameInsert): [RangeInfo, RangeInfo]
    {
        const regionIncludingTop: RangeInfo = RangeInfo.createFromCorners(
            gridTry.FirstGridPattern,
            gameInsert.Range.topLeft().offset(0, 1, 1000, 1));

        const regionIncludingBottom: RangeInfo = RangeInfo.createFromCorners(
            gridTry.FirstGridPattern,
            gameInsert.Range.bottomRight().offset(-1, 1, 0, 1).newSetColumn(1000));

        return [regionIncludingTop, regionIncludingBottom];
    }

    doAdjustment(
        grid: Grid,
        gameInsert: GridGameInsert,
        rangesAdjust: RangeInfo[]): boolean
    {
        if (!this.doesAdjusterApply(grid, gameInsert))
            return false;

        let [regionIncludingTop, regionIncludingBottom] = this.regionsCalculate(grid, gameInsert);
        let gridTry: Grid = null;
        const topWantsSpace = !grid.isBlankRow(regionIncludingTop.LastRow);
        const topIndependent = grid.isRangeIndependent(regionIncludingTop);
        const bottomIndependent = grid.isRangeIndependent(regionIncludingBottom)
            && !grid.isBlankRow(regionIncludingBottom.LastRow + 1);

        if (topIndependent)
        {
            // add space at the top if the top is independent AND the top
            // wants space OR the bottom isn't independent (we know that we need to 
            // add space and ideally it would be at the bottom, but we'll take the top
            // if we have to)
            if (topWantsSpace || !bottomIndependent)
            {
                gridTry = grid.clone();

                Spacer.insertRowSpaceBefore(gridTry, regionIncludingTop.LastRow + 2, 2);
                grid.setInternalGridItems(gridTry.m_gridItems);
                // adjust any additional ranges
                for (let range of rangesAdjust)
                {
                    if (range.LastRow >= regionIncludingTop.LastRow + 2)
                        range.shiftByRows(2);
                }
                return true;
            }
        }

        // if we got here, then regionIncludingBottom is where we want to insert. 
        if (!bottomIndependent)
        {
            // our preflight should guarantee that the other clause either
            // succeeds, or this is gauranteed to be the one we want to do
            throw Error("illegal internal state. should not have gotten here");
        }
        gridTry = grid.clone();

        Spacer.insertRowSpaceBefore(gridTry, regionIncludingBottom.LastRow + 1, 2);
        grid.setInternalGridItems(gridTry.m_gridItems);
        for (let range of rangesAdjust)
        {
            if (range.LastRow >= regionIncludingBottom.LastRow + 1)
                range.shiftByRows(2);
        }
        return true;
    }

}