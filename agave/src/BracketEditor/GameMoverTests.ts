import { IAppContext, AppContext } from "../AppContext/AppContext";
import { Grid } from "./Grid";
import { RangeInfo } from "../Interop/Ranges";
import { IBracketGame, BracketGame, IBracketGame as IBracketGame1 } from "./BracketGame";
import { GridItem } from "./GridItem";
import { GridAdjust } from "./GridAdjusters/GridAdjust";
import { GameMover } from "./GridAdjusters/GameMover";
import { GridChange } from "./GridChange";
import { GameId } from "./GameId";
import * as GridRanker from "./GridRanker";
import { TestRunner } from "../Support/TestRunner";
import { TestResult } from "../Support/TestResult";
import { StreamWriter } from "../Support/StreamWriter";

interface SetupTestDelegate
{
    (grid: Grid, gridExpected: Grid): [GridItem, GridItem];
}

export class GameMoverTests
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

        const [itemOld, itemNew] = delegate(grid, gridExpected);

        let mover: GameMover = new GameMover(grid);

        // first, make sure the starting grid is valid
        const rank: number = GridRanker.GridRanker.getGridRank(grid, bracket);

        if (rank == -1)
        {
            result.addError("starting grid invalid. bad test");
            return;
        }

        console.log(
            `original (rank=${
            rank
            })|`);
        grid.logGridCondensed();
        // clone the old item to make sure we are disconnected from the grid we are
        // about to change
        let gridResult: Grid = mover.moveGame(itemOld.clone(), itemNew, bracket);

        if (!gridResult)
        {
            result.addError("not gridResult returned");
            return;
        }

        const changes: GridChange[] = gridResult.diff(gridExpected, bracket);
        if (changes.length != 0)
        {
            grid.logChanges(changes);
            result.addError(
                `${
                grid.logChangesToString(changes)
                }`);
            return;
        }
    }

    /*----------------------------------------------------------------------------
        %%Function: GameMoverTests.test_ShiftItemDown_MaintainBuffer_PushGameDown

        move game 6 down by 2 rows. this should push games 6 and 7 down by 2
        rows.
    ----------------------------------------------------------------------------*/
    static testFailing_ShiftItemDown(result: TestResult)
    {
        const setup: SetupTestDelegate =
            (grid, gridExpected): [GridItem, GridItem] =>
            {
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 3, 23, 5,), 1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(29, 3, 39, 5,), 2, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(34, 6, 34, 8,), -1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 3, true).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(41, 6, 51, 8,), 4, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 9, 35, 11,), 5, true).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(45, 9, 55, 11,), 6, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(49, 12, 59, 14,), 7, true).inferGameInternals();

                const itemOld: GridItem = grid.findGameItem(new GameId(4));
                const itemNew: GridItem = itemOld.clone().shiftByRows(4);

                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 6, 23, 8,), 1, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(27, 6, 37, 8,), 2, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(41, 6, 51, 8,), 3, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(55, 6, 65, 8,), 4, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 9, 19, 11,), 5, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(71, 9, 81, 11,), 6, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(85, 9, 95, 11,), 7, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(31, 9, 47, 11,), 9, false).inferGameInternals();

                return [itemOld, itemNew];
            };

        this.doGameMoverTest(
            result,
            "T5",
            setup,
            new RangeInfo(9, 1, 3, 1));
    }


    /*----------------------------------------------------------------------------
        %%Function: GameMoverTests.test_ShiftItemDown_MaintainBuffer_PushGameDown

        move game 6 down by 2 rows. this should push games 6 and 7 down by 2
        rows.
    ----------------------------------------------------------------------------*/
    static test_ShiftItemDown_MaintainBuffer_PushGameDown(result: TestResult)
    {
        const setup: SetupTestDelegate =
            (grid, gridExpected): [GridItem, GridItem] =>
            {
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 6, 23, 8,), 1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(27, 6, 37, 8,), 2, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(41, 6, 51, 8,), 3, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(55, 6, 65, 8,), 4, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 9, 19, 11,), 5, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(67, 9, 77, 11,), 6, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(81, 9, 91, 11,), 7, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(31, 9, 47, 11,), 9, false).inferGameInternals();

                const itemOld: GridItem = grid.findGameItem(new GameId(6));
                const itemNew: GridItem = itemOld.clone().shiftByRows(4);

                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 6, 23, 8,), 1, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(27, 6, 37, 8,), 2, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(41, 6, 51, 8,), 3, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(55, 6, 65, 8,), 4, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 9, 19, 11,), 5, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(71, 9, 81, 11,), 6, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(85, 9, 95, 11,), 7, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(31, 9, 47, 11,), 9, false).inferGameInternals();

                return [itemOld, itemNew];
            };

        this.doGameMoverTest(
            result,
            "T9",
            setup);
    }



    static test_GrowItemDown_FitInAvailableSpace(result: TestResult)
    {
        const setup: SetupTestDelegate =
            (grid, gridExpected): [GridItem, GridItem] =>
            {
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(25, 6, 35, 8,), 2, false).inferGameInternals();

                const itemOld: GridItem = grid.findGameItem(new GameId(1));
                const itemNew: GridItem = itemOld.clone().growShrink(2);

                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 21, 8,), 1, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(25, 6, 35, 8,), 2, false).inferGameInternals();

                return [itemOld, itemNew];
            };

        this.doGameMoverTest(
            result,
            "T4",
            setup);
    }

    static test_ShiftItemUp_AllowBufferShrink_FavorLessSparsity(result: TestResult)
    {
        const setup: SetupTestDelegate =
            (grid, gridExpected): [GridItem, GridItem] =>
            {
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 6, 23, 8,), 1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(27, 6, 37, 8,), 2, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(41, 6, 51, 8,), 3, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(55, 6, 65, 8,), 4, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 9, 19, 11,), 5, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(69, 9, 79, 11,), 6, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(83, 9, 93, 11,), 7, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(31, 9, 47, 11,), 9, false).inferGameInternals();

                const itemOld: GridItem = grid.findGameItem(new GameId(7));
                const itemNew: GridItem = itemOld.clone().shiftByRows(-2);

                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 6, 23, 8,), 1, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(27, 6, 37, 8,), 2, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(41, 6, 51, 8,), 3, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(55, 6, 65, 8,), 4, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 9, 19, 11,), 5, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(69, 9, 79, 11,), 6, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(81, 9, 91, 11,), 7, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(31, 9, 47, 11,), 9, false).inferGameInternals();

                return [itemOld, itemNew];
            };

        this.doGameMoverTest(
            result,
            "T9",
            setup);
    }


    /*----------------------------------------------------------------------------
        %%Function: GameMoverTests.test_ShiftItemUp_MaintainBufferPushGameUp

        Move game 7 up by 2 rows. Should also move game 6 up by 2 rows.

        Game 6 and 7 are only 1 row apart, so leaving it alone is not an option,
        hence we will push it away 4.
    ----------------------------------------------------------------------------*/
    static test_ShiftItemUp_MaintainBufferPushGameUp(result: TestResult)
    {
        const setup: SetupTestDelegate =
            (grid, gridExpected): [GridItem, GridItem] =>
            {
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 6, 23, 8,), 1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(27, 6, 37, 8,), 2, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(41, 6, 51, 8,), 3, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(55, 6, 65, 8,), 4, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 9, 19, 11,), 5, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(71, 9, 81, 11,), 6, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(83, 9, 93, 11,), 7, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(31, 9, 47, 11,), 9, false).inferGameInternals();

                const itemOld: GridItem = grid.findGameItem(new GameId(7));
                const itemNew: GridItem = itemOld.clone().shiftByRows(-2);

                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 6, 23, 8,), 1, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(27, 6, 37, 8,), 2, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(41, 6, 51, 8,), 3, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(55, 6, 65, 8,), 4, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 9, 19, 11,), 5, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(67, 9, 77, 11,), 6, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(81, 9, 91, 11,), 7, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(31, 9, 47, 11,), 9, false).inferGameInternals();

                return [itemOld, itemNew];
            };

        this.doGameMoverTest(
            result,
            "T9",
            setup);
    }
    /*----------------------------------------------------------------------------
        %%Function: GameMoverTests.test_GrowItemDown_PushColumnAdjacentItemDown

        T4
        Grow game2 by 4 rows, which will grow game 3 by 2 rows because of the
        outgoing connection between game2 and game3
    ----------------------------------------------------------------------------*/
    static test_GrowItemAtBottom_DragOutgoingConnectedGameDown(result: TestResult)
    {
        const setup: SetupTestDelegate =
            (grid, gridExpected): [GridItem, GridItem] =>
            {
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(23, 6, 33, 8,), 2, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 9, 29, 11,), 3, false).inferGameInternals();

                const itemOld: GridItem = grid.findGameItem(new GameId(2));
                const itemNew: GridItem = itemOld.clone().growShrink(4);

                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 1, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(23, 6, 37, 8,), 2, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 9, 31, 11,), 3, false).inferGameInternals();

                return [itemOld, itemNew];
            };

        this.doGameMoverTest(
            result,
            "T4",
            setup);
    }

    /*----------------------------------------------------------------------------
        %%Function: GameMoverTests.test_GrowItemAtBottom_DragOutgoingConnectedGameAndLineDown

        T4
        Grow game2 by 4 rows, which will grow game 3 by 2 rows because of the
        outgoing connection between game2 and game3. The game feeders are
        connected by lines, so the lines have to move as well
    ----------------------------------------------------------------------------*/
    static test_GrowItemAtBottom_DragOutgoingConnectedGameAndLineDown(result: TestResult)
    {
        const setup: SetupTestDelegate =
            (grid, gridExpected): [GridItem, GridItem] =>
            {
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(14, 9, 14, 11,), -1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(23, 6, 33, 8,), 2, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(28, 9, 28, 11,), -1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 12, 29, 14,), 3, false).inferGameInternals();

                const itemOld: GridItem = grid.findGameItem(new GameId(2));
                const itemNew: GridItem = itemOld.clone().growShrink(4);

                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 1, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(14, 9, 14, 11,), -1, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(23, 6, 37, 8,), 2, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(30, 9, 30, 11,), -1, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 12, 31, 14,), 3, false).inferGameInternals();

                return [itemOld, itemNew];
            };

        this.doGameMoverTest(
            result,
            "T4",
            setup);
    }

    static test_ShrinkItemAtBottom_DragBottomFeedConnectedGameUp_NoRoomToGrow_ShrinkConnectedGame(result: TestResult)
    {
        const setup: SetupTestDelegate =
            (grid, gridExpected): [GridItem, GridItem] =>
            {
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 9, 31, 11,), 3, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(23, 6, 37, 8,), 2, false).inferGameInternals();

                const itemOld: GridItem = grid.findGameItem(new GameId(3));
                const itemNew: GridItem = itemOld.clone().growShrink(-2);

                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 1, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 9, 29, 11,), 3, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(23, 6, 33, 8,), 2, false).inferGameInternals();

                return [itemOld, itemNew];
            };

        this.doGameMoverTest(
            result,
            "T4",
            setup);
    }


    static test_ShrinkItemAtBottom_DragBottomFeedConnectedGameUp_RoomToGrow_ShrinkConnectedGame(result: TestResult)
    {
        const setup: SetupTestDelegate =
            (grid, gridExpected): [GridItem, GridItem] =>
            {
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 9, 35, 11,), 3, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(27, 6, 41, 8,), 2, false).inferGameInternals();

                const itemOld: GridItem = grid.findGameItem(new GameId(3));
                const itemNew: GridItem = itemOld.clone().growShrink(-2);

                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 1, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 9, 33, 11,), 3, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(27, 6, 37, 8,), 2, false).inferGameInternals();

                return [itemOld, itemNew];
            };

        this.doGameMoverTest(
            result,
            "T4",
            setup);
    }


    static test_ShrinkItemAtBottom_DragBottomFeedConnectedGameUp_GameTooSmallToShrink_ShiftGameUp(result: TestResult)
    {
        const setup: SetupTestDelegate =
            (grid, gridExpected): [GridItem, GridItem] =>
            {
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 9, 35, 11,), 3, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(29, 6, 39, 8,), 2, false).inferGameInternals();

                const itemOld: GridItem = grid.findGameItem(new GameId(3));
                const itemNew: GridItem = itemOld.clone().growShrink(-2);

                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 1, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 9, 33, 11,), 3, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(27, 6, 37, 8,), 2, false).inferGameInternals();

                return [itemOld, itemNew];
            };

        this.doGameMoverTest(
            result,
            "T4",
            setup);
    }


    /*----------------------------------------------------------------------------
        %%Function: GameMoverTests.test_GrowItemAtBottom_DragBottomFeedConnectedGameDown

        the target game grows, moving the bottom game feed location, dragging
        the feeding game along...
    ----------------------------------------------------------------------------*/
    static test_GrowItemAtBottom_DragBottomFeedConnectedGameDown(result: TestResult)
    {
        const setup: SetupTestDelegate =
            (grid, gridExpected): [GridItem, GridItem] =>
            {
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(23, 6, 33, 8,), 2, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 9, 29, 11,), 3, false).inferGameInternals();

                const itemOld: GridItem = grid.findGameItem(new GameId(3));
                const itemNew: GridItem = itemOld.clone().growShrink(2);

                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 1, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(25, 6, 35, 8,), 2, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 9, 31, 11,), 3, false).inferGameInternals();

                return [itemOld, itemNew];
            };

        this.doGameMoverTest(
            result,
            "T4",
            setup);
    }


    static test_GrowItemAtBottom_DragBottomFeedConnected_ShrinkConnectedGame(result: TestResult)
    {
        const setup: SetupTestDelegate =
            (grid, gridExpected): [GridItem, GridItem] =>
            {
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 9, 31, 11,), 3, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(23, 6, 37, 8,), 2, false).inferGameInternals();

                const itemOld: GridItem = grid.findGameItem(new GameId(3));
                const itemNew: GridItem = itemOld.clone().growShrink(2);

                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 1, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 9, 33, 11,), 3, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(27, 6, 37, 8,), 2, false).inferGameInternals();

                return [itemOld, itemNew];
            };

        this.doGameMoverTest(
            result,
            "T4",
            setup);
    }

    static test_GrowItemAtBottom_DragBottomFeedConnected_ShrinkConnectedGame_BlockedByGameBelow(result: TestResult)
    {
        const setup: SetupTestDelegate =
            (grid, gridExpected): [GridItem, GridItem] =>
            {
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 9, 31, 11,), 3, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(23, 6, 37, 8,), 2, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(41, 6, 51, 8,), 4, false).inferGameInternals();

                const itemOld: GridItem = grid.findGameItem(new GameId(3));
                const itemNew: GridItem = itemOld.clone().growShrink(2);

                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 1, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 9, 33, 11,), 3, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(27, 6, 37, 8,), 2, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(41, 6, 51, 8,), 4, false).inferGameInternals();


                return [itemOld, itemNew];
            };

        this.doGameMoverTest(
            result,
            "T4",
            setup);
    }

    /*----------------------------------------------------------------------------
        %%Function: GameMoverTests.test_GrowItemAtBottom_DragBottomFeedConnectedGameDown

        the target game grows, moving the bottom game feed location, dragging
        the feeding game along...
    ----------------------------------------------------------------------------*/
    static test_GrowItemAtBottom_DragBottomFeedConnectedGameAndLineDown(result: TestResult)
    {
        const setup: SetupTestDelegate =
            (grid, gridExpected): [GridItem, GridItem] =>
            {
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(14, 9, 14, 11,), -1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(23, 6, 33, 8,), 2, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(28, 9, 28, 11,), -1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 12, 29, 14,), 3, false).inferGameInternals();

                const itemOld: GridItem = grid.findGameItem(new GameId(3));
                const itemNew: GridItem = itemOld.clone().growShrink(2);

                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 1, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(14, 9, 14, 11,), -1, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(25, 6, 35, 8,), 2, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(30, 9, 30, 11,), -1, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 12, 31, 14,), 3, false).inferGameInternals();

                return [itemOld, itemNew];
            };

        this.doGameMoverTest(
            result,
            "T4",
            setup);
    }

    /*----------------------------------------------------------------------------
        %%Function: GameMoverTests.test_GrowItemAtTop_DragTopFeedConnectedGameUp_GrowConnectedGameByTop_ButFavorHomogeneity

        We have room to grow game 1, but we will just shift it up in order
        to favor a consistent height of games in the columns
    ----------------------------------------------------------------------------*/
    static test_GrowItemAtTop_DragTopFeedConnectedGameUp_GrowConnectedGameByTop_ButFavorHomogeneity(result: TestResult)
    {
        const setup: SetupTestDelegate =
            (grid, gridExpected): [GridItem, GridItem] =>
            {
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(15, 6, 25, 8,), 1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(29, 6, 39, 8,), 2, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(19, 9, 35, 11,), 3, false).inferGameInternals();

                const itemOld: GridItem = grid.findGameItem(new GameId(3));
                const itemNew: GridItem = itemOld.clone().growShrinkFromTop(2);

                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 6, 23, 8,), 1, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(29, 6, 39, 8,), 2, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(17, 9, 35, 11,), 3, false).inferGameInternals();

                return [itemOld, itemNew];
            };

        this.doGameMoverTest(
            result,
            "T4",
            setup);
    }


    /*----------------------------------------------------------------------------
        %%Function: GameMoverTests.test_GrowItemAtTop_DragTopFeedConnectedGameUp_GrowConnectedGameByTop

        here we have 2 different game heights already, so introducing a 3rd isn't
        disadvantageous. we will favor less sparsity
    ----------------------------------------------------------------------------*/
    static test_GrowItemAtTop_DragTopFeedConnectedGameUp_GrowConnectedGameByTop(result: TestResult)
    {
        const setup: SetupTestDelegate =
            (grid, gridExpected): [GridItem, GridItem] =>
            {
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(15, 6, 25, 8,), 1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(29, 6, 39, 8,), 2, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(19, 9, 35, 11,), 5, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(43, 6, 57, 8,), 3, false).inferGameInternals();

                const itemOld: GridItem = grid.findGameItem(new GameId(5));
                const itemNew: GridItem = itemOld.clone().growShrinkFromTop(2);

                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(11, 6, 25, 8,), 1, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(29, 6, 39, 8,), 2, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(17, 9, 35, 11,), 5, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(43, 6, 57, 8,), 3, false).inferGameInternals();

                return [itemOld, itemNew];
            };

        this.doGameMoverTest(
            result,
            "T8",
            setup);
    }


    static test_ShrinkItemAtTop_DragTopFeedConnectedGameDown_ShiftConnectedGameDown(result: TestResult)
    {
        const setup: SetupTestDelegate =
            (grid, gridExpected): [GridItem, GridItem] =>
            {
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(25, 6, 35, 8,), 2, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 9, 31, 11,), 3, false).inferGameInternals();

                const itemOld: GridItem = grid.findGameItem(new GameId(3));
                const itemNew: GridItem = itemOld.clone().growShrinkFromTop(-2);

                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(11, 6, 21, 8,), 1, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(25, 6, 35, 8,), 2, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(15, 9, 31, 11,), 3, false).inferGameInternals();

                return [itemOld, itemNew];
            };

        this.doGameMoverTest(
            result,
            "T4",
            setup);
    }


    static test_ShrinkItemAtTop_DragTopFeedConnectedGameDown_GrowConnectedGameDown_RoomToGrow_ButFavorHomogeneity(result: TestResult)
    {
        const setup: SetupTestDelegate =
            (grid, gridExpected): [GridItem, GridItem] =>
            {
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(29, 6, 39, 8,), 2, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 9, 35, 11,), 3, false).inferGameInternals();

                const itemOld: GridItem = grid.findGameItem(new GameId(3));
                const itemNew: GridItem = itemOld.clone().growShrinkFromTop(-2);

                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(11, 6, 21, 8,), 1, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(29, 6, 39, 8,), 2, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(15, 9, 35, 11,), 3, false).inferGameInternals();

                return [itemOld, itemNew];
            };

        this.doGameMoverTest(
            result,
            "T4",
            setup);
    }

    static test_ShrinkItemAtTop_DragTopFeedConnectedGameDown_GrowConnectedGameDown_RoomToGrow(result: TestResult)
    {
        const setup: SetupTestDelegate =
            (grid, gridExpected): [GridItem, GridItem] =>
            {
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(29, 6, 39, 8,), 2, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 9, 35, 11,), 5, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(43, 6, 57, 8,), 3, false).inferGameInternals();

                const itemOld: GridItem = grid.findGameItem(new GameId(5));
                const itemNew: GridItem = itemOld.clone().growShrinkFromTop(-2);

                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 23, 8,), 1, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(29, 6, 39, 8,), 2, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(15, 9, 35, 11,), 5, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(43, 6, 57, 8,), 3, false).inferGameInternals();

                return [itemOld, itemNew];
            };

        this.doGameMoverTest(
            result,
            "T8",
            setup);
    }


    static testKnownFailing_GrowItemAtTop_DragTopFeedConnectedGameAndLineUp_ButFavorHomogeneity(result: TestResult)    {
        const setup: SetupTestDelegate =
            (grid, gridExpected): [GridItem, GridItem] =>
            {
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(15, 6, 25, 8,), 1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(20, 9, 20, 11,), -1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(29, 6, 39, 8,), 2, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(34, 9, 34, 11,), -1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(19, 12, 35, 14,), 3, false).inferGameInternals();

                const itemOld: GridItem = grid.findGameItem(new GameId(3));
                const itemNew: GridItem = itemOld.clone().growShrinkFromTop(2);

                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 6, 23, 8,), 1, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(18, 9, 18, 11,), -1, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(29, 6, 39, 8,), 2, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(34, 9, 34, 11,), -1, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(17, 12, 35, 14,), 3, false).inferGameInternals();

                return [itemOld, itemNew];
            };

        this.doGameMoverTest(
            result,
            "T4",
            setup);
    }

    
    static testFailing_GrowItemAtTop_DragTopFeedConnectedGameAndLineUp(result: TestResult)
    {
        const setup: SetupTestDelegate =
            (grid, gridExpected): [GridItem, GridItem] =>
            {
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(15, 6, 25, 8,), 1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(20, 9, 20, 11,), -1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(29, 6, 39, 8,), 2, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(34, 9, 34, 11,), -1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(19, 12, 35, 14,), 5, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(43, 6, 57, 8,), 3, false).inferGameInternals();

                const itemOld: GridItem = grid.findGameItem(new GameId(3));
                const itemNew: GridItem = itemOld.clone().growShrinkFromTop(2);

                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(11, 6, 25, 8,), 1, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(18, 9, 18, 11,), -1, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(29, 6, 39, 8,), 2, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(34, 9, 34, 11,), -1, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(17, 12, 35, 14,), 5, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(43, 6, 57, 8,), 3, false).inferGameInternals();

                return [itemOld, itemNew];
            };

        this.doGameMoverTest(
            result,
            "T8",
            setup);
    }
    /*----------------------------------------------------------------------------
        %%Function: GameMoverTests.test_GrowItemDown_PushColumnAdjacentItemDown

        Grow game 3 by 2 rows, pushing game 4 down and connected game 2 down.
    ----------------------------------------------------------------------------*/
    static test_GrowItemDown_PushColumnAdjacentItemDown(result: TestResult)
    {
        const setup: SetupTestDelegate =
            (grid, gridExpected): [GridItem, GridItem] =>
            {
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(23, 6, 33, 8,), 2, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 9, 29, 11,), 3, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(35, 9, 45, 11,), 4, false).inferGameInternals();

                const itemOld: GridItem = grid.findGameItem(new GameId(2));
                const itemNew: GridItem = itemOld.clone().growShrink(2);

                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 1, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(23, 6, 35, 8,), 2, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 9, 29, 11,), 3, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(37, 9, 47, 11,), 4, false).inferGameInternals();

                return [itemOld, itemNew];
            };

        this.doGameMoverTest(
            result,
            "T4",
            setup);
    }


    /*----------------------------------------------------------------------------
        %%Function: GameMoverTests.testFailing_GrowItemDown_DragOutgoingFeederDown_DontAdjustAdjacentCollision

        Grow game 3 by 2 rows, pushing game 4 down and connected game 2 down.
    ----------------------------------------------------------------------------*/
    static testFailing_GrowItemDown_DragOutgoingFeederDown_DontAdjustAdjacentCollision(result: TestResult)
    {
        const setup: SetupTestDelegate =
            (grid, gridExpected): [GridItem, GridItem] =>
            {
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 9, 33, 11,), 3, false).inferGameInternals();

                const itemOld: GridItem = grid.findGameItem(new GameId(1));
                const itemNew: GridItem = itemOld.clone().growShrink(4);

                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 23, 8,), 1, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(15, 9, 35, 11,), 3, false).inferGameInternals();

                return [itemOld, itemNew];
            };

        this.doGameMoverTest(
            result,
            "T4",
            setup);
    }


    // the interesting thing here is that the game 2 is swapped home and away -- do we need to 
    // add that in the addGameRangeByIdValue? probably. 
    static test_DropItemToSwapHomeAway_Swapped(result: TestResult)
    {
        const setup: SetupTestDelegate =
            (grid, gridExpected): [GridItem, GridItem] =>
            {
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(23, 6, 33, 8,), 1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(19, 9, 29, 11,), 2, true).inferGameInternals();

                const itemOld: GridItem = grid.findGameItem(new GameId(2));
                const itemNew: GridItem = itemOld.clone().shiftByRows(8);

                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(23, 6, 33, 8,), 1, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(27, 9, 37, 11,), 2, false).inferGameInternals();

                return [itemOld, itemNew];
            };

        this.doGameMoverTest(
            result,
            "T2",
            setup);
    }

    // the interesting thing here is that the game 2 is swapped home and away -- do we need to 
    // add that in the addGameRangeByIdValue? probably. 
    static testKnownFailing_DropItemToSwapHomeAwayWithConnectedOutgoingMultipleLevels_Swapped(result: TestResult)
    {
        const setup: SetupTestDelegate =
            (grid, gridExpected): [GridItem, GridItem] =>
            {
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(23, 6, 33, 8,), 2, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(37, 6, 47, 8,), 3, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(51, 6, 61, 8,), 4, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 9, 29, 11,), 5, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(20, 12, 20, 14,), -1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(41, 9, 57, 11,), 6, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(48, 12, 48, 14,), -1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(63, 9, 73, 11,), 7, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(79, 9, 89, 11,), 8, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(67, 12, 77, 14,), 9, true).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(83, 12, 93, 14,), 10, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(19, 15, 49, 17,), 11, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(34, 18, 34, 20,), -1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(71, 15, 89, 17,), 12, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(63, 18, 81, 20,), 13, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(33, 21, 73, 23,), 14, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(51, 24, 83, 26,), 15, false).inferGameInternals();

                const itemOld: GridItem = grid.findGameItem(new GameId(13));
                const itemNew: GridItem = itemOld.clone().setAndInferGameInternals(
                    RangeInfo.createFromCornersCoord(79, 18, 93, 20));

                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 1, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(23, 6, 33, 8,), 2, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(37, 6, 47, 8,), 3, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(51, 6, 61, 8,), 4, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 9, 29, 11,), 5, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(20, 12, 20, 14,), -1, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(41, 9, 57, 11,), 6, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(48, 12, 48, 14,), -1, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(63, 9, 73, 11,), 7, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(79, 9, 89, 11,), 8, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(67, 12, 77, 14,), 9, true).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(83, 12, 93, 14,), 10, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(19, 15, 49, 17,), 11, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(34, 18, 34, 20,), -1, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(71, 15, 89, 17,), 12, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(79, 18, 93, 20,), 13, true).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(33, 21, 87, 23,), 14, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(59, 24, 91, 26,), 15, false).inferGameInternals();

                return [itemOld, itemNew];
            };

        this.doGameMoverTest(
            result,
            "T8",
            setup);
    }

    static test_ItemMovedOutgoingFeederRequiresHomeAwaySwap(result: TestResult)
    {
        const setup: SetupTestDelegate =
            (grid, gridExpected): [GridItem, GridItem] =>
            {
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(23, 15, 33, 17,), 13, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(15, 18, 29, 20,), 18, false).inferGameInternals();

                const itemOld: GridItem = grid.findGameItem(new GameId(13));
                const itemNew: GridItem = itemOld.clone().setAndInferGameInternals(
                    RangeInfo.createFromCornersCoord(11, 15, 21, 17));

                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(11, 15, 21, 17,), 13, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(15, 18, 29, 20,), 18, true).inferGameInternals();

                return [itemOld, itemNew];
            };

        this.doGameMoverTest(
            result,
            "T13",
            setup);
    }

    static test_DropItemToSwapHomeAwayWithConnectedSources_Swapped(result: TestResult)
    {
        const setup: SetupTestDelegate =
            (grid, gridExpected): [GridItem, GridItem] =>
            {
//                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(67, 12, 77, 14,), 9, true).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(83, 12, 93, 14,), 10, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(71, 15, 89, 17,), 12, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(63, 18, 81, 20,), 13, false).inferGameInternals();

                const itemOld: GridItem = grid.findGameItem(new GameId(13));
                const itemNew: GridItem = itemOld.clone().setAndInferGameInternals(
                    RangeInfo.createFromCornersCoord(79, 18, 93, 20));

//                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(67, 12, 77, 14,), 9, true).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(83, 12, 93, 14,), 10, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(71, 15, 89, 17,), 12, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(79, 18, 93, 20,), 13, true).inferGameInternals();

                return [itemOld, itemNew];
            };

        this.doGameMoverTest(
            result,
            "T8",
            setup);
    }


    static test_MoveItemWithConnectedTopFeeder_ShiftByNegativeConnectedItem(result: TestResult)
    {
        const setup: SetupTestDelegate =
            (grid, gridExpected): [GridItem, GridItem] =>
            {
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(21, 6, 31, 8,), 1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(25, 9, 35, 11,), 3, false).inferGameInternals();

                const itemOld: GridItem = grid.findGameItem(new GameId(3));
                const itemNew: GridItem = itemOld.clone().setAndInferGameInternals(
                    RangeInfo.createFromCornersCoord(17, 9, 27, 11));

                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 6, 23, 8,), 1, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(17, 9, 27, 11,), 3, false).inferGameInternals();

                return [itemOld, itemNew];
            };

        this.doGameMoverTest(
            result,
            "T4",
            setup);
    }

    static test_MoveItemWithConnectedTopFeeder_MoveConnectedItem(result: TestResult)
    {
        const setup: SetupTestDelegate =
            (grid, gridExpected): [GridItem, GridItem] =>
            {
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(21, 6, 31, 8,), 1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(25, 9, 35, 11,), 3, false).inferGameInternals();

                const itemOld: GridItem = grid.findGameItem(new GameId(3));
                const itemNew: GridItem = itemOld.clone().setAndInferGameInternals(
                    RangeInfo.createFromCornersCoord(13, 9, 23, 11));

                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 1, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 9, 23, 11,), 3, false).inferGameInternals();

                return [itemOld, itemNew];
            };

        this.doGameMoverTest(
            result,
            "T4",
            setup);
    }


    static testFailing_MoveItemWithConnectedBottomFeederAndConnectedOutgoing_RecurseWillCauseOverlap_SimpleShiftAllGames(result: TestResult)
    {
        const setup: SetupTestDelegate =
            (grid, gridExpected): [GridItem, GridItem] =>
            {
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(19, 6, 29, 8,), 1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(33, 6, 43, 8,), 4, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(38, 9, 38, 11,), -1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(15, 9, 25, 11,), 5, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(19, 12, 39, 14,), 10, false).inferGameInternals();

                const itemOld: GridItem = grid.findGameItem(new GameId(5));
                const itemNew: GridItem = itemOld.clone().setAndInferGameInternals(
                    RangeInfo.createFromCornersCoord(11, 9, 21, 11));

                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(15, 6, 25, 8,), 1, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(29, 6, 39, 8,), 4, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(34, 9, 34, 11,), -1, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(11, 9, 21, 11,), 5, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(15, 12, 35, 14,), 10, false).inferGameInternals();


                return [itemOld, itemNew];
            };

        this.doGameMoverTest(
            result,
            "T9",
            setup);
    }

    static testFailing_SwapHomeAwayMovingItemUpWithTopFeederBecomingBottomFeederConnectedOutgoing(result: TestResult)
    {
        const setup: SetupTestDelegate =
            (grid, gridExpected): [GridItem, GridItem] =>
            {
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 3, 23, 5,), 1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(39, 3, 49, 5,), 2, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(53, 3, 63, 5,), 3, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(25, 3, 35, 5,), 4, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(30, 6, 30, 11,), -1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 5, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(14, 9, 14, 11,), -1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(67, 6, 77, 8,), 6, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(83, 9, 93, 11,), 7, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(71, 9, 81, 11,), 8, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(76, 12, 76, 14,), -1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(43, 6, 59, 8,), 9, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(50, 9, 50, 14,), -1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 12, 31, 14,), 10, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(87, 12, 97, 14,), 11, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(92, 15, 92, 17,), -1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(75, 15, 85, 17,), 12, true).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(21, 15, 51, 17,), 13, true).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(36, 18, 36, 23,), -1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(79, 18, 93, 20,), 14, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(75, 21, 87, 23,), 15, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(35, 24, 81, 26,), 16, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(57, 27, 85, 29,), 17, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(69, 30, 71, 32,), 18, false).inferGameInternals();

                console.clear();
                AppContext.log("rank: \n");
                AppContext.log(grid.logGridCondensedString());

                const itemOld: GridItem = grid.findGameItem(new GameId(12));
                const itemNew: GridItem = itemOld.clone().setAndInferGameInternals(
                    RangeInfo.createFromCornersCoord(67, 15, 77, 17));

                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 3, 23, 5,), 1, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(39, 3, 49, 5,), 2, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(53, 3, 63, 5,), 3, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(25, 3, 35, 5,), 4, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(30, 6, 30, 11,), -1, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 5, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(14, 9, 14, 11,), -1, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(67, 6, 77, 8,), 6, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(83, 9, 93, 11,), 7, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(71, 9, 81, 11,), 8, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(76, 12, 76, 14,), -1, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(43, 6, 59, 8,), 9, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(50, 9, 50, 14,), -1, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 12, 31, 14,), 10, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(87, 12, 97, 14,), 11, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(92, 15, 92, 17,), -1, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(67, 15, 77, 17,), 12, true).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(21, 15, 51, 17,), 13, true).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(36, 18, 36, 23,), -1, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(71, 18, 93, 20,), 14, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(63, 21, 81, 23,), 15, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(35, 24, 71, 26,), 16, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(49, 27, 77, 29,), 17, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(59, 30, 61, 32,), 18, false).inferGameInternals();

                return [itemOld, itemNew];
            };

        this.doGameMoverTest(
            result,
            "T9",
            setup,
            new RangeInfo(9, 1, 3, 1));
    }
}