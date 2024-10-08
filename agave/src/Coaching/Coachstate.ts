

export class Coachstate
{
    static Unknown = -1; // before we know anything about the workbook
    static InitialState = 0; // initial state (no bracket chosen)
    static BracketCreation = 0;
    static AddFirstGame = 1; // triggered after transition from unkown/initial -> ready
    static AfterFirstAdd = 2; // triggered on add click when state == addfirstgame
    static DuringConstruction = 3;
    static Championship = 4;
    static AllGamesPlaced = 5;
    static AfterInsertGameFailed = 6;
    static AfterInsertGameFailedOverlapping = 7;
    static GameDirty = 8;
    static BrokenGame = 9;
    static Done = 10;
    static AfterLuckyNext = 11;
    // this is a state where we *think* the user wants to be get the LuckyNext advertisement
    static BeforeLuckyNext = 12;
}
