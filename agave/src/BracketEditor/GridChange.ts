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
    m_connectedTop: boolean;
    m_connectedBottom: boolean;

    get ChangeOp() { return this.m_changeOp };

    get Range() { return this.m_gridItem.Range; }

    get GameId() { return this.m_gridItem.GameId; }

    get SwapTopBottom() { return this.m_gridItem.SwapTopBottom; }

    get IsLine() { return this.m_gridItem.isLineRange; }

    get IsConnectedTop() { return this.m_connectedTop; }

    get IsConnectedBottom() { return this.m_connectedBottom; }

    constructor(op: GridChangeOperation, item: GridItem, connectedTop: boolean = false, connectedBottom: boolean = false)
    {
        this.m_changeOp = op;
        this.m_gridItem = item;
        this.m_connectedTop = connectedTop;
        this.m_connectedBottom = connectedBottom;
    }

    toString(): string
    {
        return `${this.m_changeOp == GridChangeOperation.Remove ? "<" : ">"} ${this.GameId == null ? -1 : this.GameId.Value}: ${this.Range.toString()}`;
    }
}