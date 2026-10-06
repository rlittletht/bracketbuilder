import { ElementItem } from "./Elements/ElementItem";
import { IBracketGame } from "../../IBracketGame";
import { RangeInfo, Ranges } from "../../../Interop/Ranges";

export enum GameComponentRangeType
{
    TeamRange = 0,
    GameNumberRange = 1,
    AdvanceToRange = 2,
    FieldRange = 3,
    VLineRange = 4,
    HLineRange = 5,
    DatesRange = 6
}

export const mapElementTypeToGameComponentRangeType: Map<ElementItem, GameComponentRangeType> = new Map<ElementItem, GameComponentRangeType>([
    [ElementItem.GameTitle, GameComponentRangeType.TeamRange],
    [ElementItem.GameNumber, GameComponentRangeType.GameNumberRange],
    [ElementItem.AdvanceTo, GameComponentRangeType.AdvanceToRange],
    [ElementItem.GameBody, GameComponentRangeType.FieldRange],
    [ElementItem.Dates, GameComponentRangeType.DatesRange]
]);

export class GameComponentRanges
{
    m_ranges: Excel.Range[] = [];

    public getRangeForElementType(elementType: ElementItem): Excel.Range
    {
        if (!mapElementTypeToGameComponentRangeType.has(elementType))
            throw new Error(`No range type mapping found for element type: ${elementType}`);

        return this.m_ranges[mapElementTypeToGameComponentRangeType.get(elementType)];
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

    constructor(sheet: Excel.Worksheet, game: IBracketGame, rowDates: number)
    {
        this.m_ranges[GameComponentRangeType.TeamRange] = Ranges.rangeFromRangeInfo(sheet, game.TopTeamRange);
        this.m_ranges[GameComponentRangeType.GameNumberRange] = Ranges.rangeFromRangeInfo(sheet, game.GameIdRange);
        this.m_ranges[GameComponentRangeType.AdvanceToRange] = Ranges.rangeFromRangeInfo(sheet, game.TopTeamRange.offset(2, 1, 0, 1));
        this.m_ranges[GameComponentRangeType.FieldRange] = Ranges.rangeFromRangeInfo(sheet, game.GameIdRange.offset(0, 1, -1, 1));
        this.m_ranges[GameComponentRangeType.VLineRange] = Ranges.rangeFromRangeInfo(sheet, game.TopTeamRange.offset(1, 1, 0, 1));
        this.m_ranges[GameComponentRangeType.HLineRange] = Ranges.rangeFromRangeInfo(sheet, game.GameIdRange.offset(0, 1, 1, 1));

        const dateRangeForThisGame: RangeInfo = new RangeInfo(rowDates, 1, game.TopTeamRange.FirstColumn, 1);

        this.m_ranges[GameComponentRangeType.DatesRange] = Ranges.rangeFromRangeInfo(sheet, dateRangeForThisGame);

    }

    enum(callback: (range: Excel.Range) => void): void
    {
        for (const range of this.m_ranges)
            callback(range);
    }
}
