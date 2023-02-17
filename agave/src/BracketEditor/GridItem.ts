import { RangeInfo, RangeOverlapKind } from "../Interop/Ranges";
import { IBracketGame } from "./BracketGame";
import { Grid } from "./Grid";
import { GameId } from "./GameId";
import { GameNum } from "./GameNum";
import { GlobalDataBuilder } from "../Brackets/GlobalDataBuilder";

export class GridItem
{
    m_range: RangeInfo;
    m_topTeamRange: RangeInfo = null;
    m_bottomTeamRange: RangeInfo = null;
    m_gameNumberRange: RangeInfo = null;
    m_swapTopBottom: boolean = false; // we will save this from the bound game - allows us to find connecting lines

    // these two values will only be set if this was created from a bracket
    // (not inferred)
    m_startTime: number = GlobalDataBuilder.DefaultStartTime;
    m_field: string = GlobalDataBuilder.DefaultField;

    m_gameId: GameId = null;

    get StartTime(): number
    {
        return this.m_startTime;
    }

    get Field(): string
    {
        return this.m_field;
    }

    get isLineRange(): boolean
    {
        return this.m_gameId == null;
    }

    get SwapTopBottom(): boolean { return this.m_swapTopBottom; }

    get GameId(): GameId
    {
        return this.m_gameId;
    }

    get GameNumber(): GameNum
    {
        return this.m_gameId.GameNum;
    }

    get TopTeamRange(): RangeInfo
    {
        return this.m_topTeamRange;
    }

    get BottomTeamRange(): RangeInfo
    {
        return this.m_bottomTeamRange;
    }

    get GameNumberRange(): RangeInfo
    {
        return this.m_gameNumberRange;
    }

    get OutgoingFeederPoint(): RangeInfo
    {
        return this.m_gameNumberRange.offset(1, 1, 2, 1);
    }

    get Range(): RangeInfo
    {
        return this.m_range;
    }

    doSwapTopBottom(): GridItem
    {
        this.m_swapTopBottom = !this.m_swapTopBottom;
        return this;
    }

    shiftByRows(rowAdjust: number): GridItem
    {
        if (this.m_topTeamRange != null)
            this.m_topTeamRange.setRow(this.m_topTeamRange.FirstRow + rowAdjust);
        if (this.m_bottomTeamRange != null)
            this.m_bottomTeamRange.setRow(this.m_bottomTeamRange.FirstRow + rowAdjust);
        if (this.m_gameNumberRange != null)
            this.m_gameNumberRange.setRow(this.m_gameNumberRange.FirstRow + rowAdjust);
        if (this.m_range != null)
            this.m_range.setRow(this.m_range.FirstRow + rowAdjust);

        return this;
    }

    growShrink(rowAdjust: number): GridItem
    {
        if (this.m_bottomTeamRange != null)
            this.m_bottomTeamRange.setRow(this.m_bottomTeamRange.FirstRow + rowAdjust);
        if (this.m_range != null)
            this.m_range.setLastRow(this.m_range.LastRow + rowAdjust);
        if (this.m_range.RowCount > 7)
            this.m_gameNumberRange = Grid.getRangeInfoForGameInfo(this.m_range).offset(0, 3, 1, 1);
        else
            this.m_gameNumberRange = null;

        return this;
    }

    growShrinkFromTop(rowAdjust: number): GridItem
    {
        if (this.m_topTeamRange != null)
            this.m_topTeamRange.setRow(this.m_topTeamRange.FirstRow - rowAdjust);
        if (this.m_range != null)
            this.m_range.setRowResize(this.m_range.FirstRow - rowAdjust);
        if (this.m_range.RowCount > 7)
            this.m_gameNumberRange = Grid.getRangeInfoForGameInfo(this.m_range).offset(0, 3, 1, 1);
        else
            this.m_gameNumberRange = null;

        return this;
    }

    rebase(oldTopRow: number, newTopRow: number)
    {
        if (this.m_topTeamRange != null)
            this.m_topTeamRange.rebase(oldTopRow, newTopRow);
        if (this.m_bottomTeamRange != null)
            this.m_bottomTeamRange.rebase(oldTopRow, newTopRow);
        if (this.m_gameNumberRange != null)
            this.m_gameNumberRange.rebase(oldTopRow, newTopRow);
        if (this.m_range != null)
            this.m_range.rebase(oldTopRow, newTopRow);
    }

