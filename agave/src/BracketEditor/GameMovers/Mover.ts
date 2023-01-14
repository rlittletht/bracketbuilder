// a better name would be nice, but GameMover was taken by the outer class..

// this class holds the support for a single game move invocation, including
// the growing number of options...
import { GridOption, GameMover } from "../GridAdjusters/GameMover";
import { Grid } from "../Grid";
import { GridItem } from "../GridItem";
import { GameId } from "../GameId";
import { RangeOverlapKind } from "../../Interop/Ranges";
import { s_staticConfig } from "../../StaticConfig";

// each delegate is responsible for everything related to it
// for example, if you are going to notice that a connection point has moved,
// and you are going to move the connected items, you are responsible for BOTH
// the line (if there is one) AND the game. Move the line with just a shift
// and move the connected game by using MoveGame (so any of its connections
// get moved)
export interface GameMoverDelegate
{
    (gameMover: GameMover, mover: Mover, optionWork: GridOption, crumbs: string): boolean;
}

export class Mover
{
    m_logGrids: boolean = s_staticConfig.logMoveSteps;
    m_items: GridOption[] = [];
    m_itemNew: GridItem;
    m_itemOld: GridItem;
    m_option: GridOption;
    m_bracket: string;

    get ItemNew(): GridItem { return this.m_itemNew; }

    get ItemOld(): GridItem { return this.m_itemOld; }

    get Bracket(): string { return this.m_bracket; }

    get Items(): GridOption[] { return this.m_items; }

    get Grid(): Grid { return this.m_option.grid; }

    constructor(option: GridOption, itemOld: GridItem, itemNew: GridItem, bracket: string)
    {
        this.m_bracket = bracket;

        this.m_option = option;
        this.m_itemNew = itemNew;
        this.m_itemOld = itemOld;
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
    doChange(optionWork: GridOption, preserveWorking: boolean, itemOld: GridItem, itemNew: GridItem, name: string): boolean
    {
        const gridOption: GridOption =
            preserveWorking
                ? GameMover.createNewGridOption(optionWork.grid, optionWork.movedGames, optionWork.name)
                : optionWork;

        gridOption.name = `${gridOption.name}:doChange(${name})`;

        // make this change
        // get the matching item
        let [match, kind] = gridOption.grid.getBestOverlappingItem(itemOld.Range);

        if (kind != RangeOverlapKind.Equal)
            throw Error("old item not found on original grid");

        if (!GameId.compare(match.GameId, itemNew.GameId))
            throw Error("old item not found on original grid with matching id");

        match.setGameInternals(itemNew.Range, itemNew.TopTeamRange, itemNew.BottomTeamRange, itemNew.GameNumberRange, itemNew.SwapTopBottom);

        if (preserveWorking && gridOption.rank != -1)
            this.pushOption(gridOption);

        return true;
    }

    moveRecurse(gameMover: GameMover, optionWork: GridOption, preserveWorking: boolean, itemOld: GridItem, itemNew: GridItem, name: string, crumbs: string): boolean
    {
        if (optionWork.movedGames.has(itemNew.GameId))
            return false;

        const gridOption: GridOption =
            preserveWorking
                ? GameMover.createNewGridOption(optionWork.grid, optionWork.movedGames, optionWork.name)
                : optionWork;

        gridOption.name = `${gridOption.name}:moveRecurse(${name})`;

        // make sure to clone itemOld -- it might be connected to the grid we are about to modify
        const newItems1: GridOption[] = gameMover.moveGameInternal(gridOption, itemOld.clone(), itemNew, this.Bracket, crumbs);
        if (preserveWorking && gridOption.rank != -1 && !gridOption.clean)
            this.pushOption(gridOption);

        if (newItems1.length > 0)
        {

            for (let item of newItems1)
            {
                if (item.rank != -1)
                    this.pushOption(item);
            }

            return true;
        }

        return false;
    }

    logGrids(title: string, dirtyOnly: boolean)
    {
        if (!this.m_logGrids)
            return;

        if (!dirtyOnly || this.m_option.logDirty)
        {
            console.log(`|(${this.m_option.rank}):gd(main) ${title}: ${this.m_option.name}: mainOption|`);
            this.m_option.grid.logGridCondensed();
            if (dirtyOnly)
                this.m_option.logDirty = false;
        }

        for (let i = 0; i < this.m_items.length; i++)
        {
            if (!dirtyOnly || this.m_items[i].logDirty)
            {
                console.log(`|gd(${i}) ${title}: ${this.m_items[i].name}: option[${i}]|`);
                this.m_items[i].grid.logGridCondensed();
                if (dirtyOnly)
                    this.m_items[i].logDirty = false;
            }
        }
    }

    invokeSingleMover(gameMover: GameMover, singleMover: GameMoverDelegate, crumbs: string)
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

            if (singleMover(gameMover, this, optionWork, crumbs))
                optionWork.logDirty = true;

            if (s_staticConfig.newStepLogger)
            {
                this.logGrids(`${crumbs}(ISM)`, true);
            }
        }
    }
}