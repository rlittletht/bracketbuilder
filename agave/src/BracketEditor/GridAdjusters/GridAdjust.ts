import { Grid } from "../Grid";
import { RangeInfo, RangeOverlapKind } from "../../Interop/Ranges";
import { IBracketGame } from "../BracketGame";
import { GridItem } from "../GridItem";
import { IGridAdjuster } from "./IGridAdjuster";
import { RegionSwapper_BottomGame } from "./RegionSwapper_BottomGame";

export class GridAdjust
{
    /*----------------------------------------------------------------------------
        %%Function: GridAdjust.insertSpace_WantToGrowUpForTopGameInsert

        in this common case, we have a game that wants to insert at the top (feed
        in from the top game), and we would like to "grow up", but the top of
        the grid prevents us. Shift everything down to accommodate.
    ----------------------------------------------------------------------------*/
    static insertSpace_WantToGrowUpForTopGameInsert(
        grid: Grid,
        game: IBracketGame, // so we can reload the sources...
        source1: RangeInfo,
        source2: RangeInfo,
        column: number): boolean
    {
        grid;
        game;
        source1;
        source2;
        column;
        return false;
    }

    static adjusters: IGridAdjuster[] =
        [
        new RegionSwapper_BottomGame()
        ];

    /*----------------------------------------------------------------------------
        %%Function: Grid.rearrangeGridForCommonConflicts

        Find very specific conflicts and see if we can make a simple rearrangment
        to the games to make them fit.

        This can only be done when we are doing linear building of the bracket
        (i.e. there is no outgoing feed to match up with)
    ----------------------------------------------------------------------------*/
    static rearrangeGridForCommonConflicts(
        grid: Grid,
        game: IBracketGame, // so we can reload the sources...
        column: number)
    {
        for (let swapper of GridAdjust.adjusters)
        {
            swapper.doAdjustment(grid, game, column);
        }
    }
}