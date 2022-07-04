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
import * as GridRanker from "./GridRanker";

interface SetupTestDelegate
{
    (grid: Grid, gridExpected: Grid): [GridItem, GridItem];
}

export class GameMoverTests
{
    static doGameMoverTest(
        appContext: IAppContext,
        testContext: UnitTestContext,
        testName: string,
        bracket: string,
        delegate: SetupTestDelegate)
    {
        appContext;
        testContext.StartTest(testName);

        let grid: Grid = new Grid();
        grid.m_firstGridPattern = new RangeInfo(9, 1, 6, 1);

        let gridExpected: Grid = grid.clone(); // clone so we get the same first grid pattern

        const [itemOld, itemNew] = delegate(grid, gridExpected);

        let mover: GameMover = new GameMover(grid);

        // first, make sure the starting grid is valid
        const rank: number = GridRanker.GridRanker.getGridRank(grid, bracket);

        if (rank == -1)
            throw Error(`starting grid invalid. bad test`);

        // clone the old item to make sure we are disconnected from the grid we are
        // about to change
        let gridResult: Grid = mover.moveGame(itemOld.clone(), itemNew, bracket);

        const changes: GridChange[] = gridResult.diff(gridExpected, bracket);
        if (changes.length != 0)
        {
            grid.logChanges(changes);
            throw Error(`${
                grid.logChangesToString(changes)
                }`);
        }
    }


