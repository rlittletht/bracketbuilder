import {AppContext, IAppContext} from "../../AppContext/AppContext";
import {RangeInfo} from "../../Interop/Ranges";
import {StreamWriter} from "../../Support/StreamWriter";
import {TestResult} from "../../Support/TestResult";
import {TestRunner} from "../../Support/TestRunner";
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
            grid.logChanges(changes);
            result.addError(
                `${grid.logChangesToString(changes)
                }`);
            return;
        }
    }

    /*----------------------------------------------------------------------------
        %%Function: GameMoverSimpleTests.testFirstMove_BottomGameMoveDown

        move game 13 down by 14 rows. this should pull all the attached games
        down and keep the loser feeds in the same place relative to the adjacent
        game. (must always be relative to the adjacent BELOW game since the above
        game just got farther away)
    ----------------------------------------------------------------------------*/
    static test_FirstMove_BottomGameMoveDown(result: TestResult)
    {
        const setup: SetupTestDelegate =
            (grid, gridExpected, bracketName): [GridItem, GridItem] =>
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
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 12, 37, 14,), 15, true).inferGameInternalsWithCache(bracketName);
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

                const itemOld: GridItem = grid.findGameItem(new GameId(13));
                const itemNew: GridItem = itemOld.clone().shiftByRows(14);

                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(27, 3, 37, 5,), 2, false).inferGameInternalsWithCache(bracketName);
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(43, 3, 53, 5,), 3, false).inferGameInternalsWithCache(bracketName);
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(57, 3, 67, 5,), 4, false).inferGameInternalsWithCache(bracketName);
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(71, 3, 81, 5,), 5, false).inferGameInternalsWithCache(bracketName);
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 6, false).inferGameInternalsWithCache(bracketName);
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(14, 9, 14, 11,), -1, false).inferGameInternalsWithCache(bracketName);
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(31, 6, 41, 8,), 7, false).inferGameInternalsWithCache(bracketName);
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(36, 9, 36, 11,), -1, false).inferGameInternalsWithCache(bracketName);
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(47, 6, 63, 8,), 8, false).inferGameInternalsWithCache(bracketName);
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(54, 9, 54, 11,), -1, false).inferGameInternalsWithCache(bracketName);
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(75, 6, 85, 8,), 9, false).inferGameInternalsWithCache(bracketName);
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(80, 9, 80, 11,), -1, false).inferGameInternalsWithCache(bracketName);
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(101, 6, 111, 8,), 10, false).inferGameInternalsWithCache(bracketName);
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(89, 9, 99, 11,), 11, false).inferGameInternalsWithCache(bracketName);
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(117, 9, 127, 11,), 12, false).inferGameInternalsWithCache(bracketName);
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 3, 23, 5,), 1, false).inferGameInternalsWithCache(bracketName);
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(143, 9, 153, 11,), 13, false).inferGameInternalsWithCache(bracketName);
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(105, 9, 115, 11,), 14, true).inferGameInternalsWithCache(bracketName);
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 12, 37, 14,), 15, true).inferGameInternalsWithCache(bracketName);
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(24, 15, 24, 17,), -1, false).inferGameInternalsWithCache(bracketName);
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(53, 12, 81, 14,), 16, false).inferGameInternalsWithCache(bracketName);
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(66, 15, 66, 17,), -1, false).inferGameInternalsWithCache(bracketName);
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(93, 12, 111, 14,), 17, true).inferGameInternalsWithCache(bracketName);
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(121, 12, 149, 14,), 18, false).inferGameInternalsWithCache(bracketName);
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(23, 18, 67, 20,), 19, false).inferGameInternalsWithCache(bracketName);
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(44, 21, 44, 23,), -1, false).inferGameInternalsWithCache(bracketName);
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(117, 15, 135, 17,), 20, false).inferGameInternalsWithCache(bracketName);
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(89, 15, 103, 17,), 21, false).inferGameInternalsWithCache(bracketName);
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(95, 18, 127, 20,), 22, false).inferGameInternalsWithCache(bracketName);
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(109, 21, 131, 23,), 23, true).inferGameInternalsWithCache(bracketName);
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(43, 24, 121, 26,), 24, false).inferGameInternalsWithCache(bracketName);
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(79, 27, 125, 29,), 25, false).inferGameInternalsWithCache(bracketName);
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(99, 30, 101, 32,), 26, false).inferGameInternalsWithCache(bracketName);

                return [itemOld, itemNew];
            };

        this.doGameMoverTest(
            result,
            "T13",
            setup,
            new RangeInfo(9, 1, 3, 1));
    }
}