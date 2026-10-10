import {ElementItem} from "./Elements/ElementItem";
import {IBracketGame} from "../../IBracketGame";
import {RangeInfo, Ranges} from "../../../Interop/Ranges";
import {CanvasItem} from "./CanvasItems/CanvasItem";

export enum GameComponentRangeType
{
    TeamRange = 0,
    GameNumberRange = 1,
    AdvanceToRange = 2,
    FieldRange = 3,
    VLineRange = 4,
    HLineRange = 5,
    DatesRange = 6,
    TourneyHeadingRange = 7,
    ScoreRange = 8,
    Last = ScoreRange
}

export const mapElementTypeToGameComponentRangeType: Map<ElementItem, GameComponentRangeType> = new Map<ElementItem, GameComponentRangeType>(
    [
        [ElementItem.GameTitle, GameComponentRangeType.TeamRange],
        [ElementItem.GameNumber, GameComponentRangeType.GameNumberRange],
        [ElementItem.AdvanceTo, GameComponentRangeType.AdvanceToRange],
        [ElementItem.GameBody, GameComponentRangeType.FieldRange],
        [ElementItem.Dates, GameComponentRangeType.DatesRange],
        [ElementItem.TourneyHeading, GameComponentRangeType.TourneyHeadingRange],
    ]);

export const mapCanvasItemToGameComponentRangeType: Map<CanvasItem, GameComponentRangeType> = new Map<CanvasItem, GameComponentRangeType>(
    [
        [CanvasItem.TeamRows, GameComponentRangeType.TeamRange],
        [CanvasItem.LineRows, GameComponentRangeType.HLineRange],
        [CanvasItem.TeamColumns, GameComponentRangeType.TeamRange],
        [CanvasItem.ScoreColumns, GameComponentRangeType.ScoreRange],
        [CanvasItem.LineColumns, GameComponentRangeType.VLineRange]
    ]);


export class GameComponentRanges
{
    m_ranges: (Excel.Range | null)[] = [];

    public getRangeForElementType(elementType: ElementItem): Excel.Range
    {
        if (!mapElementTypeToGameComponentRangeType.has(elementType))
            throw new Error(`No range type mapping found for element type: ${elementType}`);

        return this.m_ranges[mapElementTypeToGameComponentRangeType.get(elementType)];
    }

    public getRangeForCanvasItem(canvasItem: CanvasItem): Excel.Range
    {
        if (!mapCanvasItemToGameComponentRangeType.has(canvasItem))
            throw new Error(`No range type mapping found for canvas item: ${canvasItem}`);

        return this.m_ranges[mapCanvasItemToGameComponentRangeType.get(canvasItem)];
    }

    get TeamRange(): Excel.Range
    {
        return this.m_ranges[GameComponentRangeType.TeamRange];
    }

    get GameNumberRange(): Excel.Range
    {
        return this.m_ranges[GameComponentRangeType.GameNumberRange];
    }

    get AdvanceToRange(): Excel.Range
    {
        return this.m_ranges[GameComponentRangeType.AdvanceToRange];
    }

    get FieldRange(): Excel.Range
    {
        return this.m_ranges[GameComponentRangeType.FieldRange];
    }

    get VLineRange(): Excel.Range
    {
        return this.m_ranges[GameComponentRangeType.VLineRange];
    }

    get HLineRange(): Excel.Range
    {
        return this.m_ranges[GameComponentRangeType.HLineRange];
    }

    get ScoresRange(): Excel.Range
    {
        return this.m_ranges[GameComponentRangeType.ScoreRange];
    }

    get TourneyHeadingRange(): Excel.Range
    {
        return this.m_ranges[GameComponentRangeType.TourneyHeadingRange];
    }

    constructor(sheet: Excel.Worksheet, game: IBracketGame, rowDates?: number, gridGameStart?: RangeInfo)
    {
        this.m_ranges = [];

        for (let i = 0; i <= GameComponentRangeType.Last; i++)
            this.m_ranges.push(null);

        this.m_ranges[GameComponentRangeType.TeamRange] = Ranges.rangeFromRangeInfo(sheet, game.TopTeamRange);
        this.m_ranges[GameComponentRangeType.GameNumberRange] = Ranges.rangeFromRangeInfo(sheet, game.GameIdRange);
        this.m_ranges[GameComponentRangeType.AdvanceToRange] = Ranges.rangeFromRangeInfo(sheet, game.TopTeamRange.offset(2, 1, 0, 1));
        this.m_ranges[GameComponentRangeType.FieldRange] = Ranges.rangeFromRangeInfo(sheet, game.GameIdRange.offset(0, 1, -1, 1));
        this.m_ranges[GameComponentRangeType.VLineRange] = Ranges.rangeFromRangeInfo(sheet, game.TopTeamRange.offset(0, 1, 2, 1));
        this.m_ranges[GameComponentRangeType.HLineRange] = Ranges.rangeFromRangeInfo(sheet, game.GameIdRange.offset(1, 1, 0, 1));
        this.m_ranges[GameComponentRangeType.ScoreRange] = Ranges.rangeFromRangeInfo(sheet, game.TopTeamRange.offset(0, 1, 1, 1));
        if (gridGameStart)
        {
            const tourneyHeadingRange: RangeInfo = new RangeInfo(0, 1, gridGameStart.FirstColumn, 1);
            this.m_ranges[GameComponentRangeType.TourneyHeadingRange] = Ranges.rangeFromRangeInfo(sheet, tourneyHeadingRange);
        }

        if (rowDates)
        {
            const dateRangeForThisGame: RangeInfo = new RangeInfo(rowDates, 1, game.TopTeamRange.FirstColumn, 1);

            this.m_ranges[GameComponentRangeType.DatesRange] = Ranges.rangeFromRangeInfo(sheet, dateRangeForThisGame);
        }
    }

    enum(callback: (range: Excel.Range) => void): void
    {
        for (const range of this.m_ranges)
            callback(range);
    }
}