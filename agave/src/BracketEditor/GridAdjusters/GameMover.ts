import { Grid } from "../Grid";
import { GridItem } from "../GridItem";
import { GridRanker } from "../GridRanker";
import { RangeOverlapKind, RangeInfo } from "../../Interop/Ranges";
import { BracketGame, IBracketGame } from "../BracketGame";
import { GameId } from "../GameId";
import { Mover } from "../GameMovers/Mover";
import { PushAway } from "../GameMovers/PushAway";
import { FeederDrag } from "../GameMovers/FeederDrag";
import { TopBottomSwapper } from "../GameMovers/TopBottomSwapper";
import { s_staticConfig } from "../../StaticConfig";

export interface GridOption
{
    grid: Grid,
    rank: number,
    movedGames: Set<GameId>,
    name: string,
    logDirty: boolean,
    clean: boolean
}

export class GameMover
{
    m_originalGrid: Grid;
    m_grids: Grid[] = [];
    m_moveCount: number = 0;
    m_maxMoves: number = s_staticConfig.maxGameMoves;
    m_warning: string = "";

    get ExceededMoveCount(): boolean{ return this.m_moveCount >= this.m_maxMoves; }

    RequestExtraMoves()
    {
        this.m_maxMoves += s_staticConfig.maxGameMoves / 10;
    }

    SetWarning(warning: string)
    {
        this.m_warning = warning;
    }

    get Warning(): string { return this.m_warning; }

    constructor(grid: Grid)
    {
        this.m_originalGrid = grid;
    }

    static createNewGridOption(gridWork: Grid, movedGames: Set<GameId>, name: string): GridOption
    {
        return {
            grid: gridWork.clone(),
            rank: 0,
            movedGames: movedGames == null ? new Set<GameId>() : new Set<GameId>(movedGames),
            name: name,
            logDirty: true,
            clean: true
        };
    }

    moveGame(itemOld: GridItem, itemNew: GridItem, bracket: string): Grid
    {
        const mainOption = GameMover.createNewGridOption(this.m_originalGrid, null, "root");
        const options: GridOption[] = this.moveGameInternal(
            mainOption,
            itemOld,
            itemNew,
            bracket,
            "");

        if (this.Warning != "")
            console.log(`WARNING: ${this.Warning}`);

        if (mainOption.rank != -1)
            mainOption.rank = GridRanker.getGridRank(mainOption.grid, bracket);

        if (s_staticConfig.logOptions)
        {
            console.log(`|option 0 (rank=${mainOption.rank})|`);
            mainOption.grid.logGridCondensed();
        }
        let best: GridOption = mainOption;
        let optionNum = 1;

        for (let option of options)
        {
            // don't even try to rank if it was disqualified
            if (option.rank != -1)
                option.rank = GridRanker.getGridRank(option.grid, bracket);

            if (option.rank != -1 && s_staticConfig.logOptions)
            {
                console.log(`|option ${optionNum++} (rank=${option.rank})|`);
                option.grid.logGridCondensed();
            }

            if (best.rank == -1 || (option.rank != -1 && option.rank < best.rank))
                best = option;
        }
        if (s_staticConfig.logOptions)
            console.log("|");

        if (best.rank == -1)
            return null;

        return best.grid;
    }

    /*----------------------------------------------------------------------------
        %%Function: GameMover.getMatchingItem
    ----------------------------------------------------------------------------*/
    static getMatchingItem(working: GridOption, item: GridItem, gameId: GameId): GridItem
    {
        // make this change
        // get the matching item
        const items: GridItem[] = working.grid.getOverlappingItems(item.Range);

        let match: GridItem = null;

        for (let item of items)
        {
            if (item.Range.isEqual(item.Range) && item.GameId == gameId)
            {
                match = item;
                break;
            }
        }

        return match;
    }

