import { GridItem } from "./GridItem";

export enum GridChangeOperation
{
    Insert,
    Remove
}

export class GridChange
{
    m_changeOp: GridChangeOperation;
    m_gridItem: GridItem;

    get ChangeOp() { return this.m_changeOp };

    get Range() { return this.m_gridItem.Range; }

    get GameId() { return this.m_gridItem.GameId; }

    get SwapTopBottom() { return this.m_gridItem.SwapTopBottom; }

    get IsLine() { return this.m_gridItem.isLineRange; }

    constructor(op: GridChangeOperation, item: GridItem)
    {
        this.m_changeOp = op;
        this.m_gridItem = item;
    }

    toString(): string
    {
        return `${this.m_changeOp == GridChangeOperation.Remove ? "<" : ">"} ${this.GameId}: ${this.Range.toString()}`;
    }
}