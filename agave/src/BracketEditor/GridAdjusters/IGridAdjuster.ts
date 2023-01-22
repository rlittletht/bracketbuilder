import { Grid } from "../Grid";
import { IBracketGame } from "../BracketGame";
import { RangeInfo } from "../../Interop/Ranges";

export interface IGridAdjuster
{
    doesAdjusterApply(
        gridTry: Grid,
        game: IBracketGame,
        column: number): boolean;

    doAdjustment(
        grid: Grid,
        game: IBracketGame, // so we can reload the sources...
        column: number): boolean;
}