import { RangeInfo, RangeOverlapKind } from "../../Interop/Ranges";
import { GridItem } from "../GridItem";
import { GridOption, GameMover } from "../GameMover";
import { Mover } from "./Mover";
import { Grid } from "../Grid";
import { IBracketGame, BracketGame } from "../BracketGame";
import { GameId } from "../GameId";

export class FeederDrag
{
    static adjustItemForOverlappingGrowth(connectedAtTop: boolean, itemNew: GridItem, adjusted: GridItem)
    {
        if (adjusted.IsChampionshipGame)
            return;

        // check to see if we are now overlapping
        if (connectedAtTop)
        {
            let shortBy = itemNew.Range.LastRow - adjusted.Range.LastRow + 2;
            shortBy = shortBy + (shortBy % 2); // round up to 2

            // check the bottom range
            if (shortBy > 0)
                adjusted.growShrink(shortBy);
        }
        else
        {
            let shortBy = adjusted.Range.FirstRow - itemNew.Range.FirstRow + 2;
            shortBy = shortBy + (shortBy % 2); // round up to 2

            // check the bottom range
            if (shortBy > 0)
                adjusted.growShrinkFromTop(shortBy);
        }
    }

    /*----------------------------------------------------------------------------
        %%Function: FeederDrag.checkAndDragByOutgoingFeeder

        two options to consider:
        1) shift the connected item to remain connected
        2) grow/shrink the connected item to remain connected

        if this item is growing and requiring the change, we might have to grow
        the connected item to avoid overlapping
    ----------------------------------------------------------------------------*/
    static checkAndDragByOutgoingFeeder(gameMover: GameMover, mover: Mover, optionWork: GridOption, crumbs: string): boolean
    {
        if (mover.ItemNew.IsChampionshipGame || mover.ItemOld.IsChampionshipGame)
            return false;

        const growing = mover.ItemOld.Range.RowCount < mover.ItemNew.Range.RowCount;

        let changed = false;

        // now, see if our move changed the location of our outgoing feed point
        if (mover.ItemOld.isLineRange)
            return changed;

        const outgoingPointOld: RangeInfo = mover.ItemOld.OutgoingFeederPoint;
        const outgoingPointNew: RangeInfo = mover.ItemNew.OutgoingFeederPoint;
        const dRows: number = outgoingPointNew.FirstRow - outgoingPointOld.FirstRow;

        if (dRows == 0)
            return changed;

        // see if we actually are connected to anyone
        let [connectedItem, kindConnected] = optionWork.grid.getFirstOverlappingItem(outgoingPointOld);
        let connectedAtTop = false;

        if (!connectedItem)
            return changed;

        // at this point we know we *were* properly connected...

        // if the connected item is already a game, great, pass through
        // otherwise, figure out who the line is connected to...
        let [connectedGame, kindGame] =
            (connectedItem == null || kindConnected == RangeOverlapKind.None || !connectedItem.isLineRange)
                ? [connectedItem, kindConnected]
                : optionWork.grid.getFirstOverlappingItem(connectedItem.Range.offset(0, 1, connectedItem.Range.ColumnCount, 1));

        const game: IBracketGame = mover.ItemNew.isLineRange ? null : BracketGame.CreateFromGameSync(mover.Bracket, mover.ItemNew.GameId.GameNum);

        if (connectedGame == null || connectedGame.isLineRange || !GameId.compare(connectedGame.GameId, game.WinningTeamAdvancesToGameId))
            return changed;

        // make sure we are actually connected to one of the feeders on the game
        if (connectedGame.TopTeamRange.offset(1, 1, 0, 1).FirstRow == outgoingPointOld.FirstRow)
        {
            connectedAtTop = true;
        }
        else
        {
            if (connectedGame.IsChampionshipGame
                || connectedGame.BottomTeamRange.offset(-1, 1, 0, 1).LastRow != outgoingPointOld.FirstRow)
            {
                // we weren't connected properly at the top and we're not connected properly at the bottom.
                // don't do this adjustment
                return changed;
            }
        }

        // we have a game connected to us and we now have to "drag it along"
        if (connectedItem.isLineRange)
        {
            // move the line range
            connectedItem.shiftByRows(dRows);
        }

        // Maybe check to make sure the connected game is connected at the right place? right now we
        // just accept our line (or our connection point) overlapping any part of the connected game

        // now we can either move the connected game, or we can grow/shrink it to make it work
        // do both and add them to the options. the ranker will figure out which is better

        const overMoves: boolean = gameMover.ExceededMoveCount;
        const shifted = connectedGame.clone().shiftByRows(dRows);

        if (growing)
            FeederDrag.adjustItemForOverlappingGrowth(connectedAtTop, mover.ItemNew, shifted);

        // don't do this move if we don't remain connected
        if ((connectedAtTop && outgoingPointNew.FirstRow == shifted.TopTeamRange.offset(1, 1, 0, 1).FirstRow)
            || (!connectedAtTop && outgoingPointNew.FirstRow == shifted.BottomTeamRange.offset(-1, 1, 0, 1).FirstRow))
        {
            changed = mover.moveRecurse(gameMover, optionWork, true, connectedGame, shifted, "checkAndDragByOutgoingFeeder_shift", `${crumbs}.1`) || changed;

            if (!overMoves && gameMover.ExceededMoveCount)
                gameMover.RequestExtraMoves();
        }

        if (!connectedGame.IsChampionshipGame)
        {
            let grownShrunk: GridItem;

            if (connectedAtTop)
            {
                if (dRows > 0)
                {
                    // if dRows > 0, then we need to shrink this game and shift it by dRows
                    grownShrunk = connectedGame.clone().growShrink(-dRows).shiftByRows(dRows);
                }
                else
                    // else, we have to grow and shift up by dRows
                    grownShrunk = connectedGame.clone().growShrink(-dRows).shiftByRows(dRows);
            }
            else
            {
                // if we are connected at the bottom...
                if (dRows > 0)
                    // we have to grow the game...
                    grownShrunk = connectedGame.clone().growShrink(dRows);
                else
                    // we have to shrink the game
                    grownShrunk = connectedGame.clone().growShrink(dRows);
            }

            if (growing)
                FeederDrag.adjustItemForOverlappingGrowth(connectedAtTop, mover.ItemNew, grownShrunk);

            if ((connectedAtTop && outgoingPointNew.FirstRow == grownShrunk.TopTeamRange.offset(1, 1, 0, 1).FirstRow)
                || (!connectedAtTop && outgoingPointNew.FirstRow == grownShrunk.BottomTeamRange.offset(-1, 1, 0, 1).FirstRow))
            {
                changed = mover.moveRecurse(gameMover, optionWork, true, connectedGame, grownShrunk, "checkAndDragByOutgoingFeeder_growShrink", `${crumbs}.2`) || changed;
            }
        }

        return changed;
    }

