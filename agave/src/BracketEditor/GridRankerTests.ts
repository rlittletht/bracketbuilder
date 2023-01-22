import { IAppContext } from "../AppContext";
import { Grid } from "./Grid";
import { RangeInfo } from "../Interop/Ranges";
import { IBracketGame, BracketGame, IBracketGame as IBracketGame1 } from "./BracketGame";
import { GridItem } from "./GridItem";
import { GridAdjust } from "./GridAdjusters/GridAdjust";
import { GameMover } from "./GridAdjusters/GameMover";
import { GridChange } from "./GridChange";
import { GameId } from "./GameId";
import { UnitTestContext } from "../taskpane/components/App";
import { GridRanker } from "./GridRanker";

interface SetupGridRankerTestDelegate
{
    (grid: Grid, gridBetter: Grid) // rankExpected
}

export class GridRankerTests
{
    static doGridRankerTest(
        appContext: IAppContext,
        testContext: UnitTestContext,
        testName: string,
        bracket: string,
        delegate: SetupGridRankerTestDelegate)
    {
        appContext;
        testContext.StartTest(testName);

        let grid: Grid = new Grid();
        let gridBetter: Grid = new Grid();
        grid.m_firstGridPattern = new RangeInfo(9, 1, 6, 1);
        gridBetter.m_firstGridPattern = new RangeInfo(9, 1, 6, 1);

        const rankExpected = delegate(grid, gridBetter);

        const rank: number = GridRanker.getGridRank(grid, bracket);
        const rankBetter: number = GridRanker.getGridRank(gridBetter, bracket);

        const passed = rankBetter > rank;

        grid.logGridCondensed();

        if (!passed)
        {
            throw Error(
                `${
                testName
                } failed. !(Rank ${rankBetter} > ${rank})`);
        }
    }

    static test_danglingFeeder_vs_swappedGame(appContext: IAppContext, testContext: UnitTestContext)
    {
        const setup: SetupGridRankerTestDelegate =
            (grid, gridBetter)  =>
            {
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 6, 23, 8,), 1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(27, 6, 37, 8,), 2, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(43, 6, 53, 8,), 3, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(57, 6, 67, 8,), 4, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(71, 6, 81, 8,), 5, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 9, 19, 11,), 6, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(14, 12, 14, 14,), -1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(31, 9, 41, 11,), 7, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(36, 12, 36, 14,), -1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(47, 9, 63, 11,), 8, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(54, 12, 54, 14,), -1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(75, 9, 85, 11,), 9, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(80, 12, 80, 14,), -1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(101, 9, 111, 11,), 10, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(106, 12, 106, 14,), -1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(89, 12, 99, 14,), 11, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(94, 15, 94, 17,), -1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(117, 12, 127, 14,), 12, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(122, 15, 122, 17,), -1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(129, 15, 139, 17,), 13, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(105, 15, 115, 17,), 14, true).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 15, 37, 17,), 15, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(24, 18, 24, 23,), -1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(53, 15, 81, 17,), 16, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(66, 18, 66, 23,), -1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(93, 18, 111, 20,), 17, true).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(121, 18, 135, 20,), 18, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(23, 24, 67, 26,), 19, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(44, 27, 44, 29,), -1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(117, 21, 129, 23,), 20, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(89, 21, 103, 23,), 21, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(95, 24, 123, 26,), 22, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(85, 27, 109, 29,), 23, true).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(43, 30, 117, 32,), 24, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(79, 33, 121, 35,), 25, false).inferGameInternals();

                gridBetter.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 6, 23, 8,), 1, false).inferGameInternals();
                gridBetter.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(27, 6, 37, 8,), 2, false).inferGameInternals();
                gridBetter.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(43, 6, 53, 8,), 3, false).inferGameInternals();
                gridBetter.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(57, 6, 67, 8,), 4, false).inferGameInternals();
                gridBetter.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(71, 6, 81, 8,), 5, false).inferGameInternals();
                gridBetter.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 9, 19, 11,), 6, false).inferGameInternals();
                gridBetter.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(14, 12, 14, 14,), -1, false).inferGameInternals();
                gridBetter.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(31, 9, 41, 11,), 7, false).inferGameInternals();
                gridBetter.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(36, 12, 36, 14,), -1, false).inferGameInternals();
                gridBetter.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(47, 9, 63, 11,), 8, false).inferGameInternals();
                gridBetter.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(54, 12, 54, 14,), -1, false).inferGameInternals();
                gridBetter.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(75, 9, 85, 11,), 9, false).inferGameInternals();
                gridBetter.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(80, 12, 80, 14,), -1, false).inferGameInternals();
                gridBetter.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(101, 9, 111, 11,), 10, false).inferGameInternals();
                gridBetter.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(106, 12, 106, 14,), -1, false).inferGameInternals();
                gridBetter.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(89, 12, 99, 14,), 11, false).inferGameInternals();
                gridBetter.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(94, 15, 94, 17,), -1, false).inferGameInternals();
                gridBetter.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(117, 12, 127, 14,), 12, false).inferGameInternals();
                gridBetter.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(122, 15, 122, 17,), -1, false).inferGameInternals();
                gridBetter.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(129, 15, 139, 17,), 13, false).inferGameInternals();
                gridBetter.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(105, 15, 115, 17,), 14, true).inferGameInternals();
                gridBetter.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 15, 37, 17,), 15, false).inferGameInternals();
                gridBetter.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(24, 18, 24, 23,), -1, false).inferGameInternals();
                gridBetter.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(53, 15, 81, 17,), 16, false).inferGameInternals();
                gridBetter.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(66, 18, 66, 23,), -1, false).inferGameInternals();
                gridBetter.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(93, 18, 111, 20,), 17, true).inferGameInternals();
                gridBetter.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(121, 18, 135, 20,), 18, false).inferGameInternals();
                gridBetter.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(23, 24, 67, 26,), 19, false).inferGameInternals();
                gridBetter.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(44, 27, 44, 29,), -1, false).inferGameInternals();
                gridBetter.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(117, 21, 129, 23,), 20, false).inferGameInternals();
                gridBetter.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(89, 21, 103, 23,), 21, false).inferGameInternals();
                gridBetter.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(95, 24, 123, 26,), 22, false).inferGameInternals();
                gridBetter.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(85, 27, 109, 29,), 23, false).inferGameInternals();
                gridBetter.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(43, 30, 97, 32,), 24, false).inferGameInternals();
                gridBetter.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(69, 33, 111, 35,), 25, false).inferGameInternals();
            };

        this.doGridRankerTest(
            appContext,
            testContext,
            "GridTests.test_danglingFeeder_vs_swappedGame",
            "T13",
            setup);
    }

}