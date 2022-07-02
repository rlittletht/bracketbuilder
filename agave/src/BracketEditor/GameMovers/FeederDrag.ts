import { RangeInfo, RangeOverlapKind } from "../../Interop/Ranges";
import { GridItem } from "../GridItem";
import { GridOption, GameMover } from "../GridAdjusters/GameMover";
import { Mover } from "./Mover";
import { Grid } from "../Grid";
import { IBracketGame, BracketGame } from "../BracketGame";
import { GameId } from "../GameId";

export class FeederDrag
{
    static checkAndDragByOutgoingFeeder(gameMover: GameMover, mover: Mover, gridWork: Grid)
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
        let [connectedItem, kindConnected] = gridWork.getFirstOverlappingItem(outgoingPointOld);

        // if the connected item is already a game, great, pass through
        // otherwise, figure out who the line is connected to...
        let [connectedGame, kindGame] =
            (connectedItem == null || kindConnected == RangeOverlapKind.None || !connectedItem.isLineRange)
                ? [connectedItem, kindConnected]
                : gridWork.getFirstOverlappingItem(connectedItem.Range.offset(0, 1, connectedItem.Range.ColumnCount, 1));

        const game: IBracketGame = mover.ItemNew.isLineRange ? null : BracketGame.CreateFromGameSync(mover.Bracket, mover.ItemNew.GameId.GameNum);

        if (connectedGame == null || connectedGame.isLineRange || !GameId.compare(connectedGame.GameId, game.WinningTeamAdvancesToGameId))
            return;

        // we have a game connected to us and we now have to "drag it along"
        if (connectedItem.isLineRange)
        {
            // move the line range
            connectedItem.shiftByRows(dRows);
        }

        // now we can either move the connected game, or we can grow/shrink it to make it work
        // do both and add them to the options. the ranker will figure out which is better
        const gridOption = GameMover.createNewGridOption(gridWork);
        const newItems1: GridOption[] = gameMover.moveGameInternal(gridOption.grid, connectedGame, connectedGame.clone().shiftByRows(dRows), mover.Bracket);

        mover.pushOption(gridOption);
        for (let item of newItems1)
            mover.pushOption(item);

        const newItems2: GridOption[] = gameMover.moveGameInternal(gridWork, connectedGame, connectedGame.clone().growShrink(dRows), mover.Bracket);

        for (let item of newItems2)
            mover.pushOption(item);
    }
}
