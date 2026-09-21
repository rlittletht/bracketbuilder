import { GridItem } from "../GridItem";
import { Grid } from "../Grid";
import { IBracketGame } from "../BracketGame";
import { GridOption } from "./GameMover";

export interface IGameMover
{
    ExceededMoveCount: boolean;
    Warning: string;

    moveGame(itemOld: GridItem, itemNew: GridItem, bracket: string): Grid;
    moveGameInternal(
        working: GridOption,
        itemOld: GridItem,
        itemNew: GridItem,
        bracket: string,
        crumb: string): {options: GridOption[], tree?: Map<string, GridOption>}

    RequestExtraMoves(): void;
    SetWarning(warning: string): void;
}