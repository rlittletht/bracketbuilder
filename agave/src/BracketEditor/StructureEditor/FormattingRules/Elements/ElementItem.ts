import { ThemeItem } from "../Themes/ThemeItem";

export enum ElementItem
{
    GameTitle = "Game Title",
    AdvanceTo = "Advance To",
    GameBody = "Game Body",
    GameNumber = "Game Number",
    Dates = "Dates",
    TourneyHeading1 = "Tournament Heading 1",
    TourneyHeading2 = "Tournament Heading 2",
    TourneyHeading3 = "Tournament Heading 3",
    TourneySubHeading = "Tournament SubHeading",
    Champion = "Champion",
}

export const ElementItemToThemeItemMap: Map<ElementItem, ThemeItem> = new Map<ElementItem, ThemeItem>([
    [ElementItem.GameTitle, ThemeItem.BodyHeading],
    [ElementItem.AdvanceTo, ThemeItem.Body],
    [ElementItem.GameBody, ThemeItem.Body],
    [ElementItem.GameNumber, ThemeItem.Body],
    [ElementItem.Dates, ThemeItem.Body],
    [ElementItem.TourneyHeading1, ThemeItem.Header],
    [ElementItem.TourneyHeading2, ThemeItem.Header],
    [ElementItem.TourneyHeading3, ThemeItem.Header],
    [ElementItem.TourneySubHeading, ThemeItem.Header],
    [ElementItem.Champion, ThemeItem.BodyHeading],
]);