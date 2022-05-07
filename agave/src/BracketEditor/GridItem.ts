import { RangeInfo, RangeOverlapKind } from "../Interop/Ranges";
import { IBracketGame } from "./BracketGame";
import { Grid } from "./Grid";

export class GridItem
{
    m_range: RangeInfo;
    m_topTeamRange: RangeInfo = null;
    m_bottomTeamRange: RangeInfo = null;
    m_gameNumberRange: RangeInfo = null;
    m_swapTopBottom: boolean = false; // we will save this from the bound game - allows us to find connecting lines

    m_gameNum: number = -1;

    get isLineRange(): boolean
    {
        return this.m_gameNum == -1;
    }

    get SwapTopBottom(): boolean { return this.m_swapTopBottom; }

    get GameNum(): number
    {
        return this.m_gameNum;
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

    get Range(): RangeInfo
    {
        return this.m_range;
    }

    shiftByRows(rowAdjust: number)
    {
        if (this.m_topTeamRange != null)
            this.m_topTeamRange.setRow(this.m_topTeamRange.FirstRow + rowAdjust);
        if (this.m_bottomTeamRange != null)
            this.m_bottomTeamRange.setRow(this.m_bottomTeamRange.FirstRow + rowAdjust);
        if (this.m_gameNumberRange != null)
            this.m_gameNumberRange.setRow(this.m_gameNumberRange.FirstRow + rowAdjust);
        if (this.m_range != null)
            this.m_range.setRow(this.m_range.FirstRow + rowAdjust);
    }

    constructor(range: RangeInfo, gameNum: number, isLine: boolean)
    {
        this.m_range = RangeInfo.createFromRangeInfo(range);
        this.m_gameNum = isLine ? -1 : gameNum;
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
        this.m_gameNumberRange = Grid.getRangeInfoForGameInfo(this.m_range).offset(0, 3, 1, 1);
    }

    attachGame(game: IBracketGame)
    {
        if (!game.IsLinkedToBracket)
            throw "can't attach game that isn't linked";

        this.m_topTeamRange = RangeInfo.createFromRangeInfo(game.TopTeamRange);
        this.m_bottomTeamRange = RangeInfo.createFromRangeInfo(game.BottomTeamRange);
        this.m_gameNumberRange = RangeInfo.createFromRangeInfo(game.GameNumberRange);
        this.m_swapTopBottom = game.SwapTopBottom;
    }

    isEqual(item: GridItem): boolean
    {
        if (this.GameNum != item.GameNum)
            return false;

        if (RangeInfo.isOverlapping(this.Range, item.Range) != RangeOverlapKind.Equal)
            return false;
        if (RangeInfo.isOverlapping(this.TopTeamRange, item.TopTeamRange) != RangeOverlapKind.Equal)
            return false;
        if (RangeInfo.isOverlapping(this.BottomTeamRange, item.BottomTeamRange) != RangeOverlapKind.Equal)
            return false;
        if (RangeInfo.isOverlapping(this.GameNumberRange, item.GameNumberRange) != RangeOverlapKind.Equal)
            return false;

        return true;
    }

    static createFromItem(item: GridItem): GridItem
    {
        let itemNew = new GridItem(item.Range, item.GameNum, item.isLineRange);

        itemNew.m_topTeamRange = RangeInfo.createFromRangeInfo(item.TopTeamRange);
        itemNew.m_bottomTeamRange = RangeInfo.createFromRangeInfo(item.BottomTeamRange);
        itemNew.m_gameNumberRange = RangeInfo.createFromRangeInfo(item.GameNumberRange);
        itemNew.m_swapTopBottom = item.m_swapTopBottom;

        return itemNew;
    }
}
