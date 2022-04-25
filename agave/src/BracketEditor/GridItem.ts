import { RangeInfo, RangeOverlapKind } from "../Interop/Ranges";
import { IBracketGame } from "./BracketGame";

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

    constructor(range: RangeInfo, gameNum: number, isLine: boolean)
    {
        this.m_range = range;
        this.m_gameNum = isLine ? -1 : gameNum;
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
