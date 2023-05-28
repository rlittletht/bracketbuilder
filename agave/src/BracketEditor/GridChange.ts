import { GridItem } from "./GridItem";

export enum GridChangeOperation
{
    Insert,
    InsertLite,
    Remove,
    RemoveLite
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
    get StartTime() { return this.m_gridItem.StartTime; }
    get Field() { return this.m_gridItem.Field; }

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
        let sOp: string = "";

        if (this.m_changeOp == GridChangeOperation.Insert)
            sOp = ">";
        else if (this.m_changeOp == GridChangeOperation.InsertLite)
            sOp = "~>";
        else if (this.m_changeOp == GridChangeOperation.Remove)
            sOp = "<";
        else if (this.m_changeOp == GridChangeOperation.RemoveLite)
            sOp = "<~";

        return `${sOp} ${this.GameId == null ? -1 : this.GameId.Value}:${this.SwapTopBottom ? "S" : ""} ${this.Range.toString()}`;
    }
}