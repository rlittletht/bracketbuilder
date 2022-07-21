import { RangeInfo, RangeOverlapKind } from "../../Interop/Ranges";
import { GridItem } from "../GridItem";
import { GridOption, GameMover } from "../GridAdjusters/GameMover";
import { Mover } from "./Mover";
import { Grid } from "../Grid";
import { IBracketGame, BracketGame } from "../BracketGame";
import { GameId } from "../GameId";

export class FeederDrag
{
    static checkAndDragByOutgoingFeeder(gameMover: GameMover, mover: Mover, optionWork: GridOption, crumbs: string): boolean
    {
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

        // if the connected item is already a game, great, pass through
        // otherwise, figure out who the line is connected to...
        let [connectedGame, kindGame] =
            (connectedItem == null || kindConnected == RangeOverlapKind.None || !connectedItem.isLineRange)
                ? [connectedItem, kindConnected]
                : optionWork.grid.getFirstOverlappingItem(connectedItem.Range.offset(0, 1, connectedItem.Range.ColumnCount, 1));

        const game: IBracketGame = mover.ItemNew.isLineRange ? null : BracketGame.CreateFromGameSync(mover.Bracket, mover.ItemNew.GameId.GameNum);

        if (connectedGame == null || connectedGame.isLineRange || !GameId.compare(connectedGame.GameId, game.WinningTeamAdvancesToGameId))
            return changed;

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
        changed = mover.moveRecurse(gameMover, optionWork, true, connectedGame, connectedGame.clone().shiftByRows(dRows), "checkAndDragByOutgoingFeeder_shift", crumbs) || changed;
        changed = mover.moveRecurse(gameMover, optionWork, false, connectedGame, connectedGame.clone().growShrink(dRows), "checkAndDragByOutgoingFeeder_growShrink", crumbs) || changed;

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
        changed = mover.moveRecurse(gameMover, optionWork, true, connectedGame, connectedGame.clone().shiftByRows(dRows), "checkAndDragByTopIncomingFeed_shiftDown", crumbs) || changed;
        changed = mover.moveRecurse(gameMover, optionWork, true, connectedGame, connectedGame.clone().growShrinkFromTop(-dRows * 2), "checkAndDragByTopIncomingFeed_growShrinkFromTop", crumbs) || changed;
        changed = mover.moveRecurse(gameMover, optionWork, false, connectedGame, connectedGame.clone().growShrink(dRows * 2), "checkAndDragByTopIncomingFeed_growShrink", crumbs) || changed;

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
        changed = mover.moveRecurse(gameMover, optionWork, true, connectedGame, connectedGame.clone().shiftByRows(dRows), "checkAndDragByBottomIncomingFeed_shift", crumbs) || changed;
        changed = mover.moveRecurse(gameMover, optionWork, true, connectedGame, connectedGame.clone().growShrinkFromTop(-dRows * 2), "checkAndDragByBottomIncomingFeed_growShrinkFromTop", crumbs) || changed;
        changed = mover.moveRecurse(gameMover, optionWork, false, connectedGame, connectedGame.clone().growShrink(dRows * 2), "checkAndDragByBottomIncomingFeed_growShrink", crumbs) || changed;

        return changed;
    }
}
