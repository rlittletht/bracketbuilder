import { Grid } from "../Grid";
import { IBracketGame } from "../BracketGame";
import { RangeInfo } from "../../Interop/Ranges";
import { GridGameInsert } from "../GridGameInsert";

export interface IGridAdjuster2
{
    doesAdjusterApply(
        gridTry: Grid,
        gameInsert: GridGameInsert): boolean;

    doAdjustment(
        grid: Grid,
        gameInsert: GridGameInsert,
        rangesAdjust: RangeInfo[]): boolean;
}