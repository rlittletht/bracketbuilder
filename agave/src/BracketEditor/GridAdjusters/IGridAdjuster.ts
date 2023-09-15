import { IBracketGame } from "../BracketGame";
import { Grid } from "../Grid";

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