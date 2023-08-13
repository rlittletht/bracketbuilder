// a better name would be nice, but GameMover was taken by the outer class..

// this class holds the support for a single game move invocation, including
// the growing number of options...
import { GridOption, GameMover } from "../GridAdjusters/GameMover";
import { Grid } from "../Grid";
import { GridItem } from "../GridItem";
import { GameId } from "../GameId";
import { RangeOverlapKind } from "../../Interop/Ranges";
import { s_staticConfig } from "../../StaticConfig";
import { v4 as uuidv4 } from 'uuid';

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

let cRecurse = 0;

export class Mover
{
    m_logGrids: boolean = s_staticConfig.logMoveSteps;
    m_items: GridOption[] = [];
    m_itemNew: GridItem;
    m_itemOld: GridItem;
    m_option: GridOption;
    m_bracket: string;
    m_tree = new Map<string, GridOption>();

    get Tree(): Map<string, GridOption>
    {
        return this.m_tree;
    }

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
    doChange(optionWork: GridOption, preserveWorking: boolean, itemOld: GridItem, itemNew: GridItem, name: string, crumb: string): boolean
    {
        const gridOption: GridOption =
            preserveWorking
                ? GameMover.createNewGridOption(optionWork.grid, optionWork.movedGames, optionWork.name, optionWork.crumbs)
                : optionWork;

        gridOption.name = `${gridOption.crumbs.join(":")}:G${itemNew.GameId.Value}:${crumb}:doChange(${name})`;
        gridOption.crumbs.push(`G${itemNew.GameId.Value}:${crumb}`);

        if (s_staticConfig.logMoveKeySetting)
        {
            const preface1 = `doChange for G${itemNew.GameId.Value}`.padEnd(25, " ");
            console.log(`${preface1}${gridOption.name}`);
        }

        // make this change
        // get the matching item
        let [match, kind] = gridOption.grid.getBestOverlappingItem(itemOld.Range);

        if (kind != RangeOverlapKind.Equal)
            throw new Error("old item not found on original grid");

        if (!GameId.compare(match.GameId, itemNew.GameId))
            throw new Error("old item not found on original grid with matching id");

        match.setGameInternals(itemNew.Range, itemNew.TopTeamRange, itemNew.BottomTeamRange, itemNew.GameNumberRange, itemNew.SwapTopBottom);

        if (preserveWorking && gridOption.rank != -1)
            this.pushOption(gridOption);

        const key = gridOption.crumbs.join(":");

        if (s_staticConfig.logMoveKeySetting)
        {
            const preface = `setting tree`.padEnd(25, " ");
            console.log(`${preface}${key}[${gridOption.uuid}]`);
        }
        if (s_staticConfig.logMoveTree)
        {
            if (this.Tree.has(key))
                throw new Error(`tree already has key "${key}"`);

            this.Tree.set(key, GameMover.cloneGridOption(gridOption));
        }

        return true;
    }

    mergeTree(tree: Map<string, GridOption>)
    {
        if (tree)
        {
            for (let key of tree.keys())
            {
                const preface = `adding key:`.padEnd(25, " ");
//                console.log(`${preface}${key}`);

                if (this.Tree.has(key) && this.Tree.get(key).uuid != tree.get(key).uuid)
                    throw new Error(`parent Tree already has key ${key}`);

                this.Tree.set(key, tree.get(key));
            }
        }
    }

    moveRecurse(gameMover: GameMover, optionWork: GridOption, preserveWorking: boolean, itemOld: GridItem, itemNew: GridItem, name: string, crumb: string): boolean
    {
        if (optionWork.movedGames.has(itemNew.GameId))
            return false;

        const gridOption: GridOption =
            preserveWorking
                ? GameMover.createNewGridOption(optionWork.grid, optionWork.movedGames, optionWork.name, optionWork.crumbs)
                : optionWork;

        gridOption.name = `${gridOption.crumbs.join(":")}:G${itemNew.GameId.Value}:${crumb}:moveRecurse(${name})`;

        if (s_staticConfig.logMoveKeySetting)
        {
            const preface1 = `${++cRecurse}: recursing for G${itemNew.GameId.Value}`.padEnd(25, " ");
            console.log(`${preface1}${gridOption.name}`);
        }

        // make sure to clone itemOld -- it might be connected to the grid we are about to modify
        const { options, tree } = gameMover.moveGameInternal(gridOption, itemOld.clone(), itemNew, this.Bracket, crumb);
        if (preserveWorking && gridOption.rank != -1 && !gridOption.clean)
            this.pushOption(gridOption);

        if (s_staticConfig.logMoveKeySetting)
        {
            const preface2 = `${cRecurse--}: returning for G${itemNew.GameId.Value}`.padEnd(25, " ");

            console.log(`${preface2}${gridOption.name}`);
        }

        if (s_staticConfig.logMoveTree)
        {
            this.mergeTree(tree);
        }

        if (options.length > 0)
        {
            if (s_staticConfig.logMoveTree)
            {
                for (let item of options)
                {
                    if (item.rank != -1)
                        this.pushOption(item);
                }
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

            // make sure we can differentiate moves put on top of previous options versus
            // moves on the current option...
            const thisCrumb = i == -1 ? crumbs : `O:${i}${crumbs}`;
            if (singleMover(gameMover, this, optionWork, thisCrumb))
                optionWork.logDirty = true;

            if (s_staticConfig.newStepLogger)
            {
                this.logGrids(`${crumbs}(ISM)`, true);
            }
        }
    }
}