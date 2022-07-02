// a better name would be nice, but GameMover was taken by the outer class..

// this class holds the support for a single game move invocation, including
// the growing number of options...
import { GridOption, GameMover } from "../GridAdjusters/GameMover";
import { Grid } from "../Grid";
import { GridItem } from "../GridItem";

export interface GameMoverDelegate
{
    (gameMover: GameMover, mover: Mover, gridWork: Grid): void;
}

export class Mover
{
    m_items: GridOption[] = [];
    m_itemNew: GridItem;
    m_itemOld: GridItem;
    m_shiftTop: number;
    m_shiftBottom: number;
    m_fMovedUp: boolean;
    m_fMovedDown: boolean;
    m_grid: Grid;
    m_bracket: string;

    get ItemNew(): GridItem { return this.m_itemNew; }

    get ItemOld(): GridItem { return this.m_itemOld; }

    get ShiftTop(): number { return this.m_shiftTop; }

    get ShiftBottom(): number { return this.m_shiftBottom; }

    get MovedUp(): boolean { return this.m_fMovedUp; }

    get MovedDown(): boolean { return this.m_fMovedDown; }

    get Bracket(): string { return this.m_bracket; }

    get Items(): GridOption[] { return this.m_items; }

    constructor(grid: Grid, itemOld: GridItem, itemNew: GridItem, bracket: string)
    {
        this.m_bracket = bracket;
        this.m_grid = grid;
        this.m_itemNew = itemNew;
        this.m_itemOld = itemOld;
        this.m_shiftTop = itemNew.Range.FirstRow - itemOld.Range.FirstRow;
        this.m_shiftBottom = itemNew.Range.LastRow - itemOld.Range.LastRow;
        this.m_fMovedUp = itemOld.Range.FirstRow > itemNew.Range.FirstRow;
        this.m_fMovedDown = itemOld.Range.LastRow < itemNew.Range.LastRow;
    }

    pushOption(gridOption: GridOption)
    {
        this.m_items.push(gridOption);
    }

    invokeSingleMover(gameMover: GameMover, singleMover: GameMoverDelegate)
    {
        // this will prevent us from trying to apply our mover to options
        // that we pushed ourselves
        const maxItemForThisInvocation: number = this.m_items.length;

        for (let i = -1; i < maxItemForThisInvocation; i++)
        {
            let gridWork: Grid = i == -1 ? this.m_grid : this.m_items[i].grid;

            // skip working with disqualified options
            if (i >= 0 && this.m_items[i].rank == -1)
                continue;

            // before applying it to a grid in items, make sure that itemNew hasn't moved in the
            // grid. if an option moves the newItem we are working with, its tossed.
            if (!gridWork.isItemOnGrid(this.m_itemNew))
            {
                if (i == -1)
                    throw Error("current grid has been corrupted. itemNew has moved");

                // item moved on this grid option. its now disqualified (loop in update)
                this.m_items[i].rank = -1;
                continue;
            }

            singleMover(gameMover, this, gridWork);
        }
    }
}