    constructor(range: RangeInfo, gameId: GameId, isLine: boolean)
    {
        this.m_range = RangeInfo.createFromRangeInfo(range);
        this.m_gameId = isLine ? null : gameId;
    }

    /*----------------------------------------------------------------------------
        %%Function: GridItem.inferGameInternals

        the sub-ranges for a game (top/bottom team range, game number range) are
        normally populated when a real IBracketGame is attached to the item.

        for things like tests, though, we don't want a workbook involved. this
        will infer those locations based on the overall extents of the game.
    ----------------------------------------------------------------------------*/
    inferGameInternals()
    {
        this.m_topTeamRange = this.m_range.topLeft();
        this.m_bottomTeamRange = this.m_range.bottomRight().newSetColumn(this.m_range.FirstColumn);
        if (this.m_range.RowCount > 7)
            this.m_gameNumberRange = Grid.getRangeInfoForGameInfo(this.m_range).offset(0, 3, 1, 1);
    }

    inferGameInternalsIfNecessary()
    {
        if (this.m_topTeamRange == null && this.m_bottomTeamRange == null && this.m_gameNumberRange == null)
            this.inferGameInternals();
    }

    setAndInferGameInternals(range: RangeInfo)
    {
        this.m_range = range;
        this.inferGameInternals();

        return this;
    }

    setGameInternals(
        range: RangeInfo,
        topTeamRange: RangeInfo,
        bottomTeamRange: RangeInfo,
        gameNumberRange: RangeInfo,
        swapTopBottom: boolean)
    {
        this.m_range = RangeInfo.createFromRangeInfo(range);
        if (!this.isLineRange)
        {
            this.m_topTeamRange = RangeInfo.createFromRangeInfo(topTeamRange);
            this.m_bottomTeamRange = RangeInfo.createFromRangeInfo(bottomTeamRange);
            this.m_gameNumberRange = RangeInfo.createFromRangeInfo(gameNumberRange);
            this.m_swapTopBottom = swapTopBottom;
        }
    }

    setStartTime(time: number)
    {
        this.m_startTime = time;
    }

    setField(field: string)
    {
        this.m_field = field;
    }

    attachGame(game: IBracketGame)
    {
        if (!game.IsLinkedToBracket)
            throw "can't attach game that isn't linked";

        this.m_topTeamRange = RangeInfo.createFromRangeInfo(game.TopTeamRange);
        this.m_bottomTeamRange = RangeInfo.createFromRangeInfo(game.BottomTeamRange);
        this.m_gameNumberRange = RangeInfo.createFromRangeInfo(game.GameIdRange);
        this.m_swapTopBottom = game.SwapTopBottom;
        this.m_startTime = game.StartTime;
        this.m_field = game.Field;
    }

    isEqual(item: GridItem): boolean
    {
        if (!GameId.compare(this.GameId, item.GameId))
            return false;

        if (RangeInfo.isOverlapping(this.Range, item.Range) != RangeOverlapKind.Equal)
            return false;

        if (!this.isLineRange)
        {
            if (RangeInfo.isOverlapping(this.TopTeamRange, item.TopTeamRange) != RangeOverlapKind.Equal)
                return false;
            if (RangeInfo.isOverlapping(this.BottomTeamRange, item.BottomTeamRange) != RangeOverlapKind.Equal)
                return false;
            if (RangeInfo.isOverlapping(this.GameNumberRange, item.GameNumberRange) != RangeOverlapKind.Equal)
                return false;
        }

        return true;
    }

    static createFromItem(item: GridItem): GridItem
    {
        let itemNew = new GridItem(item.Range, item.GameId, item.isLineRange);

        itemNew.m_topTeamRange = RangeInfo.createFromRangeInfo(item.TopTeamRange);
        itemNew.m_bottomTeamRange = RangeInfo.createFromRangeInfo(item.BottomTeamRange);
        itemNew.m_gameNumberRange = RangeInfo.createFromRangeInfo(item.GameNumberRange);
        itemNew.m_swapTopBottom = item.m_swapTopBottom;
        itemNew.m_field = item.m_field;
        itemNew.m_startTime = item.m_startTime;

        return itemNew;
    }

    clone(): GridItem
    {
        return GridItem.createFromItem(this);
    }
}