    static checkAndDragByTopIncomingFeed(gameMover: GameMover, mover: Mover, optionWork: GridOption, crumbs: string): boolean
    {
        let changed = false;

        // now, see if our move changed the location of our outgoing feed point
        if (mover.ItemOld.isLineRange)
            return changed;

        const incomingPointOld: RangeInfo = mover.ItemOld.TopTeamRange.offset(1, 1, -1, 1);
        const incomingPointNew: RangeInfo =
            FeederDrag.hasItemBeenSwappedInGridOption(optionWork, mover.ItemNew)
                ? mover.ItemNew.BottomTeamRange.offset(-1, 1, -1, 1)
                : mover.ItemNew.TopTeamRange.offset(1, 1, -1, 1);
        const dRows: number = incomingPointNew.FirstRow - incomingPointOld.FirstRow;

        if (dRows == 0)
            return changed;

        // see if we actually are connected to anyone
        let [connectedItem, kindConnected] = optionWork.grid.getFirstOverlappingItem(incomingPointOld);

        // if the connected item is already a game, great, pass through
        // otherwise, figure out who the line is connected to...
        let [connectedGame, kindGame] =
            (connectedItem == null || kindConnected == RangeOverlapKind.None || !connectedItem.isLineRange)
                ? [connectedItem, kindConnected]
                : optionWork.grid.getFirstOverlappingItem(connectedItem.Range.offset(0, 1, -1, 1));

        if (connectedGame == null || connectedGame.isLineRange)
            return changed;

        const gameConnected: IBracketGame = BracketGame.CreateFromGameSync(mover.Bracket, connectedGame.GameId.GameNum);

        if (!GameId.compare(gameConnected.WinningTeamAdvancesToGameId, mover.ItemNew.GameId))
            return changed;

        // we have a game connected to us and we now have to "drag it along"
        if (connectedItem.isLineRange)
        {
            // move the line range
            connectedItem.shiftByRows(dRows);
        }

        // Maybe check to make sure the connected game is connected at the right place? right now we
        // just accept our line (or our connection point) overlapping any part of the connected game

        // we have several options for the connected game. Grow the game down, or move the game
        changed = mover.moveRecurse(gameMover, optionWork, true, connectedGame, connectedGame.clone().shiftByRows(dRows), "checkAndDragByTopIncomingFeed_shiftDown", `${crumbs}.1`) || changed;
        changed = mover.moveRecurse(gameMover, optionWork, true, connectedGame, connectedGame.clone().growShrinkFromTop(-dRows * 2), "checkAndDragByTopIncomingFeed_growShrinkFromTop", `${crumbs}.2`) || changed;
        changed = mover.moveRecurse(gameMover, optionWork, true, connectedGame, connectedGame.clone().growShrink(dRows * 2), "checkAndDragByTopIncomingFeed_growShrink", `${crumbs}.3`) || changed;

        return changed;
    }

