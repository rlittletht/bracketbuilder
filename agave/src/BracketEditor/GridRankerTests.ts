import { IAppContext } from "../AppContext/AppContext";
import { RangeInfo } from "../Interop/Ranges";
import { StreamWriter } from "../Support/StreamWriter";
import { TestResult } from "../Support/TestResult";
import { TestRunner } from "../Support/TestRunner";
import { Grid } from "./Grid";
import { GridRanker } from "./GridRanker";

interface SetupGridRankerTestDelegate
{
    (grid: Grid, gridBetter: Grid) // rankExpected
}

export class GridRankerTests
{
    static runAllTests(appContext: IAppContext, outStream: StreamWriter)
    {
        TestRunner.runAllTests(this, TestResult, appContext, outStream);
    }

    static doGridRankerTest(
        result: TestResult,
        bracket: string,
        delegate: SetupGridRankerTestDelegate,
        firstGridPattern?: RangeInfo)
    {
        let grid: Grid = new Grid();
        let gridBetter: Grid = new Grid();
        grid.m_firstGridPattern = firstGridPattern ?? new RangeInfo(9, 1, 6, 1);
        gridBetter.m_firstGridPattern = firstGridPattern ?? new RangeInfo(9, 1, 6, 1);

        const rankExpected = delegate(grid, gridBetter);

        const rank: number = GridRanker.getGridRank(grid, bracket);
        const rankBetter: number = GridRanker.getGridRank(gridBetter, bracket);

        if (rankBetter == -1)
        {
            result.addError("rankBetter grid was ranked invalid (-1)");
        }
        else
        {
            if (rank == -1)
                result.addError("original grid ranked invalid (-1)");
            else if (rankBetter >= rank)
                result.addError(`!(Rank ${rankBetter} > ${rank})`);
        }

        grid.logGridCondensed();
    }

    static test_danglingFeeder_vs_swappedGame(result: TestResult)
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
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(69, 27, 91, 29,), 23, true).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(43, 30, 81, 32,), 24, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(61, 33, 111, 35,), 25, false).inferGameInternals();

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
            result,
            "T13",
            setup);
    }

    static test_spaceBetweenInSameColumn_PreferExtraSpace(result: TestResult)
    {
        const setup: SetupGridRankerTestDelegate =
            (grid, gridBetter) =>
            {
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 3, 23, 5,), 1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(25, 3, 35, 5,), 2, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 3, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(29, 6, 39, 8,), 4, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(41, 9, 51, 11,), 5, false).inferGameInternals();

                gridBetter.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 3, 23, 5,), 1, false).inferGameInternals();
                gridBetter.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(27, 3, 37, 5,), 2, false).inferGameInternals();
                gridBetter.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 3, false).inferGameInternals();
                gridBetter.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(31, 6, 41, 8,), 4, false).inferGameInternals();
                gridBetter.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(43, 9, 53, 11,), 5, false).inferGameInternals();
            };

        this.doGridRankerTest(
            result,
            "T6",
            setup,
            new RangeInfo(9, 1, 3, 1));
    }

    static test_spaceBetweenInDifferentColumn_DontPreferExtraSpace(result: TestResult)
    {
        const setup: SetupGridRankerTestDelegate =
            (grid, gridBetter) =>
            {
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 3, 23, 5,), 1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(27, 3, 37, 5,), 2, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 3, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(31, 6, 41, 8,), 4, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(45, 9, 55, 11,), 5, false).inferGameInternals();

                gridBetter.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 3, 23, 5,), 1, false).inferGameInternals();
                gridBetter.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(27, 3, 37, 5,), 2, false).inferGameInternals();
                gridBetter.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 3, false).inferGameInternals();
                gridBetter.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(31, 6, 41, 8,), 4, false).inferGameInternals();
                gridBetter.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(43, 9, 53, 11,), 5, false).inferGameInternals();
            };

        this.doGridRankerTest(
            result,
            "T6",
            setup,
            new RangeInfo(9, 1, 3, 1));
    }
}