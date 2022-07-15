import { RangeInfo, RangeOverlapKind } from "../../Interop/Ranges";
import { GridItem } from "../GridItem";
import { GridOption, GameMover } from "../GridAdjusters/GameMover";
import { Mover } from "./Mover";
import { Grid } from "../Grid";
import { BracketGame, IBracketGame } from "../BracketGame";

export class TopBottomSwapper
{
    /*----------------------------------------------------------------------------
        %%Function: PushAway.checkAndMoveItemsAway

        This module will determine when the moved item land on (or too close to)
        another item, and moves that item away.

        this checks only for game items and should be the most aggressive about
        pushing away since it is checking only direct overlaps in the target
        column

        this does not move any connected items -- that's the responsibility of
        the dragging modules
    ----------------------------------------------------------------------------*/
    static checkAndSwapTopBottom(gameMover: GameMover, mover: Mover, optionWork: GridOption)
    {
        gameMover;
        // check to see if the old and the new linkages work by swapping top and bottom

        // get the connected gridItems for the old item location
        const game: IBracketGame = BracketGame.CreateFromGameSync(mover.Bracket, mover.ItemOld.GameId.GameNum);
        const [item1, item2] = optionWork.grid.getConnectedGridItemsForGameFeeders(mover.ItemOld, game);
        const [source1, source2, outgoing] = optionWork.grid.getRangeInfoForGameFeederItemConnectionPoints(game);

        // now figure out if the new item would continue to be connected if we just swapped top/bottom
        
        if (source1 != null)
        {
            if ((mover.ItemOld.TopTeamRange.FirstRow + 1 == source1.FirstRow
                    && mover.ItemNew.BottomTeamRange.FirstRow - 1 == source1.FirstRow)
                || (mover.ItemOld.BottomTeamRange.LastRow - 1 == source1.FirstRow
                    && mover.ItemNew.TopTeamRange.FirstRow + 1 == source1.FirstRow))
            {
                mover.doChange(optionWork, true, mover.ItemNew, mover.ItemNew.clone().doSwapTopBottom());
                return;
            }
        }

        if (source2 != null)
        {
            if ((mover.ItemOld.TopTeamRange.FirstRow + 1 == source2.FirstRow
                    && mover.ItemNew.BottomTeamRange.FirstRow - 1 == source2.FirstRow)
                || (mover.ItemOld.BottomTeamRange.LastRow - 1 == source2.FirstRow
                    && mover.ItemNew.TopTeamRange.FirstRow + 1 == source2.FirstRow))
            {
                mover.doChange(optionWork, true, mover.ItemNew, mover.ItemNew.clone().doSwapTopBottom());
                return;
            }
        }
    }
}