    /*----------------------------------------------------------------------------
        %%Function: GameMover.moveGameInternal

        move the game from itemOld to itemNew on the given grid.

        return an array of possible outcome grids for this move.
        If the move is impossible, return []
        If the move is unambiguous, return [grid]
        If the move has possible branches, return [grid, ...]

        for now, this cannot break any incoming connections -- only 

        NOTE on Branch Creation.  This routine will do the requested move in the
        grid provided. Sometimes we have to make a choice that may or may not
        be good. In those cases, we clone the grid we're working with and apply
        one choice to the current grid, and one choice to the clone (and if there
        were more than 2 choices, even more clones).

        As this function accumulates branch options, it is required to make sure
        that all changes it makes are made to all branches. It follows, then, that
        the first adjustment need only be made to the current grid. The next
        adjustment needs to be made to the current grid AND any options created
        by the first adjustment. And so on.

        On return, all accumulated options are returned (NOT including the
        current grid -- that is always implit)
    ----------------------------------------------------------------------------*/
    moveGameInternal(working: GridOption, itemOld: GridItem, itemNew: GridItem, bracket: string, crumbs: string): GridOption[]
    {
        if (this.m_moveCount > this.m_maxMoves)
        {
            this.SetWarning("Exceeded game move count. Not all options considered.");
            return [];
        }

        this.m_moveCount++;
        if (!GameId.compare(itemOld.GameId, itemNew.GameId))
            throw Error("can't change game while moving");

        // can't move a game that's fixed
        if (working.movedGames.has(itemNew.GameId))
            return [];

        const mover: Mover = new Mover(working, itemOld, itemNew, bracket);

        working.movedGames.add(itemNew.GameId);

        // make this change
        // get the matching item
        const items: GridItem[] = working.grid.getOverlappingItems(itemOld.Range);

        let match: GridItem = null;

        for (let item of items)
        {
            if (item.Range.isEqual(itemOld.Range) && item.GameId == itemNew.GameId)
            {
                match = item;
                break;
            }
        }

        if (match == null)
            throw Error("old item not found on original grid");

        if (!GameId.compare(match.GameId, itemNew.GameId))
            throw Error("old item not found on original grid with matching id");

        match.setGameInternals(itemNew.Range, itemNew.TopTeamRange, itemNew.BottomTeamRange, itemNew.GameNumberRange, itemNew.SwapTopBottom);
        working.logDirty = true;
        working.clean = false;

        // we had to let it actually move the game, but now if the game is not valid, then invalidate
        // this option
        if ((!itemNew.isLineRange && itemNew.Range.RowCount <= 7)
            || itemNew.Range.FirstRow < working.grid.FirstGridPattern.FirstRow)
        {
            working.rank = -1;
            return [];
        }

        mover.logGrids(`${crumbs}:orig`, true);
        mover.invokeSingleMover(this, TopBottomSwapper.checkAndSwapTopBottom, `${crumbs}:CP.1`);
        mover.logGrids(`${crumbs}:CP.1`, true);

        mover.invokeSingleMover(this, PushAway.checkAndMoveItemsAway, `${crumbs}:CP.2`);
        mover.logGrids(`${crumbs}:CP.2`, true);

        mover.invokeSingleMover(this, PushAway.checkAndMoveAdjacentItemsAway, `${crumbs}:CP.3`);
        mover.logGrids(`${crumbs}:CP.3`, true);
        // NYI: mover.invokeSingleMover(this, PushAway.checkAndMoveLinesAway);

        // now, check and apply the "outgoing feeder moved so it will drag the attached game with it")
        // apply this rule to grid and every grid in items
        mover.invokeSingleMover(this, FeederDrag.checkAndDragByOutgoingFeeder, `${crumbs}:CP.4`);
        mover.logGrids(`${crumbs}:CP.4`, true);
        mover.invokeSingleMover(this, FeederDrag.checkAndDragByTopIncomingFeed, `${crumbs}:CP.5`);
        mover.logGrids(`${crumbs}:CP.5`, true);
        mover.invokeSingleMover(this, FeederDrag.checkAndDragByBottomIncomingFeed, `${crumbs}:CP.6`);
        mover.logGrids(`${crumbs}:CP.6`, true);

        // still not sure how to make this work when the feeder's above kill the main option before it has a chance
        // to get here...
        mover.invokeSingleMover(this, TopBottomSwapper.checkOutgoingFeedAndMaybeSwapTopBottomTarget, `${crumbs}:CP.1S`);
        mover.logGrids(`${crumbs}:CP.`, true);

        // we have another case where we want to check the outgoing feeder to see if our old location
        // fed into a game, but our new location would like to not DRAG the connected game but rather
        // have the connected game swap its home/away to remain connected...
        return mover.Items;
    }
}