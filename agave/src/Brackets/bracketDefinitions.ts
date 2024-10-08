import { IBracketDefinitionData } from "./IBracketDefinitionData";

export class TeamPlacement
{
    static Top = "T";
    static Bottom = "B";
}

export class GameResultType
{
    static Winner = "W";
    static Loser = "L";
}

export const s_brackets: IBracketDefinitionData[] =
[
    {
        name: "2 Team",
        teamCount: 2,
        tableName: "T2Bracket",
        games:
        [
            { winner: "T2", loser: "B2", topSource: "Team 1", bottomSource: "Team 2", topSeed: "Seed 1", bottomSeed: "Seed 2" },
            { winner: "T3", loser: "B3", topSource: "W1", bottomSource: "L1" },
            { winner: "T4", loser: "", topSource: "W2", bottomSource: "L2" },
            { winner: "", loser: "", topSource: "W3", bottomSource: "" },
        ]
    },
    {
        name: "3 Team",
        teamCount: 3,
        tableName: "T3Bracket",
        games:
        [
            { winner: "T2", loser: "T3", topSource: "Team 1", bottomSource: "Team 2", topSeed: "Seed 2", bottomSeed: "Seed 3" },
            { winner: "T4", loser: "B3", topSource: "W1", bottomSource: "Team 3", bottomSeed: "Seed 1" },
            { winner: "B4", loser: "", topSource: "L1", bottomSource: "L2" },
            { winner: "T5", loser: "B5", topSource: "W2", bottomSource: "W3" },
            { winner: "T6", loser: "", topSource: "W4", bottomSource: "L4" },
            { winner: "", loser: "", topSource: "W5", bottomSource: "" },
        ]
    },
    {
        name: "4 Team",
        teamCount: 4,
        tableName: "T4Bracket",
        games:
        [
            { winner: "T3", loser: "T4", topSource: "Team 1", bottomSource: "Team 2", topSeed: "Seed 1", bottomSeed: "Seed 4" },
            { winner: "B3", loser: "B4", topSource: "Team 3", bottomSource: "Team 4", topSeed: "Seed 2", bottomSeed: "Seed 3" },
            { winner: "T6", loser: "T5", topSource: "W1", bottomSource: "W2" },
            { winner: "B5", loser: "", topSource: "L1", bottomSource: "L2" },
            { winner: "B6", loser: "", topSource: "L3", bottomSource: "W4" },
            { winner: "T7", loser: "B7", topSource: "W3", bottomSource: "W5" },
            { winner: "T8", loser: "", topSource: "W6", bottomSource: "L6" },
            { winner: "", loser: "", topSource: "W7", bottomSource: "" },
        ]
    },
    {
        name: "5 Team",
        teamCount: 5,
        tableName: "T5Bracket",
        games:
        [
            { winner: "T3", loser: "B4", topSource: "Team 1", bottomSource: "Team 2", topSeed: "Seed 4", bottomSeed: "Seed 5" },
            { winner: "T5", loser: "T4", topSource: "Team 3", bottomSource: "Team 4", topSeed: "Seed 2", bottomSeed: "Seed 3" },
            { winner: "B5", loser: "B6", topSource: "W1", bottomSource: "Team 5", bottomSeed: "Seed 1" },
            { winner: "T6", loser: "", topSource: "L2", bottomSource: "L1" },
            { winner: "T8", loser: "T7", topSource: "W2", bottomSource: "W3" },
            { winner: "B7", loser: "", topSource: "W4", bottomSource: "L3" },
            { winner: "B8", loser: "", topSource: "L5", bottomSource: "W6" },
            { winner: "T9", loser: "B9", topSource: "W5", bottomSource: "W7" },
            { winner: "T10", loser: "", topSource: "W8", bottomSource: "L8" },
            { winner: "", loser: "", topSource: "W9", bottomSource: "" },
        ]
    },
    {
        name: "6 Team",
        teamCount: 6,
        tableName: "T6Bracket",
        games:
        [
            { winner: "B3", loser: "T5", topSource: "Team 1", bottomSource: "Team 2", topSeed: "Seed 4", bottomSeed: "Seed 5" },
            { winner: "T4", loser: "T6", topSource: "Team 3", bottomSource: "Team 4", topSeed: "Seed 3", bottomSeed: "Seed 6" },
            { winner: "T7", loser: "B6", topSource: "Team 5", bottomSource: "W1", topSeed: "Seed 1" },
            { winner: "B7", loser: "B5", topSource: "W2", bottomSource: "Team 6", bottomSeed: "Seed 2" },
            { winner: "T8", loser: "", topSource: "L1", bottomSource: "L4" },
            { winner: "B8", loser: "", topSource: "L2", bottomSource: "L3" },
            { winner: "T10", loser: "T9", topSource: "W3", bottomSource: "W4" },
            { winner: "B9", loser: "", topSource: "W5", bottomSource: "W6" },
            { winner: "B10", loser: "", topSource: "L7", bottomSource: "W8" },
            { winner: "T11", loser: "B11", topSource: "W7", bottomSource: "W9" },
            { winner: "T12", loser: "", topSource: "W10", bottomSource: "L10" },
            { winner: "", loser: "", topSource: "W11", bottomSource: "" },
        ]
    },
    {
        name: "7 Team",
        teamCount: 7,
        tableName: "T7Bracket",
        games:
        [
            { winner: "B4", loser: "T7", topSource: "Team 1", bottomSource: "Team 2", topSeed: "Seed 4", bottomSeed: "Seed 5" },
            { winner: "T5", loser: "T6", topSource: "Team 3", bottomSource: "Team 4", topSeed: "Seed 3", bottomSeed: "Seed 6" },
            { winner: "B5", loser: "B6", topSource: "Team 5", bottomSource: "Team 6", topSeed: "Seed 2", bottomSeed: "Seed 7" },
            { winner: "T9", loser: "B8", topSource: "Team 7", bottomSource: "W1", topSeed: "Seed 1" },
            { winner: "B9", loser: "B7", topSource: "W2", bottomSource: "W3" },
            { winner: "T8", loser: "", topSource: "L2", bottomSource: "L3" },
            { winner: "T10", loser: "", topSource: "L1", bottomSource: "L5" },
            { winner: "B10", loser: "", topSource: "W6", bottomSource: "L4" },
            { winner: "T12", loser: "T11", topSource: "W4", bottomSource: "W5" },
            { winner: "B11", loser: "", topSource: "W7", bottomSource: "W8" },
            { winner: "B12", loser: "", topSource: "L9", bottomSource: "W10" },
            { winner: "T13", loser: "B13", topSource: "W9", bottomSource: "W11" },
            { winner: "T14", loser: "", topSource: "W12", bottomSource: "L12" },
            { winner: "", loser: "", topSource: "W13", bottomSource: "" },
        ]
    },
    {
        name: "8 Team",
        teamCount: 8,
        tableName: "T8Bracket",
        games:
        [
            { winner: "T5", loser: "T7", topSource: "Team 1", bottomSource: "Team 2", topSeed: "Seed 1", bottomSeed: "Seed 8" },
            { winner: "B5", loser: "B7", topSource: "Team 3", bottomSource: "Team 4", topSeed: "Seed 4", bottomSeed: "Seed 5" },
            { winner: "T6", loser: "T8", topSource: "Team 5", bottomSource: "Team 6", topSeed: "Seed 3", bottomSeed: "Seed 6" },
            { winner: "B6", loser: "B8", topSource: "Team 7", bottomSource: "Team 8", topSeed: "Seed 2", bottomSeed: "Seed 7" },
            { winner: "T11", loser: "B10", topSource: "W1", bottomSource: "W2" },
            { winner: "B11", loser: "T9", topSource: "W3", bottomSource: "W4" },
            { winner: "B9", loser: "", topSource: "L1", bottomSource: "L2" },
            { winner: "T10", loser: "", topSource: "L3", bottomSource: "L4" },
            { winner: "T12", loser: "", topSource: "L6", bottomSource: "W7" },
            { winner: "B12", loser: "", topSource: "W8", bottomSource: "L5" },
            { winner: "T14", loser: "T13", topSource: "W5", bottomSource: "W6" },
            { winner: "B13", loser: "", topSource: "W9", bottomSource: "W10" },
            { winner: "B14", loser: "", topSource: "L11", bottomSource: "W12" },
            { winner: "T15", loser: "B15", topSource: "W11", bottomSource: "W13" },
            { winner: "T16", loser: "", topSource: "W14", bottomSource: "L14" },
            { winner: "", loser: "", topSource: "W15", bottomSource: "" },
        ]
    },
    {
        name: "9 Team",
        teamCount: 9,
        tableName: "T9Bracket",
        games:
        [
            { winner: "B5", loser: "B6", topSource: "Team 1", bottomSource: "Team 2", topSeed: "Seed 8", bottomSeed: "Seed 9" },
            { winner: "T9", loser: "T6", topSource: "Team 3", bottomSource: "Team 4", topSeed: "Seed 2", bottomSeed: "Seed 7" },
            { winner: "B9", loser: "B8", topSource: "Team 5", bottomSource: "Team 6", topSeed: "Seed 3", bottomSeed: "Seed 6" },
            { winner: "B10", loser: "B7", topSource: "Team 7", bottomSource: "Team 8", topSeed: "Seed 4", bottomSeed: "Seed 5" },
            { winner: "T10", loser: "T7", topSource: "Team 9", bottomSource: "W1", topSeed: "Seed 1" },
            { winner: "T8", loser: "", topSource: "L2", bottomSource: "L1" },
            { winner: "T11", loser: "", topSource: "L5", bottomSource: "L4" },
            { winner: "B12", loser: "", topSource: "W6", bottomSource: "L3" },
            { winner: "T13", loser: "B11", topSource: "W2", bottomSource: "W3" },
            { winner: "B13", loser: "T12", topSource: "W5", bottomSource: "W4" },
            { winner: "B14", loser: "", topSource: "W7", bottomSource: "L9" },
            { winner: "T14", loser: "", topSource: "L10", bottomSource: "W8" },
            { winner: "T16", loser: "T15", topSource: "W9", bottomSource: "W10" },
            { winner: "B15", loser: "", topSource: "W12", bottomSource: "W11" },
            { winner: "B16", loser: "", topSource: "L13", bottomSource: "W14" },
            { winner: "T17", loser: "B17", topSource: "W13", bottomSource: "W15" },
            { winner: "T18", loser: "", topSource: "W16", bottomSource: "L16" },
            { winner: "", loser: "", topSource: "W17", bottomSource: "" },
        ]
    },
    {
        name: "10 Team",
        teamCount: 10,
        tableName: "T10Bracket",
        games:
        [
            { winner: "T5", loser: "T8", topSource: "Team 1", bottomSource: "Team 2" },
            { winner: "B6", loser: "B7", topSource: "Team 3", bottomSource: "Team 4" },
            { winner: "T11", loser: "T7", topSource: "Team 5", bottomSource: "Team 6" },
            { winner: "B12", loser: "B8", topSource: "Team 9", bottomSource: "Team 10" },
            { winner: "B11", loser: "B9", topSource: "W1", bottomSource: "Team 7" },
            { winner: "T12", loser: "T10", topSource: "Team 8", bottomSource: "W2" },
            { winner: "T9", loser: "", topSource: "L3", bottomSource: "L2" },
            { winner: "B10", loser: "", topSource: "L1", bottomSource: "L4" },
            { winner: "B14", loser: "", topSource: "W7", bottomSource: "L5" },
            { winner: "T13", loser: "", topSource: "L6", bottomSource: "W8" },
            { winner: "T15", loser: "B13", topSource: "W3", bottomSource: "W5" },
            { winner: "B15", loser: "T14", topSource: "W6", bottomSource: "W4" },
            { winner: "B16", loser: "", topSource: "W10", bottomSource: "L11" },
            { winner: "T16", loser: "", topSource: "L12", bottomSource: "W9" },
            { winner: "T18", loser: "T17", topSource: "W11", bottomSource: "W12" },
            { winner: "B17", loser: "", topSource: "W14", bottomSource: "W13" },
            { winner: "B18", loser: "", topSource: "L15", bottomSource: "W16" },
            { winner: "T19", loser: "B19", topSource: "W15", bottomSource: "W17" },
            { winner: "T20", loser: "", topSource: "W18", bottomSource: "L18" },
            { winner: "", loser: "", topSource: "W19", bottomSource: "" }
        ]
    },
    {
        name: "11 Team",
        teamCount: 11,
        tableName: "T11Bracket",
        games:
        [
            { winner: "T5", loser: "T10", topSource: "Team 1", bottomSource: "Team 2", topSeed: "Seed 8", bottomSeed: "Seed 9" },
            { winner: "B6", loser: "B8", topSource: "Team 3", bottomSource: "Team 4", topSeed: "Seed 7", bottomSeed: "Seed 10" },
            { winner: "T7", loser: "B9", topSource: "Team 5", bottomSource: "Team 6", topSeed: "Seed 6", bottomSeed: "Seed 11" },
            { winner: "T13", loser: "T8", topSource: "Team 7", bottomSource: "Team 8", topSeed: "Seed 4", bottomSeed: "Seed 5" },
            { winner: "B13", loser: "T9", topSource: "W1", bottomSource: "Team 9", bottomSeed: "Seed 1" },
            { winner: "T14", loser: "T12", topSource: "Team 10", bottomSource: "W2", topSeed: "Seed 2" },
            { winner: "B14", loser: "B10", topSource: "W3", bottomSource: "Team 11", bottomSeed: "Seed 3" },
            { winner: "T11", loser: "", topSource: "L4", bottomSource: "L2" },
            { winner: "B11", loser: "", topSource: "L5", bottomSource: "L3" },
            { winner: "B12", loser: "", topSource: "L1", bottomSource: "L7" },
            { winner: "B16", loser: "", topSource: "W8", bottomSource: "W9" },
            { winner: "T15", loser: "", topSource: "L6", bottomSource: "W10" },
            { winner: "T17", loser: "B15", topSource: "W4", bottomSource: "W5" },
            { winner: "B17", loser: "T16", topSource: "W6", bottomSource: "W7" },
            { winner: "B18", loser: "", topSource: "W12", bottomSource: "L13" },
            { winner: "T18", loser: "", topSource: "L14", bottomSource: "W11" },
            { winner: "T20", loser: "T19", topSource: "W13", bottomSource: "W14" },
            { winner: "B19", loser: "", topSource: "W16", bottomSource: "W15" },
            { winner: "B20", loser: "", topSource: "L17", bottomSource: "W18" },
            { winner: "T21", loser: "B21", topSource: "W17", bottomSource: "W19" },
            { winner: "T22", loser: "", topSource: "W20", bottomSource: "L20" },
            { winner: "", loser: "", topSource: "W21", bottomSource: "" },
        ]
    },
    {
        name: "12 Team",
        teamCount: 12,
        tableName: "T12Bracket",
        games:
        [
            { winner: "B5", loser: "T11", topSource: "Team 1", bottomSource: "Team 2", topSeed: "Seed 8", bottomSeed: "Seed 9" },
            { winner: "T6", loser: "T12", topSource: "Team 3", bottomSource: "Team 4", topSeed: "Seed 5", bottomSeed: "Seed 12" },
            { winner: "B7", loser: "T9", topSource: "Team 5", bottomSource: "Team 6", topSeed: "Seed 6", bottomSeed: "Seed 11" },
            { winner: "T8", loser: "T10", topSource: "Team 7", bottomSource: "Team 8", topSeed: "Seed 7", bottomSeed: "Seed 10" },
            { winner: "T15", loser: "B9", topSource: "Team 9", bottomSource: "W1", topSeed: "Seed 1" },
            { winner: "B15", loser: "B10", topSource: "W2", bottomSource: "Team 10", bottomSeed: "Seed 4" },
            { winner: "T16", loser: "B11", topSource: "Team 11", bottomSource: "W3", topSeed: "Seed 3" },
            { winner: "B16", loser: "B12", topSource: "W4", bottomSource: "Team 12", bottomSeed: "Seed 2" },
            { winner: "T13", loser: "", topSource: "L3", bottomSource: "L5" },
            { winner: "B13", loser: "", topSource: "L4", bottomSource: "L6" },
            { winner: "T14", loser: "", topSource: "L1", bottomSource: "L7" },
            { winner: "B14", loser: "", topSource: "L2", bottomSource: "L8" },
            { winner: "B18", loser: "", topSource: "W9", bottomSource: "W10" },
            { winner: "B17", loser: "", topSource: "W11", bottomSource: "W12" },
            { winner: "T19", loser: "T17", topSource: "W5", bottomSource: "W6" },
            { winner: "B19", loser: "T18", topSource: "W7", bottomSource: "W8" },
            { winner: "B20", loser: "", topSource: "L15", bottomSource: "W14" },
            { winner: "T20", loser: "", topSource: "L16", bottomSource: "W13" },
            { winner: "T22", loser: "T21", topSource: "W15", bottomSource: "W16" },
            { winner: "B21", loser: "", topSource: "W18", bottomSource: "W17" },
            { winner: "B22", loser: "", topSource: "L19", bottomSource: "W20" },
            { winner: "T23", loser: "B23", topSource: "W19", bottomSource: "W21" },
            { winner: "T24", loser: "", topSource: "W22", bottomSource: "L22" },
            { winner: "", loser: "", topSource: "W23", bottomSource: "" },
        ]
    },
    {
        name: "13 Team",
        teamCount: 13,
        tableName: "T13Bracket",
        games:
        [
            { winner: "B6", loser: "T12", topSource: "Team 1", bottomSource: "Team 2", topSeed: "Seed 7", bottomSeed: "Seed 10" },
            { winner: "T7", loser: "T13", topSource: "Team 3", bottomSource: "Team 4", topSeed: "Seed 6", bottomSeed: "Seed 11" },
            { winner: "T8", loser: "T10", topSource: "Team 5", bottomSource: "Team 6", topSeed: "Seed 4", bottomSeed: "Seed 13" },
            { winner: "B8", loser: "B10", topSource: "Team 7", bottomSource: "Team 8", topSeed: "Seed 5", bottomSeed: "Seed 12" },
            { winner: "T9", loser: "T11", topSource: "Team 9", bottomSource: "Team 10", topSeed: "Seed 8", bottomSeed: "Seed 9" },
            { winner: "T15", loser: "T14", topSource: "Team 11", bottomSource: "W1", topSeed: "Seed 2" },
            { winner: "B15", loser: "B11", topSource: "W2", bottomSource: "Team 12", bottomSeed: "Seed 3" },
            { winner: "T16", loser: "B12", topSource: "W3", bottomSource: "W4" },
            { winner: "B16", loser: "B13", topSource: "W5", bottomSource: "Team 13", bottomSeed: "Seed 1" },
            { winner: "B14", loser: "", topSource: "L3", bottomSource: "L4" },
            { winner: "B17", loser: "", topSource: "L5", bottomSource: "L7" },
            { winner: "T18", loser: "", topSource: "L1", bottomSource: "L8" },
            { winner: "B18", loser: "", topSource: "L2", bottomSource: "L9" },
            { winner: "T17", loser: "", topSource: "L6", bottomSource: "W10" },
            { winner: "T19", loser: "T20", topSource: "W6", bottomSource: "W7" },
            { winner: "B19", loser: "T21", topSource: "W8", bottomSource: "W9" },
            { winner: "B21", loser: "", topSource: "W14", bottomSource: "W11" },
            { winner: "B20", loser: "", topSource: "W12", bottomSource: "W13" },
            { winner: "T24", loser: "T23", topSource: "W15", bottomSource: "W16" },
            { winner: "B22", loser: "", topSource: "L15", bottomSource: "W18" },
            { winner: "T22", loser: "", topSource: "L16", bottomSource: "W17" },
            { winner: "B23", loser: "", topSource: "W21", bottomSource: "W20" },
            { winner: "B24", loser: "", topSource: "L19", bottomSource: "W22" },
            { winner: "T25", loser: "B25", topSource: "W19", bottomSource: "W23" },
            { winner: "T26", loser: "", topSource: "W24", bottomSource: "L24" },
            { winner: "", loser: "", topSource: "W25", bottomSource: "" },
        ]
    },
    {
        name: "14 Team",
        teamCount: 14,
        tableName: "T14Bracket",
        games:
        [
            { winner: "B7", loser: "T14", topSource: "Team 1", bottomSource: "Team 2", topSeed: "Seed 8", bottomSeed: "Seed 9" },
            { winner: "T8", loser: "T12", topSource: "Team 3", bottomSource: "Team 4", topSeed: "Seed 5", bottomSeed: "Seed 12" },
            { winner: "B8", loser: "B12", topSource: "Team 5", bottomSource: "Team 6", topSeed: "Seed 4", bottomSeed: "Seed 13" },
            { winner: "T9", loser: "T11", topSource: "Team 7", bottomSource: "Team 8", topSeed: "Seed 3", bottomSeed: "Seed 14" },
            { winner: "B9", loser: "B11", topSource: "Team 9", bottomSource: "Team 10", topSeed: "Seed 6", bottomSeed: "Seed 11" },
            { winner: "T10", loser: "B13", topSource: "Team 11", bottomSource: "Team 12", topSeed: "Seed 7", bottomSeed: "Seed 10" },
            { winner: "T17", loser: "T15", topSource: "Team 13", bottomSource: "W1", topSeed: "Seed 1" },
            { winner: "B17", loser: "T13", topSource: "W2", bottomSource: "W3" },
            { winner: "T18", loser: "B14", topSource: "W4", bottomSource: "W5" },
            { winner: "B18", loser: "B16", topSource: "W6", bottomSource: "Team 14", bottomSeed: "Seed 2" },
            { winner: "B15", loser: "", topSource: "L4", bottomSource: "L5" },
            { winner: "T16", loser: "", topSource: "L2", bottomSource: "L3" },
            { winner: "B19", loser: "", topSource: "L8", bottomSource: "L6" },
            { winner: "T20", loser: "", topSource: "L1", bottomSource: "L9" },
            { winner: "T19", loser: "", topSource: "L7", bottomSource: "W11" },
            { winner: "B20", loser: "", topSource: "W12", bottomSource: "L10" },
            { winner: "T21", loser: "T22", topSource: "W7", bottomSource: "W8" },
            { winner: "B21", loser: "T23", topSource: "W9", bottomSource: "W10" },
            { winner: "B23", loser: "", topSource: "W15", bottomSource: "W13" },
            { winner: "B22", loser: "", topSource: "W14", bottomSource: "W16" },
            { winner: "T26", loser: "T25", topSource: "W17", bottomSource: "W18" },
            { winner: "B24", loser: "", topSource: "L17", bottomSource: "W20" },
            { winner: "T24", loser: "", topSource: "L18", bottomSource: "W19" },
            { winner: "B25", loser: "", topSource: "W23", bottomSource: "W22" },
            { winner: "B26", loser: "", topSource: "L21", bottomSource: "W24" },
            { winner: "T27", loser: "B27", topSource: "W21", bottomSource: "W25" },
            { winner: "T28", loser: "", topSource: "W26", bottomSource: "L26" },
            { winner: "", loser: "", topSource: "W27", bottomSource: "" },
        ]
    },
    {
        name: "15 Team",
        teamCount: 15,
        tableName: "T15Bracket",
        games:
        [
            { winner: "B8", loser: "T15", topSource: "Team 1", bottomSource: "Team 2", topSeed: "Seed 8", bottomSeed: "Seed 9" },
            { winner: "T9", loser: "T14", topSource: "Team 3", bottomSource: "Team 4", topSeed: "Seed 5", bottomSeed: "Seed 12" },
            { winner: "B9", loser: "B14", topSource: "Team 5", bottomSource: "Team 6", topSeed: "Seed 4", bottomSeed: "Seed 13" },
            { winner: "T10", loser: "T12", topSource: "Team 7", bottomSource: "Team 8", topSeed: "Seed 3", bottomSeed: "Seed 14" },
            { winner: "B10", loser: "B12", topSource: "Team 9", bottomSource: "Team 10", topSeed: "Seed 6", bottomSeed: "Seed 11" },
            { winner: "T11", loser: "T13", topSource: "Team 11", bottomSource: "Team 12", topSeed: "Seed 7", bottomSeed: "Seed 10" },
            { winner: "B11", loser: "B13", topSource: "Team 13", bottomSource: "Team 14", topSeed: "Seed 2", bottomSeed: "Seed 15" },
            { winner: "T19", loser: "T16", topSource: "Team 15", bottomSource: "W1", topSeed: "Seed 1" },
            { winner: "B19", loser: "B17", topSource: "W2", bottomSource: "W3" },
            { winner: "T20", loser: "B15", topSource: "W4", bottomSource: "W5" },
            { winner: "B20", loser: "B18", topSource: "W6", bottomSource: "W7" },
            { winner: "B16", loser: "", topSource: "L4", bottomSource: "L5" },
            { winner: "T17", loser: "", topSource: "L6", bottomSource: "L7" },
            { winner: "T18", loser: "", topSource: "L2", bottomSource: "L3" },
            { winner: "T22", loser: "", topSource: "L1", bottomSource: "L10" },
            { winner: "T21", loser: "", topSource: "L8", bottomSource: "W12" },
            { winner: "B21", loser: "", topSource: "W13", bottomSource: "L9" },
            { winner: "B22", loser: "", topSource: "W14", bottomSource: "L11" },
            { winner: "T23", loser: "T24", topSource: "W8", bottomSource: "W9" },
            { winner: "B23", loser: "T25", topSource: "W10", bottomSource: "W11" },
            { winner: "B25", loser: "", topSource: "W16", bottomSource: "W17" },
            { winner: "B24", loser: "", topSource: "W15", bottomSource: "W18" },
            { winner: "T28", loser: "T27", topSource: "W19", bottomSource: "W20" },
            { winner: "B26", loser: "", topSource: "L19", bottomSource: "W22" },
            { winner: "T26", loser: "", topSource: "L20", bottomSource: "W21" },
            { winner: "B27", loser: "", topSource: "W25", bottomSource: "W24" },
            { winner: "B28", loser: "", topSource: "L23", bottomSource: "W26" },
            { winner: "T29", loser: "B29", topSource: "W23", bottomSource: "W27" },
            { winner: "T30", loser: "", topSource: "W28", bottomSource: "L28" },
            { winner: "", loser: "", topSource: "W29", bottomSource: "" },
        ]
    },
    {
        name: "16 Team",
        teamCount: 16,
        tableName: "T16Bracket",
        games:
        [
            { winner: "T9", loser: "T13", topSource: "Team 1", bottomSource: "Team 2", topSeed: "Seed 1", bottomSeed: "Seed 16" },
            { winner: "B9", loser: "B13", topSource: "Team 3", bottomSource: "Team 4", topSeed: "Seed 8", bottomSeed: "Seed 9" },
            { winner: "T10", loser: "T14", topSource: "Team 5", bottomSource: "Team 6", topSeed: "Seed 5", bottomSeed: "Seed 12" },
            { winner: "B10", loser: "B14", topSource: "Team 7", bottomSource: "Team 8", topSeed: "Seed 4", bottomSeed: "Seed 13" },
            { winner: "T11", loser: "T15", topSource: "Team 9", bottomSource: "Team 10", topSeed: "Seed 3", bottomSeed: "Seed 14" },
            { winner: "B11", loser: "B15", topSource: "Team 11", bottomSource: "Team 12", topSeed: "Seed 6", bottomSeed: "Seed 11" },
            { winner: "T12", loser: "T16", topSource: "Team 13", bottomSource: "Team 14", topSeed: "Seed 7", bottomSeed: "Seed 10" },
            { winner: "B12", loser: "B16", topSource: "Team 15", bottomSource: "Team 16", topSeed: "Seed 2", bottomSeed: "Seed 15" },
            { winner: "T21", loser: "B20", topSource: "W1", bottomSource: "W2" },
            { winner: "B21", loser: "T19", topSource: "W3", bottomSource: "W4" },
            { winner: "T22", loser: "B18", topSource: "W5", bottomSource: "W6" },
            { winner: "B22", loser: "T17", topSource: "W7", bottomSource: "W8" },
            { winner: "B17", loser: "", topSource: "L1", bottomSource: "L2" },
            { winner: "T18", loser: "", topSource: "L3", bottomSource: "L4" },
            { winner: "B19", loser: "", topSource: "L5", bottomSource: "L6" },
            { winner: "T20", loser: "", topSource: "L7", bottomSource: "L8" },
            { winner: "T23", loser: "", topSource: "L12", bottomSource: "W13" },
            { winner: "B23", loser: "", topSource: "W14", bottomSource: "L11" },
            { winner: "T24", loser: "", topSource: "L10", bottomSource: "W15" },
            { winner: "B24", loser: "", topSource: "W16", bottomSource: "L9" },
            { winner: "T25", loser: "T27", topSource: "W9", bottomSource: "W10" },
            { winner: "B25", loser: "T26", topSource: "W11", bottomSource: "W12" },
            { winner: "B27", loser: "", topSource: "W17", bottomSource: "W18" },
            { winner: "B26", loser: "", topSource: "W19", bottomSource: "W20" },
            { winner: "T30", loser: "T29", topSource: "W21", bottomSource: "W22" },
            { winner: "B28", loser: "", topSource: "L22", bottomSource: "W24" },
            { winner: "T28", loser: "", topSource: "L21", bottomSource: "W23" },
            { winner: "B29", loser: "", topSource: "W27", bottomSource: "W26" },
            { winner: "B30", loser: "", topSource: "L25", bottomSource: "W28" },
            { winner: "T31", loser: "B31", topSource: "W25", bottomSource: "W29" },
            { winner: "T32", loser: "", topSource: "W30", bottomSource: "L30" },
            { winner: "", loser: "", topSource: "W31", bottomSource: "" },
        ]
    }
];
// 1
// 2
// 3
// 4
// 5
// 6
// 7
// 8
// 9
// 10
// 11
// 12
// 13
// 14
// 15
// 16
// 17
// 18
// 19
// 20
// 21
// 22
// 23
// 24
// 25
// 26
// 27
// 28
// 29
// 30