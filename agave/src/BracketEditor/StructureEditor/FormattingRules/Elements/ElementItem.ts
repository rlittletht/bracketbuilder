import { ThemeItem } from "../Themes/ThemeItem";

export enum ElementItem
{
    GameTitle = "Game Title",
    AdvanceTo = "Advance To",
    GameBody = "Game Body",
    GameNumber = "Game Number",
    Dates = "Dates",
    TourneyHeading = "Tournament Heading",
    TourneySubHeading = "Tournament SubHeading",
    Champion = "Champion",
}

export const ElementItemToThemeItemMap: Map<ElementItem, ThemeItem> = new Map<ElementItem, ThemeItem>([
    [ElementItem.GameTitle, ThemeItem.BodyHeading],
    [ElementItem.AdvanceTo, ThemeItem.Body],
    [ElementItem.GameBody, ThemeItem.Body],
    [ElementItem.GameNumber, ThemeItem.Body],
    [ElementItem.Dates, ThemeItem.Body],
    [ElementItem.TourneyHeading, ThemeItem.Header],
    [ElementItem.TourneySubHeading, ThemeItem.Header],
    [ElementItem.Champion, ThemeItem.BodyHeading],
]);