import { GridItem } from "../GridItem";
import { Grid } from "../Grid";
import { IBracketGame } from "../BracketGame";
import { GridOption } from "./Mover";

export interface IGameMover
{
    ExceededMoveCount: boolean;
    Warning: string;
    OneOptionToRuleThemAll: boolean;

    /*----------------------------------------------------------------------------
        %%Function: moveGame
        %%Qualified: interface.moveGame

        Top level move game - this will handle setting up and ranking all the
        options created
    ----------------------------------------------------------------------------*/
    moveGame(itemOld: GridItem, itemNew: GridItem, bracket: string): Grid;

    /*----------------------------------------------------------------------------
        %%Function: moveGameInternal
        %%Qualified: interface.moveGameInternal

        This assumes we are already collecting options (if we are collecting) and
        will handle just this single game move
    ----------------------------------------------------------------------------*/
    moveGameInternal(
        working: GridOption,
        itemOld: GridItem,
        itemNew: GridItem,
        bracket: string,
        crumb: string): {options: GridOption[], tree?: Map<string, GridOption>}

    RequestExtraMoves(): void;
    SetWarning(warning: string): void;
}