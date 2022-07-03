import { RangeInfo, RangeOverlapKind } from "../../Interop/Ranges";
import { GridItem } from "../GridItem";
import { GridOption, GameMover } from "../GridAdjusters/GameMover";
import { Mover } from "./Mover";
import { Grid } from "../Grid";
import { IBracketGame, BracketGame } from "../BracketGame";
import { GameId } from "../GameId";

export class FeederDrag
{
    static checkAndDragByOutgoingFeeder(gameMover: GameMover, mover: Mover, optionWork: GridOption)
    {
        // now, see if our move changed the location of our outgoing feed point
        if (mover.ItemOld.isLineRange)
            return;

        const outgoingPointOld: RangeInfo = mover.ItemOld.OutgoingFeederPoint;
        const outgoingPointNew: RangeInfo = mover.ItemNew.OutgoingFeederPoint;
        const dRows: number = outgoingPointNew.FirstRow - outgoingPointOld.FirstRow;

        if (dRows == 0)
            return;

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
            return;

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
        mover.moveRecurse(gameMover, optionWork, true, connectedGame, connectedGame.clone().shiftByRows(dRows));
        mover.moveRecurse(gameMover, optionWork, false, connectedGame, connectedGame.clone().growShrink(dRows));
    }

    static checkAndDragByTopIncomingFeed(gameMover: GameMover, mover: Mover, optionWork: GridOption)
    {
        // now, see if our move changed the location of our outgoing feed point
        if (mover.ItemOld.isLineRange)
            return;

        const incomingPointOld: RangeInfo = mover.ItemOld.TopTeamRange.offset(1, 1, -1, 1);
        const incomingPointNew: RangeInfo = mover.ItemNew.TopTeamRange.offset(1, 1, -1, 1);
        const dRows: number = incomingPointNew.FirstRow - incomingPointOld.FirstRow;

        if (dRows == 0)
            return;

        // see if we actually are connected to anyone
        let [connectedItem, kindConnected] = optionWork.grid.getFirstOverlappingItem(incomingPointOld);

        // if the connected item is already a game, great, pass through
        // otherwise, figure out who the line is connected to...
        let [connectedGame, kindGame] =
            (connectedItem == null || kindConnected == RangeOverlapKind.None || !connectedItem.isLineRange)
                ? [connectedItem, kindConnected]
                : optionWork.grid.getFirstOverlappingItem(connectedItem.Range.offset(0, 1, -1, 1));

        if (connectedGame == null || connectedGame.isLineRange)
            return;

        const gameConnected: IBracketGame = BracketGame.CreateFromGameSync(mover.Bracket, connectedGame.GameId.GameNum);

        if (!GameId.compare(gameConnected.WinningTeamAdvancesToGameId, mover.ItemNew.GameId))
            return;

        // we have a game connected to us and we now have to "drag it along"
        if (connectedItem.isLineRange)
        {
            // move the line range
            connectedItem.shiftByRows(dRows);
        }

        // Maybe check to make sure the connected game is connected at the right place? right now we
        // just accept our line (or our connection point) overlapping any part of the connected game

        // we have several options for the connected game. Grow the game down, or move the game
        mover.moveRecurse(gameMover, optionWork, true, connectedGame, connectedGame.clone().shiftByRows(dRows));

        mover.moveRecurse(gameMover, optionWork, true, connectedGame, connectedGame.clone().growShrinkFromTop(-dRows * 2));
        mover.moveRecurse(gameMover, optionWork, false, connectedGame, connectedGame.clone().growShrink(dRows * 2));
    }

    static checkAndDragByBottomIncomingFeed(gameMover: GameMover, mover: Mover, optionWork: GridOption)
    {
        // now, see if our move changed the location of our outgoing feed point
        if (mover.ItemOld.isLineRange)
            return;

        const incomingPointOld: RangeInfo = mover.ItemOld.BottomTeamRange.offset(-1, 1, -1, 1);
        const incomingPointNew: RangeInfo = mover.ItemNew.BottomTeamRange.offset(-1, 1, -1, 1);
        const dRows: number = incomingPointNew.FirstRow - incomingPointOld.FirstRow;

        if (dRows == 0)
            return;

        // see if we actually are connected to anyone
        let [connectedItem, kindConnected] = optionWork.grid.getFirstOverlappingItem(incomingPointOld);

        // if the connected item is already a game, great, pass through
        // otherwise, figure out who the line is connected to...
        let [connectedGame, kindGame] =
            (connectedItem == null || kindConnected == RangeOverlapKind.None || !connectedItem.isLineRange)
                ? [connectedItem, kindConnected]
                : optionWork.grid.getFirstOverlappingItem(connectedItem.Range.offset(0, 1, -1, 1));

        if (connectedGame == null || connectedGame.isLineRange)
            return;

        const gameConnected: IBracketGame = BracketGame.CreateFromGameSync(mover.Bracket, connectedGame.GameId.GameNum);

        if (!GameId.compare(gameConnected.WinningTeamAdvancesToGameId, mover.ItemNew.GameId))
            return;

        // we have a game connected to us and we now have to "drag it along"
        if (connectedItem.isLineRange)
        {
            // move the line range
            connectedItem.shiftByRows(dRows);
        }

        // Maybe check to make sure the connected game is connected at the right place? right now we
        // just accept our line (or our connection point) overlapping any part of the connected game

        // we have several options for the connected game. Grow the game down, or move the game
        mover.moveRecurse(gameMover, optionWork, true, connectedGame, connectedGame.clone().shiftByRows(dRows));

        mover.moveRecurse(gameMover, optionWork, true, connectedGame, connectedGame.clone().growShrinkFromTop(dRows * 2));
        mover.moveRecurse(gameMover, optionWork, false, connectedGame, connectedGame.clone().growShrink(dRows * 2));
    }
}