    /*----------------------------------------------------------------------------
        %%Function: FeederDrag.hasItemBeenSwappedInGridOption

        Its possible this gridOption has swapped top/bottom as one of its steps.
        detect that and return
    ----------------------------------------------------------------------------*/
    static hasItemBeenSwappedInGridOption(optionWork: GridOption, itemNew: GridItem): boolean
    {
        const match: GridItem = GameMover.getMatchingItem(optionWork, itemNew, itemNew.GameId);

        return (itemNew.SwapTopBottom != match.SwapTopBottom);
    }

    static checkAndDragByBottomIncomingFeed(gameMover: GameMover, mover: Mover, optionWork: GridOption, crumbs: string): boolean
    {
        if (mover.ItemNew.IsChampionshipGame || mover.ItemOld.IsChampionshipGame)
            return false;

        let changed = false;

        // now, see if our move changed the location of our outgoing feed point
        if (mover.ItemOld.isLineRange)
            return changed;

        const incomingPointOld: RangeInfo = mover.ItemOld.BottomTeamRange.offset(-1, 1, -1, 1);

        const incomingPointNew: RangeInfo =
            FeederDrag.hasItemBeenSwappedInGridOption(optionWork, mover.ItemNew)
                ? mover.ItemNew.TopTeamRange.offset(1, 1, -1, 1)
                : mover.ItemNew.BottomTeamRange.offset(-1, 1, -1, 1);
        const dRows: number = incomingPointNew.FirstRow - incomingPointOld.FirstRow;

        if (dRows == 0)
            return changed;

        // see if we actually are connected to anyone
        let [connectedItem, kindConnected] = optionWork.grid.getFirstOverlappingItem(incomingPointOld);

        // if the connected item is already a game, great, pass through
        // otherwise, figure out who the line is connected to...
        let [connectedGame, kindGame] =
            (connectedItem == null || kindConnected == RangeOverlapKind.None || !connectedItem.isLineRange)
                ? [connectedItem, kindConnected]
                : optionWork.grid.getFirstOverlappingItem(connectedItem.Range.offset(0, 1, -1, 1));

        if (connectedGame == null || connectedGame.isLineRange)
            return changed;

        const gameConnected: IBracketGame = BracketGame.CreateFromGameSync(mover.Bracket, connectedGame.GameId.GameNum);

        if (!GameId.compare(gameConnected.WinningTeamAdvancesToGameId, mover.ItemNew.GameId))
            return changed;

        // we have a game connected to us and we now have to "drag it along"
        if (connectedItem.isLineRange)
        {
            // move the line range
            connectedItem.shiftByRows(dRows);
        }

        // Maybe check to make sure the connected game is connected at the right place? right now we
        // just accept our line (or our connection point) overlapping any part of the connected game

        // we have several options for the connected game. Grow the game down, or move the game
        changed = mover.moveRecurse(gameMover, optionWork, true, connectedGame, connectedGame.clone().shiftByRows(dRows), "checkAndDragByBottomIncomingFeed_shift", `${crumbs}.1`) || changed;
        changed = mover.moveRecurse(gameMover, optionWork, true, connectedGame, connectedGame.clone().growShrinkFromTop(-dRows * 2), "checkAndDragByBottomIncomingFeed_growShrinkFromTop", `${crumbs}.2`) || changed;
        changed = mover.moveRecurse(gameMover, optionWork, true, connectedGame, connectedGame.clone().growShrink(dRows * 2), "checkAndDragByBottomIncomingFeed_growShrink", `${crumbs}.3`) || changed;

        return changed;
    }
}