    /*----------------------------------------------------------------------------
        %%Function: GameMoverTests.test_ShiftItemDown_MaintainBuffer_PushGameDown

        move game 6 down by 2 rows. this should push games 6 and 7 down by 2
        rows.
    ----------------------------------------------------------------------------*/
    static test_ShiftItemDown_MaintainBuffer_PushGameDown(appContext: IAppContext, testContext: UnitTestContext)
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
                const itemNew: GridItem = itemOld.clone().shiftByRows(2);

                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 6, 23, 8,), 1, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(27, 6, 37, 8,), 2, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(41, 6, 51, 8,), 3, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(55, 6, 65, 8,), 4, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 9, 19, 11,), 5, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(69, 9, 79, 11,), 6, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(83, 9, 93, 11,), 7, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(31, 9, 47, 11,), 9, false).inferGameInternals();

                return [itemOld, itemNew];
            };

        this.doGameMoverTest(
            appContext,
            testContext,
            "GameMoverTests. test_ShiftItemDown_MaintainBuffer_PushGameDown",
            "T9",
            setup);
    }


    static test_GrowItemDown_FitInAvailableSpace(appContext: IAppContext, testContext: UnitTestContext)
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
            appContext,
            testContext,
            "GameMoverTests. test_GrowItemDown_FitInAvailableSpace",
            "T4",
            setup);
    }


    /*----------------------------------------------------------------------------
        %%Function: GameMoverTests.test_ShiftItemUp_MaintainBufferPushGameUp

        Move game 7 up by 2 rows. Should also move game 6 up by 2 rows
    ----------------------------------------------------------------------------*/
    static test_ShiftItemUp_MaintainBufferPushGameUp(appContext: IAppContext, testContext: UnitTestContext)
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
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(67, 9, 77, 11,), 6, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(81, 9, 91, 11,), 7, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(31, 9, 47, 11,), 9, false).inferGameInternals();

                return [itemOld, itemNew];
            };

        this.doGameMoverTest(
            appContext,
            testContext,
            "GameMoverTests. test_ShiftItemUp_MaintainBufferPushGameUp",
            "T9",
            setup);
    }

    /*----------------------------------------------------------------------------
        %%Function: GameMoverTests.test_GrowItemDown_PushColumnAdjacentItemDown

        T4
        Grow game2 by 4 rows, which will grow game 3 by 2 rows because of the
        outgoing connection between game2 and game3
    ----------------------------------------------------------------------------*/
    static test_GrowItemAtBottom_DragOutgoingConnectedGameDown(appContext: IAppContext, testContext: UnitTestContext)
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
            appContext,
            testContext,
            "GameMoverTests. test_GrowItemAtBottom_DragOutgoingConnectedGameDown",
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
    static test_GrowItemAtBottom_DragOutgoingConnectedGameAndLineDown(appContext: IAppContext, testContext: UnitTestContext)
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
            appContext,
            testContext,
            "GameMoverTests. test_GrowItemAtBottom_DragOutgoingConnectedGameAndLineDown",
            "T4",
            setup);
    }

    static test_ShrinkItemAtBottom_DragBottomFeedConnectedGameUp_NoRoomToGrow_ShrinkConnectedGame(appContext: IAppContext, testContext: UnitTestContext)
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
            appContext,
            testContext,
            "GameMoverTests. test_ShrinkItemAtBottom_DragBottomFeedConnectedGameUp_NoRoomToGrow_ShrinkConnectedGame",
            "T4",
            setup);
    }


    static test_ShrinkItemAtBottom_DragBottomFeedConnectedGameUp_RoomToGrow_ShrinkConnectedGame(appContext: IAppContext, testContext: UnitTestContext)
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
            appContext,
            testContext,
            "GameMoverTests. test_ShrinkItemAtBottom_DragBottomFeedConnectedGameUp_RoomToGrow_ShrinkConnectedGame",
            "T4",
            setup);
    }


    static test_ShrinkItemAtBottom_DragBottomFeedConnectedGameUp_GameTooSmallToShrink_ShiftGameUp(appContext: IAppContext, testContext: UnitTestContext)
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
            appContext,
            testContext,
            "GameMoverTests. test_ShrinkItemAtBottom_DragBottomFeedConnectedGameUp_GameTooSmallToShrink_ShiftGameUp",
            "T4",
            setup);
    }


    /*----------------------------------------------------------------------------
        %%Function: GameMoverTests.test_GrowItemAtBottom_DragBottomFeedConnectedGameDown

        the target game grows, moving the bottom game feed location, dragging
        the feeding game along...
    ----------------------------------------------------------------------------*/
    static test_GrowItemAtBottom_DragBottomFeedConnectedGameDown(appContext: IAppContext, testContext: UnitTestContext)
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
            appContext,
            testContext,
            "GameMoverTests. test_GrowItemAtBottom_DragBottomFeedConnectedGameDown",
            "T4",
            setup);
    }


    static test_GrowItemAtBottom_DragBottomFeedConnected_ShrinkConnectedGame(appContext: IAppContext, testContext: UnitTestContext)
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
            appContext,
            testContext,
            "GameMoverTests. test_GrowItemAtBottom_DragBottomFeedConnected_ShrinkConnectedGame",
            "T4",
            setup);
    }

    static test_GrowItemAtBottom_DragBottomFeedConnected_ShrinkConnectedGame_BlockedByGameBelow(appContext: IAppContext, testContext: UnitTestContext)
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
            appContext,
            testContext,
            "GameMoverTests. test_GrowItemAtBottom_DragBottomFeedConnected_ShrinkConnectedGame_BlockedByGameBelow",
            "T4",
            setup);
    }
    /*----------------------------------------------------------------------------
        %%Function: GameMoverTests.test_GrowItemAtBottom_DragBottomFeedConnectedGameDown

        the target game grows, moving the bottom game feed location, dragging
        the feeding game along...
    ----------------------------------------------------------------------------*/
    static test_GrowItemAtBottom_DragBottomFeedConnectedGameAndLineDown(appContext: IAppContext, testContext: UnitTestContext)
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
            appContext,
            testContext,
            "GameMoverTests. test_GrowItemAtBottom_DragBottomFeedConnectedGameAndLineDown",
            "T4",
            setup);
    }

    static test_GrowItemAtTop_DragTopFeedConnectedGameUp_GrowConnectedGameByTop(appContext: IAppContext, testContext: UnitTestContext)
    {
        const setup: SetupTestDelegate =
            (grid, gridExpected): [GridItem, GridItem] =>
            {
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(11, 6, 21, 8,), 1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(25, 6, 35, 8,), 2, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(15, 9, 31, 11,), 3, false).inferGameInternals();

                const itemOld: GridItem = grid.findGameItem(new GameId(3));
                const itemNew: GridItem = itemOld.clone().growShrinkFromTop(2);

                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(7, 6, 21, 8,), 1, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(25, 6, 35, 8,), 2, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 9, 31, 11,), 3, false).inferGameInternals();

                return [itemOld, itemNew];
            };

        this.doGameMoverTest(
            appContext,
            testContext,
            "GameMoverTests. test_GrowItemAtTop_DragTopFeedConnectedGameUp_GrowConnectedGameByTop",
            "T4",
            setup);
    }

    static test_ShrinkItemAtTop_DragTopFeedConnectedGameDown_ShiftConnectedGameDown(appContext: IAppContext, testContext: UnitTestContext)
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
            appContext,
            testContext,
            "GameMoverTests. test_ShrinkItemAtTop_DragTopFeedConnectedGameDown_ShiftConnectedGameDown",
            "T4",
            setup);
    }


    static test_ShrinkItemAtTop_DragTopFeedConnectedGameDown_GrowConnectedGameDown_RoomToGrow(appContext: IAppContext, testContext: UnitTestContext)
    {
        const setup: SetupTestDelegate =
            (grid, gridExpected): [GridItem, GridItem] =>
            {
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(29, 6, 39, 8,), 2, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 9, 35, 11,), 3, false).inferGameInternals();

                const itemOld: GridItem = grid.findGameItem(new GameId(3));
                const itemNew: GridItem = itemOld.clone().growShrinkFromTop(-2);

                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 23, 8,), 1, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(29, 6, 39, 8,), 2, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(15, 9, 35, 11,), 3, false).inferGameInternals();

                return [itemOld, itemNew];
            };

        this.doGameMoverTest(
            appContext,
            testContext,
            "GameMoverTests. test_ShrinkItemAtTop_DragTopFeedConnectedGameDown_GrowConnectedGameDown_RoomToGrow",
            "T4",
            setup);
    }

    static test_GrowItemAtTop_DragTopFeedConnectedGameAndLineUp(appContext: IAppContext, testContext: UnitTestContext)
    {
        const setup: SetupTestDelegate =
            (grid, gridExpected): [GridItem, GridItem] =>
            {
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(11, 6, 21, 8,), 1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(16, 9, 16, 11,), -1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(25, 6, 35, 8,), 2, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(30, 9, 30, 11,), -1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(15, 12, 31, 14,), 3, false).inferGameInternals();

                const itemOld: GridItem = grid.findGameItem(new GameId(3));
                const itemNew: GridItem = itemOld.clone().growShrinkFromTop(2);

                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(7, 6, 21, 8,), 1, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(14, 9, 14, 11,), -1, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(25, 6, 35, 8,), 2, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(30, 9, 30, 11,), -1, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 12, 31, 14,), 3, false).inferGameInternals();

                return [itemOld, itemNew];
            };

        this.doGameMoverTest(
            appContext,
            testContext,
            "GameMoverTests. test_GrowItemAtTop_DragTopFeedConnectedGameAndLineUp",
            "T4",
            setup);
    }

    /*----------------------------------------------------------------------------
        %%Function: GameMoverTests.test_GrowItemDown_PushColumnAdjacentItemDown

        Grow game 3 by 2 rows, pushing game 4 down and connected game 2 down.
    ----------------------------------------------------------------------------*/
    static test_GrowItemDown_PushColumnAdjacentItemDown(appContext: IAppContext, testContext: UnitTestContext)
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
            appContext,
            testContext,
            "GameMoverTests. test_GrowItemDown_PushColumnAdjacentItemDown",
            "T4",
            setup);
    }
}