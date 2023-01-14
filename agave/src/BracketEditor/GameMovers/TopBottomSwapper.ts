import { RangeInfo, RangeOverlapKind } from "../../Interop/Ranges";
import { GridItem } from "../GridItem";
import { GridOption, GameMover } from "../GridAdjusters/GameMover";
import { Mover } from "./Mover";
import { Grid } from "../Grid";
import { BracketGame, IBracketGame } from "../BracketGame";

export class TopBottomSwapper
{
    /*----------------------------------------------------------------------------
        %%Function: TopBottomSwapper.checkAndSwapTopBottom
    ----------------------------------------------------------------------------*/
    static checkAndSwapTopBottom(gameMover: GameMover, mover: Mover, optionWork: GridOption, crumbs: string): boolean
    {
        gameMover;
        crumbs;
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
                mover.doChange(optionWork, true, mover.ItemNew, mover.ItemNew.clone().doSwapTopBottom(), "checkAndSwapTopBottom");
                return true;
            }
        }

        if (source2 != null)
        {
            if ((mover.ItemOld.TopTeamRange.FirstRow + 1 == source2.FirstRow
                    && mover.ItemNew.BottomTeamRange.FirstRow - 1 == source2.FirstRow)
                || (mover.ItemOld.BottomTeamRange.LastRow - 1 == source2.FirstRow
                    && mover.ItemNew.TopTeamRange.FirstRow + 1 == source2.FirstRow))
            {
                mover.doChange(optionWork, true, mover.ItemNew, mover.ItemNew.clone().doSwapTopBottom(), "checkAndSwapTopBottom");
                return true;
            }
        }
        return false;
    }

    /*----------------------------------------------------------------------------
        %%Function: TopBottomSwapper.TopBottomSwapper.

        Check the outgoing feed of the old location. If it is attached to an
        item, check that item to see if we need to swap top/bottom on that item
        to keep it correct
    ----------------------------------------------------------------------------*/
    static checkOutgoingFeedAndMaybeSwapTopBottomTarget(gameMover: GameMover, mover: Mover, optionWork: GridOption, crumbs: string): boolean
    {
        gameMover;
        crumbs;
        // check to see if the old and the new linkages work by swapping top and bottom

        // get the connected gridItems for the old item location
        const game: IBracketGame = BracketGame.CreateFromGameSync(mover.Bracket, mover.ItemOld.GameId.GameNum);
        const outgoing: GridItem = optionWork.grid.getConnectedGridItemForGameResult(game);

        // now figure out if the new item would continue to be connected if we just swapped top/bottom
        if (outgoing != null)
        {
            const gameOut: IBracketGame = BracketGame.CreateFromGameSync(mover.Bracket, outgoing.GameId.GameNum);
            const gameOutItem: GridItem = optionWork.grid.findGameItem(gameOut.GameId);

            if (mover.ItemOld.OutgoingFeederPoint.FirstRow == gameOutItem.TopTeamRange.FirstRow + 1
                && mover.ItemNew.OutgoingFeederPoint.FirstRow == gameOutItem.BottomTeamRange.FirstRow - 1)
            {
                mover.doChange(optionWork, true, gameOutItem, gameOutItem.clone().doSwapTopBottom(), "checkOutgoingFeedAndMaybeSwapTopBottomTarget");
                return true;
            }

            if (mover.ItemOld.OutgoingFeederPoint.FirstRow == gameOutItem.BottomTeamRange.FirstRow - 1
                && mover.ItemNew.OutgoingFeederPoint.FirstRow == gameOutItem.TopTeamRange.FirstRow + 1)
            {
                mover.doChange(optionWork, true, gameOutItem, gameOutItem.clone().doSwapTopBottom(), "checkOutgoingFeedAndMaybeSwapTopBottomTarget");
                return true;
            }
        }

        return false;
    }
}