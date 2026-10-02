import { AppContext, IAppContext } from "../../AppContext/AppContext";
import { RangeInfo } from "../../Interop/Ranges";
import { StreamWriter } from "../../Support/StreamWriter";
import { TestResult } from "../../Support/TestResult";
import { TestRunner } from "../../Support/TestRunner";
import { GameId } from "../GameId";
import { GameMover } from "./GameMover";
import { GameMoverSimple } from "./GameMoverSimple";
import { Grid } from "../Grid";
import { GridChange } from "../GridChange";
import { GridItem } from "../GridItem";
import * as GridRanker from "../GridRanker";

interface SetupTestDelegate
{
    (grid: Grid, gridExpected: Grid, bracketName: string): [GridItem, GridItem];
}

export class GameMoverSimpleTests
{
    static runAllTests(appContext: IAppContext, outStream: StreamWriter)
    {
        TestRunner.runAllTests(this, TestResult, appContext, outStream);
    }

    static doGameMoverTest(
        testName: string,
        result: TestResult,
        bracket: string,
        delegate: SetupTestDelegate,
        firstGridPattern?: RangeInfo)
    {
        let grid: Grid = new Grid();
        if (firstGridPattern)
            grid.m_firstGridPattern = firstGridPattern;
        else
            grid.m_firstGridPattern = new RangeInfo(9, 1, 6, 1);

        let gridExpected: Grid = grid.clone(); // clone so we get the same first grid pattern

        const [itemOld, itemNew] = delegate(grid, gridExpected, bracket);

        let mover: GameMoverSimple = new GameMoverSimple(grid);

        const adjustedGames = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

        for (let gameId of adjustedGames)
            mover.removeOpenFeedRelativeMeasureForGameId(new GameId(gameId));

        // first, make sure the starting grid is valid
        const rank: number = GridRanker.GridRanker.getGridRank(grid, bracket);

        if (rank == -1)
        {
            result.addError("starting grid invalid. bad test");
            return;
        }

        console.log(
            `original (rank=${rank
            })|`);
        grid.logGridCondensed();
        // clone the old item to make sure we are disconnected from the grid we are
        // about to change
        let gridResult: Grid = mover.moveGame(itemOld.clone(), itemNew, bracket);

        if (!gridResult)
        {
            result.addError("no gridResult returned");
            return;
        }

        const changes: GridChange[] = gridResult.diff(gridExpected, bracket);
        if (changes.length != 0)
        {
            gridResult.logGridCondensed(testName);

            grid.logChanges(changes);
            result.addError(
                `${grid.logChangesToString(changes)
                }`);
            return;
        }
    }

