import { GameId } from "../GameId";

export interface GameExpanderStep
{
    gameId: GameId;
    positionDelta: number;
    sizeDelta: number;
}