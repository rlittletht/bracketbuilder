// a better name would be nice, but GameMover was taken by the outer class..

// this class holds the support for a single game move invocation, including
// the growing number of options...
import { GridOption, GameMover } from "../GridAdjusters/GameMover";
import { Grid } from "../Grid";
import { GridItem } from "../GridItem";
import { GameId } from "../GameId";
import { RangeOverlapKind } from "../../Interop/Ranges";

// each delegate is responsible for everything related to it
// for example, if you are going to notice that a connection point has moved,
// and you are going to move the connected items, you are responsible for BOTH
// the line (if there is one) AND the game. Move the line with just a shift
// and move the connected game by using MoveGame (so any of its connections
// get moved)
export interface GameMoverDelegate
{
    (gameMover: GameMover, mover: Mover, optionWork: GridOption): void;
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
    m_option: GridOption;
    m_bracket: string;
    m_movedGames: Set<GameId>;

    get ItemNew(): GridItem { return this.m_itemNew; }

    get ItemOld(): GridItem { return this.m_itemOld; }

    get ShiftTop(): number { return this.m_shiftTop; }

    get ShiftBottom(): number { return this.m_shiftBottom; }

    get MovedUp(): boolean { return this.m_fMovedUp; }

    get MovedDown(): boolean { return this.m_fMovedDown; }

    get Bracket(): string { return this.m_bracket; }

    get Items(): GridOption[] { return this.m_items; }

    get Grid(): Grid { return this.m_option.grid; }

    get MovedGames(): Set<GameId> { return this.m_option.movedGames; }

    constructor(option: GridOption, itemOld: GridItem, itemNew: GridItem, bracket: string)
    {
        this.m_bracket = bracket;

        this.m_option = option;
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

    /*----------------------------------------------------------------------------
        %%Function: Mover.doChange

        Change itemOld to itemNew, optionally preserving the working grid as
        unchanged
    ----------------------------------------------------------------------------*/
    doChange(optionWork: GridOption, preserveWorking: boolean, itemOld: GridItem, itemNew: GridItem)
    {
        const gridOption: GridOption =
            preserveWorking
                ? GameMover.createNewGridOption(optionWork.grid, optionWork.movedGames)
                : optionWork;

        // make this change
        // get the matching item
        let [match, kind] = gridOption.grid.getBestOverlappingItem(itemOld.Range);

        if (kind != RangeOverlapKind.Equal)
            throw Error("old item not found on original grid");

        if (!GameId.compare(match.GameId, itemNew.GameId))
            throw Error("old item not found on original grid with matching id");

        match.setGameInternals(itemNew.Range, itemNew.TopTeamRange, itemNew.BottomTeamRange, itemNew.GameNumberRange, itemNew.SwapTopBottom);

        if (preserveWorking)
            this.pushOption(gridOption);
    }

    moveRecurse(gameMover: GameMover, optionWork: GridOption, preserveWorking: boolean, itemOld: GridItem, itemNew: GridItem)
    {
        if (this.MovedGames.has(itemNew.GameId))
            return;

        const gridOption: GridOption =
            preserveWorking
                ? GameMover.createNewGridOption(optionWork.grid, optionWork.movedGames)
                : optionWork;

        // make sure to clone itemOld -- it might be connected to the grid we are about to modify
        const newItems1: GridOption[] = gameMover.moveGameInternal(gridOption, itemOld.clone(), itemNew, this.Bracket);
        if (preserveWorking)
            this.pushOption(gridOption);

        for (let item of newItems1)
            this.pushOption(item);
    }

    invokeSingleMover(gameMover: GameMover, singleMover: GameMoverDelegate)
    {
        // this will prevent us from trying to apply our mover to options
        // that we pushed ourselves
        const maxItemForThisInvocation: number = this.m_items.length;

        for (let i = -1; i < maxItemForThisInvocation; i++)
        {
            let optionWork: GridOption = i == -1 ? this.m_option : this.m_items[i];

            // skip working with disqualified options
            if (i >= 0 && this.m_items[i].rank == -1)
                continue;

            // before applying it to a grid in items, make sure that itemNew hasn't moved in the
            // grid. if an option moves the newItem we are working with, its tossed.
            if (!optionWork.grid.isItemOnGrid(this.m_itemNew))
            {
                // item moved on this grid option. its now disqualified (loop in update)
                optionWork.rank = -1;
                continue;
            }

            singleMover(gameMover, this, optionWork);
        }
    }
}