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

export class GameMoverTests
{
    /*----------------------------------------------------------------------------
        %%Function: GameMoverTests.testMoveItemDownPushingOneGameDownMaintainBuffer

        move game 6 down by 2 rows. this should push games 6 and 7 down by 2
        rows.
    ----------------------------------------------------------------------------*/
    static testMoveItemDownPushingOneGameDownMaintainBuffer(appContext: IAppContext, testContext: UnitTestContext)
    {
        appContext;
        testContext.StartTest("GameMoverTests. testMoveItemDownPushingOneGameDownMaintainBuffer");

        let grid: Grid = new Grid();

        grid.m_firstGridPattern = new RangeInfo(9, 1, 6, 1);

        // setup the precondition
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 6, 23, 8,), 1, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(27, 6, 37, 8,), 2, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(41, 6, 51, 8,), 3, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(55, 6, 65, 8,), 4, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 9, 19, 11,), 5, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(67, 9, 77, 11,), 6, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(81, 9, 91, 11,), 7, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(31, 9, 47, 11,), 9, false).inferGameInternals();

        // now get the game we want to move
        let item: GridItem = grid.findGameItem(new GameId(6));

        if (item == null)
            throw Error("testMoveItemDownPushingOneGameDownMaintainBuffer: can't find expected item");

        let mover: GameMover = new GameMover(grid);

        let gridNew: Grid = mover.moveGame(item, item.clone().shiftByRows(2), "T9");

        // now verify that the grid was adjusted
        const gridExpected: Grid = new Grid();
        gridExpected.m_firstGridPattern = new RangeInfo(9, 1, 6, 1);

        // setup the expected result
        gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 6, 23, 8,), 1, false).inferGameInternals();
        gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(27, 6, 37, 8,), 2, false).inferGameInternals();
        gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(41, 6, 51, 8,), 3, false).inferGameInternals();
        gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(55, 6, 65, 8,), 4, false).inferGameInternals();
        gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 9, 19, 11,), 5, false).inferGameInternals();
        gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(69, 9, 79, 11,), 6, false).inferGameInternals();
        gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(83, 9, 93, 11,), 7, false).inferGameInternals();
        gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(31, 9, 47, 11,), 9, false).inferGameInternals();

        const changes: GridChange[] = gridNew.diff(gridExpected, "T9");
        if (changes.length != 0)
        {
            grid.logChanges(changes);
            throw Error(
                `testMoveItemDownPushingOneGameDownMaintainBuffer: ${
                grid.logChangesToString(changes)
                }`);
        }
    }

    /*----------------------------------------------------------------------------
        %%Function: GameMoverTests.testMoveItemUpPushingOneGameUpMaintainBuffer

        Move game 7 up by 2 rows. Should also move game 6 up by 2 rows
    ----------------------------------------------------------------------------*/
    static testMoveItemUpPushingOneGameUpMaintainBuffer(appContext: IAppContext, testContext: UnitTestContext)
    {
        appContext;
        testContext.StartTest("GameMoverTests. testMoveItemUpPushingOneGameUpMaintainBuffer");

        let grid: Grid = new Grid();

        grid.m_firstGridPattern = new RangeInfo(9, 1, 6, 1);

        // setup the precondition
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 6, 23, 8,), 1, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(27, 6, 37, 8,), 2, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(41, 6, 51, 8,), 3, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(55, 6, 65, 8,), 4, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 9, 19, 11,), 5, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(69, 9, 79, 11,), 6, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(83, 9, 93, 11,), 7, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(31, 9, 47, 11,), 9, false).inferGameInternals();

        // now get the game we want to move
        let item: GridItem = grid.findGameItem(new GameId(7));

        if (item == null)
            throw Error("testMoveItemUpPushingOneGameUpMaintainBuffer: can't find expected item");

        let mover: GameMover = new GameMover(grid);

        let gridNew: Grid = mover.moveGame(item, item.clone().shiftByRows(-2), "T9");

        // now verify that the grid was adjusted
        const gridExpected: Grid = new Grid();
        gridExpected.m_firstGridPattern = new RangeInfo(9, 1, 6, 1);

        // setup the expected result
        gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 6, 23, 8,), 1, false).inferGameInternals();
        gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(27, 6, 37, 8,), 2, false).inferGameInternals();
        gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(41, 6, 51, 8,), 3, false).inferGameInternals();
        gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(55, 6, 65, 8,), 4, false).inferGameInternals();
        gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 9, 19, 11,), 5, false).inferGameInternals();
        gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(67, 9, 77, 11,), 6, false).inferGameInternals();
        gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(81, 9, 91, 11,), 7, false).inferGameInternals();
        gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(31, 9, 47, 11,), 9, false).inferGameInternals();

        const changes: GridChange[] = gridNew.diff(gridExpected, "T9");
        if (changes.length != 0)
        {
            grid.logChanges(changes);
            throw Error(
                `testMoveItemUpPushingOneGameUpMaintainBuffer: ${
                grid.logChangesToString(changes)
                }`);
        }
    }

    /*----------------------------------------------------------------------------
        %%Function: GameMoverTests.testGrowItemPushingOneGameDownMaintainBuffer

        T4
        Grow game2 by 4 rows, which will grow game 3 by 2 rows because of the
        outgoing connection between game2 and game3
    ----------------------------------------------------------------------------*/
    static testGrowItemDraggingConnectedGameDown(appContext: IAppContext, testContext: UnitTestContext)
    {
        appContext;
        testContext.StartTest("GameMoverTests. testGrowItemPushingOneGameDownMaintainBuffer");

        let grid: Grid = new Grid();
        const bracket: string = "T4";

        grid.m_firstGridPattern = new RangeInfo(9, 1, 6, 1);

        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 1, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(23, 6, 33, 8,), 2, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 9, 29, 11,), 3, false).inferGameInternals();


        // now get the game we want to move
        let item: GridItem = grid.findGameItem(new GameId(2));

        if (item == null)
            throw Error("testMoveItemUpPushingOneGameUpMaintainBuffer: can't find expected item");

        let mover: GameMover = new GameMover(grid);

        let gridNew: Grid = mover.moveGame(item, item.clone().growShrink(4), bracket);

        // now verify that the grid was adjusted
        const gridExpected: Grid = new Grid();
        gridExpected.m_firstGridPattern = new RangeInfo(9, 1, 6, 1);

        // setup the expected result
        gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 1, false).inferGameInternals();
        gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(23, 6, 37, 8,), 2, false).inferGameInternals();
        gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 9, 31, 11,), 3, false).inferGameInternals();

        const changes: GridChange[] = gridNew.diff(gridExpected, bracket);
        if (changes.length != 0)
        {
            grid.logChanges(changes);
            throw Error(
                `testGrowItemPushingOneGameDownMaintainBuffer: ${
                grid.logChangesToString(changes)
                }`);
        }
    }

    /*----------------------------------------------------------------------------
        %%Function: GameMoverTests.testGrowItemDraggingConnectedByLineGameDown

        T4
        Grow game2 by 4 rows, which will grow game 3 by 2 rows because of the
        outgoing connection between game2 and game3. The game feeders are
        connected by lines, so the lines have to move as well
    ----------------------------------------------------------------------------*/
    static testGrowItemDraggingConnectedByLineGameDown(appContext: IAppContext, testContext: UnitTestContext)
    {
        appContext;
        testContext.StartTest("GameMoverTests. testGrowItemDraggingConnectedByLineGameDown");

        let grid: Grid = new Grid();
        const bracket: string = "T4";

        grid.m_firstGridPattern = new RangeInfo(9, 1, 6, 1);

        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 1, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(14, 9, 14, 11,), -1, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(23, 6, 33, 8,), 2, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(28, 9, 28, 11,), -1, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 12, 29, 14,), 3, false).inferGameInternals();

        // now get the game we want to move
        let item: GridItem = grid.findGameItem(new GameId(2));

        if (item == null)
            throw Error("testMoveItemUpPushingOneGameUpMaintainBuffer: can't find expected item");

        let mover: GameMover = new GameMover(grid);

        let gridNew: Grid = mover.moveGame(item, item.clone().growShrink(4), bracket);

        // now verify that the grid was adjusted
        const gridExpected: Grid = new Grid();
        gridExpected.m_firstGridPattern = new RangeInfo(9, 1, 6, 1);

        // setup the expected result
        gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 1, false).inferGameInternals();
        gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(14, 9, 14, 11,), -1, false).inferGameInternals();
        gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(23, 6, 37, 8,), 2, false).inferGameInternals();
        gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(30, 9, 30, 11,), -1, false).inferGameInternals();
        gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 12, 31, 14,), 3, false).inferGameInternals();

        const changes: GridChange[] = gridNew.diff(gridExpected, bracket);
        if (changes.length != 0)
        {
            grid.logChanges(changes);
            throw Error(
                `testGrowItemPushingOneGameDownMaintainBuffer: ${
                grid.logChangesToString(changes)
                }`);
        }
    }

    /*----------------------------------------------------------------------------
        %%Function: GameMoverTests.testGrowItemDraggingConnectedFeederGameDown

        the target game grows, moving the bottom game feed location, dragging
        the feeding game along...
    ----------------------------------------------------------------------------*/
    static testGrowItemDraggingConnectedFeederGameDown(appContext: IAppContext, testContext: UnitTestContext)
    {
        appContext;
        testContext.StartTest("GameMoverTests. testGrowItemDraggingConnectedFeederGameDown");

        let grid: Grid = new Grid();
        const bracket: string = "T4";

        grid.m_firstGridPattern = new RangeInfo(9, 1, 6, 1);

        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 1, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(23, 6, 33, 8,), 2, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 9, 29, 11,), 3, false).inferGameInternals();


        // now get the game we want to move
        let item: GridItem = grid.findGameItem(new GameId(3));

        if (item == null)
            throw Error("testMoveItemUpPushingOneGameUpMaintainBuffer: can't find expected item");

        let mover: GameMover = new GameMover(grid);

        let gridNew: Grid = mover.moveGame(item, item.clone().growShrink(2), bracket);

        // now verify that the grid was adjusted
        const gridExpected: Grid = new Grid();
        gridExpected.m_firstGridPattern = new RangeInfo(9, 1, 6, 1);

        // setup the expected result
        gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 1, false).inferGameInternals();
        gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(23, 6, 37, 8,), 2, false).inferGameInternals();
        gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 9, 31, 11,), 3, false).inferGameInternals();

        const changes: GridChange[] = gridNew.diff(gridExpected, bracket);
        if (changes.length != 0)
        {
            grid.logChanges(changes);
            throw Error(
                `testGrowItemPushingOneGameDownMaintainBuffer: ${
                grid.logChangesToString(changes)
                }`);
        }
    }

    static testGrowItemDraggingConnectedFeederGameUp(appContext: IAppContext, testContext: UnitTestContext)
    {
        appContext;
        testContext.StartTest("GameMoverTests. testGrowItemDraggingConnectedFeederGameUp");

        let grid: Grid = new Grid();
        const bracket: string = "T4";

        grid.m_firstGridPattern = new RangeInfo(9, 1, 6, 1);

        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(11, 6, 21, 8,), 1, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(25, 6, 35, 8,), 2, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(15, 9, 31, 11,), 3, false).inferGameInternals();


        // now get the game we want to move
        let item: GridItem = grid.findGameItem(new GameId(3));

        if (item == null)
            throw Error("testMoveItemUpPushingOneGameUpMaintainBuffer: can't find expected item");

        let mover: GameMover = new GameMover(grid);

        let gridNew: Grid = mover.moveGame(item, item.clone().growShrinkFromTop(2), bracket);

        // now verify that the grid was adjusted
        const gridExpected: Grid = new Grid();
        gridExpected.m_firstGridPattern = new RangeInfo(9, 1, 6, 1);

        // setup the expected result
        gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(7, 6, 21, 8,), 1, false).inferGameInternals();
        gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(25, 6, 35, 8,), 2, false).inferGameInternals();
        gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 9, 31, 11,), 3, false).inferGameInternals();

        const changes: GridChange[] = gridNew.diff(gridExpected, bracket);
        if (changes.length != 0)
        {
            grid.logChanges(changes);
            throw Error(
                `testGrowItemPushingOneGameDownMaintainBuffer: ${
                grid.logChangesToString(changes)
                }`);
        }
    }

    static testGrowItemDraggingConnectedByLineFeederGameUp(appContext: IAppContext, testContext: UnitTestContext)
    {
        appContext;
        testContext.StartTest("GameMoverTests. testGrowItemDraggingConnectedByLineFeederGameUp");

        let grid: Grid = new Grid();
        const bracket: string = "T4";

        grid.m_firstGridPattern = new RangeInfo(9, 1, 6, 1);

        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(11, 6, 21, 8,), 1, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(16, 9, 16, 11,), -1, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(25, 6, 35, 8,), 2, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(30, 9, 30, 11,), -1, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(15, 12, 31, 14,), 3, false).inferGameInternals();


        // now get the game we want to move
        let item: GridItem = grid.findGameItem(new GameId(3));

        if (item == null)
            throw Error("testMoveItemUpPushingOneGameUpMaintainBuffer: can't find expected item");

        let mover: GameMover = new GameMover(grid);

        let gridNew: Grid = mover.moveGame(item, item.clone().growShrinkFromTop(2), bracket);

        // now verify that the grid was adjusted
        const gridExpected: Grid = new Grid();
        gridExpected.m_firstGridPattern = new RangeInfo(9, 1, 6, 1);

        // setup the expected result
        gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(7, 6, 21, 8,), 1, false).inferGameInternals();
        gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(14, 9, 14, 11,), -1, false).inferGameInternals();
        gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(25, 6, 35, 8,), 2, false).inferGameInternals();
        gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(30, 9, 30, 11,), -1, false).inferGameInternals();
        gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 12, 31, 14,), 3, false).inferGameInternals();

        const changes: GridChange[] = gridNew.diff(gridExpected, bracket);
        if (changes.length != 0)
        {
            grid.logChanges(changes);
            throw Error(
                `testGrowItemPushingOneGameDownMaintainBuffer: ${
                grid.logChangesToString(changes)
                }`);
        }
    }

    /*----------------------------------------------------------------------------
        %%Function: GameMoverTests.testGrowItemPushingOneGameDownMaintainBuffer

        Grow game 3 by 2 rows, pushing game 4 down and connected game 2 down.
    ----------------------------------------------------------------------------*/
    static testGrowItemPushingOneGameDownMaintainBuffer(appContext: IAppContext)
    {
        appContext;
        let grid: Grid = new Grid();
        const bracket: string = "T4";

        grid.m_firstGridPattern = new RangeInfo(9, 1, 6, 1);

        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 1, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(23, 6, 33, 8,), 2, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 9, 29, 11,), 3, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(35, 9, 45, 11,), 4, false).inferGameInternals();


        // now get the game we want to move
        let item: GridItem = grid.findGameItem(new GameId(3));

        if (item == null)
            throw Error("testMoveItemUpPushingOneGameUpMaintainBuffer: can't find expected item");

        let mover: GameMover = new GameMover(grid);

        let gridNew: Grid = mover.moveGame(item, item.clone().growShrink(2), bracket);

        // now verify that the grid was adjusted
        const gridExpected: Grid = new Grid();
        gridExpected.m_firstGridPattern = new RangeInfo(9, 1, 6, 1);

        // setup the expected result
        gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(9, 6, 19, 8,), 1, false).inferGameInternals();
        gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(25, 6, 35, 8,), 2, false).inferGameInternals();
        gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(13, 9, 31, 11,), 3, false).inferGameInternals();
        gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(37, 9, 47, 11,), 4, false).inferGameInternals();

        const changes: GridChange[] = gridNew.diff(gridExpected, bracket);
        if (changes.length != 0)
        {
            grid.logChanges(changes);
            throw Error(
                `testGrowItemPushingOneGameDownMaintainBuffer: ${
                grid.logChangesToString(changes)
                }`);
        }

    }
}