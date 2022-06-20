import { GameNum } from "./GameNum";

export class GameId
{
    m_gameId: number;

    constructor(gameId: number)
    {
        this.m_gameId = gameId;
    }

    get Value(): number
    {
        return this.m_gameId;
    }

    static CreateFromGameNum(gameNum: GameNum)
    {
        return new GameId(gameNum.Value + 1);
    }

    get GameNum(): GameNum
    {
        return GameNum.CreateFromGameId(this);
    }

    equals(right: GameId): boolean
    {
        return right != null && this.Value == right.Value;
    }

    static compare(left: GameId, right: GameId)
    {
        return left == right || (left != null && left.equals(right));
    }
}