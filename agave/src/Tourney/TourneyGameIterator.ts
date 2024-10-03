import { TourneyGameDef } from "./TourneyGameDef";

export class TourneyGameIterator implements Iterator<TourneyGameDef>
{
    private m_current = 0;
    private m_orderedGames: TourneyGameDef[];

    constructor(orderedGames: TourneyGameDef[])
    {
        this.m_orderedGames = orderedGames;
    }

    next(): IteratorResult<TourneyGameDef>
    {
        if (this.m_current < this.m_orderedGames.length)
            return { value: this.m_orderedGames[this.m_current++], done: false };
        else
            return { value: null, done: true };
    }
}