    static SetupGridForInitialState(grid: Grid, bracketName: string)
    {
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 3, 23, 5,), 1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(27, 3, 37, 5,), 2, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(43, 3, 53, 5,), 3, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(57, 3, 67, 5,), 4, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(71, 3, 81, 5,), 5, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 6, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(14, 9, 14, 11,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(31, 6, 41, 8,), 7, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(36, 9, 36, 11,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(47, 6, 63, 8,), 8, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(54, 9, 54, 11,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(75, 6, 85, 8,), 9, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(80, 9, 80, 11,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(101, 6, 111, 8,), 10, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(89, 9, 99, 11,), 11, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(117, 9, 127, 11,), 12, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(129, 9, 139, 11,), 13, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(105, 9, 115, 11,), 14, true).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 12, 37, 14,), 15, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(24, 15, 24, 17,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(53, 12, 81, 14,), 16, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(66, 15, 66, 17,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(93, 12, 111, 14,), 17, true).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(121, 12, 135, 14,), 18, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(23, 18, 67, 20,), 19, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(44, 21, 44, 23,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(117, 15, 129, 17,), 20, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(89, 15, 103, 17,), 21, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(95, 18, 123, 20,), 22, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(107, 21, 127, 23,), 23, true).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(43, 24, 117, 26,), 24, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(79, 27, 121, 29,), 25, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(99, 30, 101, 32,), 26, false).inferGameInternalsWithCache(bracketName);
    }

    static SetupGridForStep1Result(grid: Grid, bracketName: string)
    {
        // move down 52, expand by 4
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 3, 23, 5,), 1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(27, 3, 37, 5,), 2, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(43, 3, 53, 5,), 3, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(57, 3, 67, 5,), 4, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(71, 3, 81, 5,), 5, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 6, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(14, 9, 14, 11,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(31, 6, 41, 8,), 7, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(36, 9, 36, 11,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(47, 6, 63, 8,), 8, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(54, 9, 54, 11,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(75, 6, 85, 8,), 9, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(80, 9, 80, 11,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(101, 6, 111, 8,), 10, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(89, 9, 99, 11,), 11, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(117, 9, 127, 11,), 12, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(181, 9, 195, 11,), 13, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(105, 9, 115, 11,), 14, true).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 12, 37, 14,), 15, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(24, 15, 24, 17,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(53, 12, 81, 14,), 16, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(66, 15, 66, 17,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(93, 12, 111, 14,), 17, true).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(121, 12, 189, 14,), 18, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(23, 18, 67, 20,), 19, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(44, 21, 44, 23,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(117, 15, 155, 17,), 20, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(89, 15, 103, 17,), 21, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(95, 18, 137, 20,), 22, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(115, 21, 141, 23,), 23, true).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(43, 24, 129, 26,), 24, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(85, 27, 133, 29,), 25, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(107, 30, 109, 32,), 26, false).inferGameInternalsWithCache(bracketName);
    }

    static SetupGridForStep2Result(grid: Grid, bracketName: string)
    {
        // move 12 down 46, expand by 4
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 3, 23, 5,), 1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(27, 3, 37, 5,), 2, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(43, 3, 53, 5,), 3, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(57, 3, 67, 5,), 4, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(71, 3, 81, 5,), 5, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 6, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(14, 9, 14, 11,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(31, 6, 41, 8,), 7, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(36, 9, 36, 11,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(47, 6, 63, 8,), 8, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(54, 9, 54, 11,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(75, 6, 85, 8,), 9, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(80, 9, 80, 11,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(101, 6, 111, 8,), 10, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(89, 9, 99, 11,), 11, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(163, 9, 177, 11,), 12, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(181, 9, 195, 11,), 13, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(105, 9, 115, 11,), 14, true).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 12, 37, 14,), 15, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(24, 15, 24, 17,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(53, 12, 81, 14,), 16, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(66, 15, 66, 17,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(93, 12, 111, 14,), 17, true).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(169, 12, 189, 14,), 18, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(23, 18, 67, 20,), 19, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(44, 21, 44, 23,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(165, 15, 179, 17,), 20, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(89, 15, 103, 17,), 21, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(95, 18, 173, 20,), 22, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(133, 21, 177, 23,), 23, true).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(43, 24, 155, 26,), 24, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(97, 27, 159, 29,), 25, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(127, 30, 129, 32,), 26, false).inferGameInternalsWithCache(bracketName);
    }

    static SetupGridForStep3Result(grid: Grid, bracketName: string)
    {
        // expand game 14 by 4
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 3, 23, 5,), 1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(27, 3, 37, 5,), 2, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(43, 3, 53, 5,), 3, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(57, 3, 67, 5,), 4, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(71, 3, 81, 5,), 5, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 6, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(14, 9, 14, 11,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(31, 6, 41, 8,), 7, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(36, 9, 36, 11,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(47, 6, 63, 8,), 8, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(54, 9, 54, 11,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(75, 6, 85, 8,), 9, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(80, 9, 80, 11,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(101, 6, 111, 8,), 10, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(89, 9, 99, 11,), 11, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(163, 9, 177, 11,), 12, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(181, 9, 195, 11,), 13, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(105, 9, 119, 11,), 14, true).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 12, 37, 14,), 15, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(24, 15, 24, 17,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(53, 12, 81, 14,), 16, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(66, 15, 66, 17,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(93, 12, 113, 14,), 17, true).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(169, 12, 189, 14,), 18, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(23, 18, 67, 20,), 19, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(44, 21, 44, 23,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(165, 15, 179, 17,), 20, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(89, 15, 103, 17,), 21, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(95, 18, 173, 20,), 22, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(133, 21, 177, 23,), 23, true).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(43, 24, 155, 26,), 24, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(97, 27, 159, 29,), 25, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(127, 30, 129, 32,), 26, false).inferGameInternalsWithCache(bracketName);
    }

    static SetupGridForStep4Result(grid: Grid, bracketName: string)
    {
        // move 10 down by 38, expand by 4
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 3, 23, 5,), 1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(27, 3, 37, 5,), 2, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(43, 3, 53, 5,), 3, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(57, 3, 67, 5,), 4, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(71, 3, 81, 5,), 5, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 6, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(14, 9, 14, 11,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(31, 6, 41, 8,), 7, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(36, 9, 36, 11,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(47, 6, 63, 8,), 8, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(54, 9, 54, 11,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(75, 6, 85, 8,), 9, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(80, 9, 80, 11,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(139, 6, 153, 8,), 10, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(89, 9, 99, 11,), 11, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(163, 9, 177, 11,), 12, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(181, 9, 195, 11,), 13, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(145, 9, 159, 11,), 14, true).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 12, 37, 14,), 15, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(24, 15, 24, 17,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(53, 12, 81, 14,), 16, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(66, 15, 66, 17,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(93, 12, 153, 14,), 17, true).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(169, 12, 189, 14,), 18, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(23, 18, 67, 20,), 19, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(44, 21, 44, 23,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(165, 15, 179, 17,), 20, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(89, 15, 123, 17,), 21, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(105, 18, 173, 20,), 22, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(137, 21, 177, 23,), 23, true).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(43, 24, 157, 26,), 24, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(99, 27, 161, 29,), 25, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(129, 30, 131, 32,), 26, false).inferGameInternalsWithCache(bracketName);
    }

    static SetupGridForStep5Result(grid: Grid, bracketName: string)
    {
        // move game 11 down 32, expand by 4
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 3, 23, 5,), 1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(27, 3, 37, 5,), 2, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(43, 3, 53, 5,), 3, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(57, 3, 67, 5,), 4, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(71, 3, 81, 5,), 5, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 6, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(14, 9, 14, 11,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(31, 6, 41, 8,), 7, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(36, 9, 36, 11,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(47, 6, 63, 8,), 8, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(54, 9, 54, 11,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(75, 6, 85, 8,), 9, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(80, 9, 80, 11,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(139, 6, 153, 8,), 10, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(121, 9, 135, 11,), 11, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(163, 9, 177, 11,), 12, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(181, 9, 195, 11,), 13, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(145, 9, 159, 11,), 14, true).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 12, 37, 14,), 15, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(24, 15, 24, 17,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(53, 12, 81, 14,), 16, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(66, 15, 66, 17,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(127, 12, 153, 14,), 17, true).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(169, 12, 189, 14,), 18, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(23, 18, 67, 20,), 19, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(44, 21, 44, 23,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(165, 15, 179, 17,), 20, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(123, 15, 141, 17,), 21, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(131, 18, 173, 20,), 22, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(151, 21, 177, 23,), 23, true).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(43, 24, 165, 26,), 24, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(103, 27, 169, 29,), 25, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(135, 30, 137, 32,), 26, false).inferGameInternalsWithCache(bracketName);
    }

    static SetupGridForStep6Result(grid: Grid, bracketName: string)
    {
        // expand game 9 by 4
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 3, 23, 5,), 1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(27, 3, 37, 5,), 2, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(43, 3, 53, 5,), 3, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(57, 3, 67, 5,), 4, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(71, 3, 81, 5,), 5, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 6, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(14, 9, 14, 11,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(31, 6, 41, 8,), 7, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(36, 9, 36, 11,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(47, 6, 63, 8,), 8, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(54, 9, 54, 11,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(75, 6, 89, 8,), 9, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(82, 9, 82, 11,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(139, 6, 153, 8,), 10, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(121, 9, 135, 11,), 11, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(163, 9, 177, 11,), 12, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(181, 9, 195, 11,), 13, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(145, 9, 159, 11,), 14, true).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 12, 37, 14,), 15, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(24, 15, 24, 17,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(53, 12, 83, 14,), 16, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(68, 15, 68, 17,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(127, 12, 153, 14,), 17, true).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(169, 12, 189, 14,), 18, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(23, 18, 69, 20,), 19, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(46, 21, 46, 23,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(165, 15, 179, 17,), 20, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(123, 15, 141, 17,), 21, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(131, 18, 173, 20,), 22, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(151, 21, 177, 23,), 23, true).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(45, 24, 165, 26,), 24, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(103, 27, 169, 29,), 25, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(135, 30, 137, 32,), 26, false).inferGameInternalsWithCache(bracketName);
    }

    static SetupGridForStep7Result(grid: Grid, bracketName: string)
    {
        // move game 5 down 26, expand by 4
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 3, 23, 5,), 1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(27, 3, 37, 5,), 2, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(43, 3, 53, 5,), 3, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(57, 3, 67, 5,), 4, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(97, 3, 111, 5,), 5, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 6, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(14, 9, 14, 11,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(31, 6, 41, 8,), 7, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(36, 9, 36, 11,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(47, 6, 63, 8,), 8, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(54, 9, 54, 11,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(103, 6, 117, 8,), 9, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(110, 9, 110, 11,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(139, 6, 153, 8,), 10, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(121, 9, 135, 11,), 11, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(163, 9, 177, 11,), 12, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(181, 9, 195, 11,), 13, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(145, 9, 159, 11,), 14, true).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 12, 37, 14,), 15, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(24, 15, 24, 17,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(53, 12, 111, 14,), 16, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(82, 15, 82, 17,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(127, 12, 153, 14,), 17, true).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(169, 12, 189, 14,), 18, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(23, 18, 83, 20,), 19, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(52, 21, 52, 23,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(165, 15, 179, 17,), 20, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(123, 15, 141, 17,), 21, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(131, 18, 173, 20,), 22, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(151, 21, 177, 23,), 23, true).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(51, 24, 165, 26,), 24, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(107, 27, 169, 29,), 25, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(137, 30, 139, 32,), 26, false).inferGameInternalsWithCache(bracketName);
    }

    static SetupGridForStep8Result(grid: Grid, bracketName: string)
    {
        // move game 4 down 20, expand by 4
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 3, 23, 5,), 1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(27, 3, 37, 5,), 2, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(43, 3, 53, 5,), 3, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(77, 3, 91, 5,), 4, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(97, 3, 111, 5,), 5, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 6, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(14, 9, 14, 11,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(31, 6, 41, 8,), 7, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(36, 9, 36, 11,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(47, 6, 85, 8,), 8, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(66, 9, 66, 11,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(103, 6, 117, 8,), 9, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(110, 9, 110, 11,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(139, 6, 153, 8,), 10, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(121, 9, 135, 11,), 11, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(163, 9, 177, 11,), 12, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(181, 9, 195, 11,), 13, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(145, 9, 159, 11,), 14, true).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 12, 37, 14,), 15, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(24, 15, 24, 17,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(65, 12, 111, 14,), 16, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(88, 15, 88, 17,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(127, 12, 153, 14,), 17, true).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(169, 12, 189, 14,), 18, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(23, 18, 89, 20,), 19, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(56, 21, 56, 23,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(165, 15, 179, 17,), 20, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(123, 15, 141, 17,), 21, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(131, 18, 173, 20,), 22, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(151, 21, 177, 23,), 23, true).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(55, 24, 165, 26,), 24, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(109, 27, 169, 29,), 25, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(137, 30, 139, 32,), 26, false).inferGameInternalsWithCache(bracketName);
    }

    static SetupGridForStep9Result(grid: Grid, bracketName: string)
    {
        // move game 3 down by 14, expand by 4
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 3, 23, 5,), 1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(27, 3, 37, 5,), 2, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(57, 3, 71, 5,), 3, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(77, 3, 91, 5,), 4, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(97, 3, 111, 5,), 5, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 6, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(14, 9, 14, 11,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(31, 6, 41, 8,), 7, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(36, 9, 36, 11,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(63, 6, 85, 8,), 8, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(74, 9, 74, 11,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(103, 6, 117, 8,), 9, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(110, 9, 110, 11,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(139, 6, 153, 8,), 10, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(121, 9, 135, 11,), 11, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(163, 9, 177, 11,), 12, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(181, 9, 195, 11,), 13, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(145, 9, 159, 11,), 14, true).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 12, 37, 14,), 15, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(24, 15, 24, 17,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(73, 12, 111, 14,), 16, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(92, 15, 92, 17,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(127, 12, 153, 14,), 17, true).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(169, 12, 189, 14,), 18, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(23, 18, 93, 20,), 19, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(58, 21, 58, 23,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(165, 15, 179, 17,), 20, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(123, 15, 141, 17,), 21, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(131, 18, 173, 20,), 22, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(151, 21, 177, 23,), 23, true).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(57, 24, 165, 26,), 24, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(109, 27, 169, 29,), 25, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(137, 30, 139, 32,), 26, false).inferGameInternalsWithCache(bracketName);
    }

    static SetupGridForStep10Result(grid: Grid, bracketName: string)
    {
        // expand game 7 by 4
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 3, 23, 5,), 1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(27, 3, 37, 5,), 2, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(57, 3, 71, 5,), 3, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(77, 3, 91, 5,), 4, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(97, 3, 111, 5,), 5, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 6, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(14, 9, 14, 11,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(31, 6, 45, 8,), 7, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(38, 9, 38, 11,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(63, 6, 85, 8,), 8, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(74, 9, 74, 11,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(103, 6, 117, 8,), 9, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(110, 9, 110, 11,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(139, 6, 153, 8,), 10, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(121, 9, 135, 11,), 11, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(163, 9, 177, 11,), 12, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(181, 9, 195, 11,), 13, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(145, 9, 159, 11,), 14, true).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 12, 39, 14,), 15, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(26, 15, 26, 17,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(73, 12, 111, 14,), 16, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(92, 15, 92, 17,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(127, 12, 153, 14,), 17, true).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(169, 12, 189, 14,), 18, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(25, 18, 93, 20,), 19, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(58, 21, 58, 23,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(165, 15, 179, 17,), 20, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(123, 15, 141, 17,), 21, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(131, 18, 173, 20,), 22, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(151, 21, 177, 23,), 23, true).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(57, 24, 165, 26,), 24, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(109, 27, 169, 29,), 25, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(137, 30, 139, 32,), 26, false).inferGameInternalsWithCache(bracketName);
    }

    static SetupGridForStep11Result(grid: Grid, bracketName: string)
    {
        // move 2 down by 8, expand by 4
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 3, 23, 5,), 1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(35, 3, 49, 5,), 2, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(57, 3, 71, 5,), 3, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(77, 3, 91, 5,), 4, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(97, 3, 111, 5,), 5, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 6, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(14, 9, 14, 11,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(41, 6, 55, 8,), 7, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(48, 9, 48, 11,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(63, 6, 85, 8,), 8, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(74, 9, 74, 11,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(103, 6, 117, 8,), 9, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(110, 9, 110, 11,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(139, 6, 153, 8,), 10, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(121, 9, 135, 11,), 11, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(163, 9, 177, 11,), 12, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(181, 9, 195, 11,), 13, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(145, 9, 159, 11,), 14, true).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 12, 49, 14,), 15, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(30, 15, 30, 17,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(73, 12, 111, 14,), 16, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(92, 15, 92, 17,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(127, 12, 153, 14,), 17, true).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(169, 12, 189, 14,), 18, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(29, 18, 93, 20,), 19, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(60, 21, 60, 23,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(165, 15, 179, 17,), 20, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(123, 15, 141, 17,), 21, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(131, 18, 173, 20,), 22, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(151, 21, 177, 23,), 23, true).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(59, 24, 165, 26,), 24, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(111, 27, 169, 29,), 25, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(139, 30, 141, 32,), 26, false).inferGameInternalsWithCache(bracketName);
    }

    static SetupGridForStep12Result(grid: Grid, bracketName: string)
    {
        // move game 1 down by 2, expand by 4
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(15, 3, 29, 5,), 1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(35, 3, 49, 5,), 2, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(57, 3, 71, 5,), 3, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(77, 3, 91, 5,), 4, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(97, 3, 111, 5,), 5, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 23, 8,), 6, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(16, 9, 16, 11,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(41, 6, 55, 8,), 7, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(48, 9, 48, 11,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(63, 6, 85, 8,), 8, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(74, 9, 74, 11,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(103, 6, 117, 8,), 9, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(110, 9, 110, 11,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(139, 6, 153, 8,), 10, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(121, 9, 135, 11,), 11, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(163, 9, 177, 11,), 12, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(181, 9, 195, 11,), 13, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(145, 9, 159, 11,), 14, true).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(15, 12, 49, 14,), 15, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(32, 15, 32, 17,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(73, 12, 111, 14,), 16, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(92, 15, 92, 17,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(127, 12, 153, 14,), 17, true).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(169, 12, 189, 14,), 18, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(31, 18, 93, 20,), 19, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(62, 21, 62, 23,), -1, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(165, 15, 179, 17,), 20, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(123, 15, 141, 17,), 21, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(131, 18, 173, 20,), 22, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(151, 21, 177, 23,), 23, true).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(61, 24, 165, 26,), 24, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(111, 27, 169, 29,), 25, false).inferGameInternalsWithCache(bracketName);
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(139, 30, 141, 32,), 26, false).inferGameInternalsWithCache(bracketName);
    }


    /*----------------------------------------------------------------------------
        all these tests should pull all the attached games
        down and keep the loser feeds in the same place relative to the adjacent
        game. (must always be relative to the adjacent BELOW game since the above
        game just got farther away)
    ----------------------------------------------------------------------------*/

    /*----------------------------------------------------------------------------
        %%Function: GameMoverSimpleTests.test_Step1_Game13_Down52_Grow4
    ----------------------------------------------------------------------------*/
    static test_Step1_Game13_Down52_Grow4(result: TestResult)
    {
        const setup: SetupTestDelegate =
            (grid, gridExpected, bracketName): [GridItem, GridItem] =>
            {
                this.SetupGridForInitialState(grid, bracketName);

                const itemOld: GridItem = grid.findGameItem(new GameId(13));
                const itemNew: GridItem = itemOld.clone().shiftByRows(52).growShrink(4);

                this.SetupGridForStep1Result(gridExpected, bracketName);

                return [itemOld, itemNew];
            };

        this.doGameMoverTest(
            "test_Step1_Game13_Down52_Grow4",
            result,
            "T13",
            setup,
            new RangeInfo(9, 1, 3, 1));
    }

    static test_Step2_Game12_Down46_Grow4(result: TestResult)
    {
        const setup: SetupTestDelegate =
            (grid, gridExpected, bracketName): [GridItem, GridItem] =>
            {
                this.SetupGridForStep1Result(grid, bracketName);

                const itemOld: GridItem = grid.findGameItem(new GameId(12));
                const itemNew: GridItem = itemOld.clone().shiftByRows(46).growShrink(4);

                this.SetupGridForStep2Result(gridExpected, bracketName);
                return [itemOld, itemNew];
            };

        this.doGameMoverTest(
            "test_Step2_Game12_Down46_Grow4",
            result,
            "T13",
            setup,
            new RangeInfo(9, 1, 3, 1));
    }

    static test_Step3_Game14_Grow4(result: TestResult)
    {
        const setup: SetupTestDelegate =
            (grid, gridExpected, bracketName): [GridItem, GridItem] =>
            {
                this.SetupGridForStep2Result(grid, bracketName);

                const itemOld: GridItem = grid.findGameItem(new GameId(14));
                const itemNew: GridItem = itemOld.clone().growShrink(4);

                this.SetupGridForStep3Result(gridExpected, bracketName);
                return [itemOld, itemNew];
            };

        this.doGameMoverTest(
            "test_Step3_Game14_Grow4",
            result,
            "T13",
            setup,
            new RangeInfo(9, 1, 3, 1));
    }

    static test_Step4_Game10_Down38_Grow4(result: TestResult)
    {
        const setup: SetupTestDelegate =
            (grid, gridExpected, bracketName): [GridItem, GridItem] =>
            {
                this.SetupGridForStep3Result(grid, bracketName);

                const itemOld: GridItem = grid.findGameItem(new GameId(10));
                const itemNew: GridItem = itemOld.clone().shiftByRows(38).growShrink(4);

                this.SetupGridForStep4Result(gridExpected, bracketName);
                return [itemOld, itemNew];
            };

        this.doGameMoverTest(
            "test_Step4_Game10_Down38_Grow4",
            result,
            "T13",
            setup,
            new RangeInfo(9, 1, 3, 1));
    }

    static test_Step5_Game11_Down32_Grow4(result: TestResult)
    {
        const setup: SetupTestDelegate =
            (grid, gridExpected, bracketName): [GridItem, GridItem] =>
            {
                this.SetupGridForStep4Result(grid, bracketName);

                const itemOld: GridItem = grid.findGameItem(new GameId(11));
                const itemNew: GridItem = itemOld.clone().shiftByRows(32).growShrink(4);

                this.SetupGridForStep5Result(gridExpected, bracketName);
                return [itemOld, itemNew];
            };

        this.doGameMoverTest(
            "test_Step5_Game11_Down32_Grow4",
            result,
            "T13",
            setup,
            new RangeInfo(9, 1, 3, 1));
    }

    static test_Step6_Game9_Grow4(result: TestResult)
    {
        const setup: SetupTestDelegate =
            (grid, gridExpected, bracketName): [GridItem, GridItem] =>
            {
                this.SetupGridForStep5Result(grid, bracketName);

                const itemOld: GridItem = grid.findGameItem(new GameId(9));
                const itemNew: GridItem = itemOld.clone().growShrink(4);

                this.SetupGridForStep6Result(gridExpected, bracketName);
                return [itemOld, itemNew];
            };

        this.doGameMoverTest(
            "test_Step6_Game9_Grow4",
            result,
            "T13",
            setup,
            new RangeInfo(9, 1, 3, 1));
    }

    static test_Step7_Game5_Down26_Grow4(result: TestResult)
    {
        const setup: SetupTestDelegate =
            (grid, gridExpected, bracketName): [GridItem, GridItem] =>
            {
                this.SetupGridForStep6Result(grid, bracketName);

                const itemOld: GridItem = grid.findGameItem(new GameId(5));
                const itemNew: GridItem = itemOld.clone().shiftByRows(26).growShrink(4);

                this.SetupGridForStep7Result(gridExpected, bracketName);
                return [itemOld, itemNew];
            };

        this.doGameMoverTest(
            "test_Step7_Game5_Down26_Grow4",
            result,
            "T13",
            setup,
            new RangeInfo(9, 1, 3, 1));
    }

    static test_Step8_Game10_Down38_Grow4(result: TestResult)
    {
        const setup: SetupTestDelegate =
            (grid, gridExpected, bracketName): [GridItem, GridItem] =>
            {
                this.SetupGridForStep7Result(grid, bracketName);

                const itemOld: GridItem = grid.findGameItem(new GameId(4));
                const itemNew: GridItem = itemOld.clone().shiftByRows(20).growShrink(4);

                this.SetupGridForStep8Result(gridExpected, bracketName);
                return [itemOld, itemNew];
            };

        this.doGameMoverTest(
            "test_Step8_Game10_Down38_Grow4",
            result,
            "T13",
            setup,
            new RangeInfo(9, 1, 3, 1));
    }

    static test_Step9_Game3_Down14_Grow4(result: TestResult)
    {
        const setup: SetupTestDelegate =
            (grid, gridExpected, bracketName): [GridItem, GridItem] =>
            {
                this.SetupGridForStep8Result(grid, bracketName);

                const itemOld: GridItem = grid.findGameItem(new GameId(3));
                const itemNew: GridItem = itemOld.clone().shiftByRows(14).growShrink(4);

                this.SetupGridForStep9Result(gridExpected, bracketName);
                return [itemOld, itemNew];
            };

        this.doGameMoverTest(
            "test_Step9_Game3_Down14_Grow4",
            result,
            "T13",
            setup,
            new RangeInfo(9, 1, 3, 1));
    }

    static test_Step10_Game7_Grow4(result: TestResult)
    {
        const setup: SetupTestDelegate =
            (grid, gridExpected, bracketName): [GridItem, GridItem] =>
            {
                this.SetupGridForStep9Result(grid, bracketName);

                const itemOld: GridItem = grid.findGameItem(new GameId(7));
                const itemNew: GridItem = itemOld.clone().growShrink(4);

                this.SetupGridForStep10Result(gridExpected, bracketName);
                return [itemOld, itemNew];
            };

        this.doGameMoverTest(
            "test_Step10_Game7_Grow4",
            result,
            "T13",
            setup,
            new RangeInfo(9, 1, 3, 1));
    }

    static test_Step11_Game2_Down8_Grow4(result: TestResult)
    {
        const setup: SetupTestDelegate =
            (grid, gridExpected, bracketName): [GridItem, GridItem] =>
            {
                this.SetupGridForStep10Result(grid, bracketName);

                const itemOld: GridItem = grid.findGameItem(new GameId(2));
                const itemNew: GridItem = itemOld.clone().shiftByRows(8).growShrink(4);

                this.SetupGridForStep11Result(gridExpected, bracketName);
                return [itemOld, itemNew];
            };

        this.doGameMoverTest(
            "test_Step11_Game2_Down8_Grow4",
            result,
            "T13",
            setup,
            new RangeInfo(9, 1, 3, 1));
    }

    static test_Step12_Game1_Down2_Grow4(result: TestResult)
    {
        const setup: SetupTestDelegate =
            (grid, gridExpected, bracketName): [GridItem, GridItem] =>
            {
                this.SetupGridForStep11Result(grid, bracketName);

                const itemOld: GridItem = grid.findGameItem(new GameId(1));
                const itemNew: GridItem = itemOld.clone().shiftByRows(2).growShrink(4);

                this.SetupGridForStep12Result(gridExpected, bracketName);
                return [itemOld, itemNew];
            };

        this.doGameMoverTest(
            "test_Step12_Game1_Down2_Grow4",
            result,
            "T13",
            setup,
            new RangeInfo(9, 1, 3, 1));
    }
}