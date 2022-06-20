import { GameId } from "./GameId";

export class GameNum
{
    m_gameNum: number;

    constructor(gameNum: number)
    {
        this.m_gameNum = gameNum;
    }

    static CreateFromGameId(gameId: GameId)
    {
        return new GameNum(gameId.Value - 1);
    }

    get Value(): number
    {
        return this.m_gameNum;
    }

    get GameId(): GameId
    {
        return GameId.CreateFromGameNum(this);
    }

    equals(right: GameNum): boolean
    {
        return right != null && this.Value == right.Value;
    }

    static compare(left: GameNum, right: GameNum)
    {
        return left == right || (left != null && left.equals(right));
    }
}