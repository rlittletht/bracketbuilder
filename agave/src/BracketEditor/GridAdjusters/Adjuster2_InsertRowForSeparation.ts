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
        const [region1, region2] = this.regionsCalculate(gridTry, gameInsert);

        if (gridTry.isRangeIndependent(region1))
        {
            if (!gridTry.isBlankRow(region1.LastRow))
                return true;
        }
        if (gridTry.isRangeIndependent(region2))
        {
            if (!gridTry.isBlankRow(region2.LastRow + 1))
                return true;
        }

        return false;
    }

    regionsCalculate(gridTry: Grid, gameInsert: GridGameInsert): [RangeInfo, RangeInfo]
    {
        const region1: RangeInfo = RangeInfo.createFromCorners(
            gridTry.FirstGridPattern,
            gameInsert.Range.topLeft().offset(0, 1, 1000, 1));

        const region2: RangeInfo = RangeInfo.createFromCorners(
            gridTry.FirstGridPattern,
            gameInsert.Range.bottomRight().offset(-1, 1, 0, 1).newSetColumn(1000));

        return [region1, region2];
    }

    doAdjustment(
        grid: Grid,
        gameInsert: GridGameInsert,
        rangesAdjust: RangeInfo[]): boolean
    {
        if (!this.doesAdjusterApply(grid, gameInsert))
            return false;

        let [region1, region2] = this.regionsCalculate(grid, gameInsert);
        let gridTry: Grid = null;

        if (grid.isRangeIndependent(region1))
        {
            if (!grid.isBlankRow(region1.LastRow))
            {
                gridTry = grid.clone();

                Spacer.insertRowSpaceBefore(gridTry, region1.LastRow + 2, 2);
                grid.setInternalGridItems(gridTry.m_gridItems);
                // adjust any additional ranges
                for (let range of rangesAdjust)
                {
                    if (range.LastRow >= region1.LastRow + 2)
                        range.shiftByRows(2);
                }
                return true;
            }
        }

        // if we got here, then region2 is where we want to insert. 
        if (!grid.isRangeIndependent(region2)
            || grid.isBlankRow(region2.LastRow + 1))
        {
            // our preflight should guarantee that the other clause either
            // succeeds, or this is gauranteed to be the one we want to do
            throw Error("illegal internal state. should not have gotten here");
        }
        gridTry = grid.clone();

        Spacer.insertRowSpaceBefore(gridTry, region2.LastRow + 1, 2);
        grid.setInternalGridItems(gridTry.m_gridItems);
        for (let range of rangesAdjust)
        {
            if (range.LastRow >= region2.LastRow + 1)
                range.shiftByRows(2);
        }
        return true;
    }

}