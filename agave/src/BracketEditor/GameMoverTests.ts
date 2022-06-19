import { IAppContext } from "../AppContext";
import { Grid } from "./Grid";
import { RangeInfo } from "../Interop/Ranges";
import { IBracketGame, BracketGame, IBracketGame as IBracketGame1 } from "./BracketGame";
import { GridItem } from "./GridItem";
import { GridAdjust } from "./GridAdjusters/GridAdjust";
import { GameMover } from "./GridAdjusters/GameMover";
import { GridChange } from "./GridChange";

export class GameMoverTests
{
    static testMoveItemDownPushingOneGameDownMaintainBuffer(appContext: IAppContext)
    {
        appContext;
        let grid: Grid = new Grid();

        grid.m_firstGridPattern = new RangeInfo(9, 1, 6, 1);

        // setup the precondition
        grid.addGameRange(RangeInfo.createFromCornersCoord(13, 6, 23, 8,), 1, false).inferGameInternals();
        grid.addGameRange(RangeInfo.createFromCornersCoord(27, 6, 37, 8,), 2, false).inferGameInternals();
        grid.addGameRange(RangeInfo.createFromCornersCoord(41, 6, 51, 8,), 3, false).inferGameInternals();
        grid.addGameRange(RangeInfo.createFromCornersCoord(55, 6, 65, 8,), 4, false).inferGameInternals();
        grid.addGameRange(RangeInfo.createFromCornersCoord(9, 9, 19, 11,), 5, false).inferGameInternals();
        grid.addGameRange(RangeInfo.createFromCornersCoord(67, 9, 77, 11,), 6, false).inferGameInternals();
        grid.addGameRange(RangeInfo.createFromCornersCoord(81, 9, 91, 11,), 7, false).inferGameInternals();
        grid.addGameRange(RangeInfo.createFromCornersCoord(31, 9, 47, 11,), 9, false).inferGameInternals();

        // now get the game we want to move
        let item: GridItem = grid.findGameItem(6);

        if (item == null)
            throw Error("testMoveItemDownPushingOneGameDownMaintainBuffer: can't find expected item");

        let mover: GameMover = new GameMover(grid);

        let gridNew: Grid = mover.moveGame(item, item.clone().shiftByRows(2), "T9");

        // now verify that the grid was adjusted
        const gridExpected: Grid = new Grid();
        gridExpected.m_firstGridPattern = new RangeInfo(9, 1, 6, 1);

        // setup the precondition
        gridExpected.addGameRange(RangeInfo.createFromCornersCoord(13, 6, 23, 8,), 1, false).inferGameInternals();
        gridExpected.addGameRange(RangeInfo.createFromCornersCoord(27, 6, 37, 8,), 2, false).inferGameInternals();
        gridExpected.addGameRange(RangeInfo.createFromCornersCoord(41, 6, 51, 8,), 3, false).inferGameInternals();
        gridExpected.addGameRange(RangeInfo.createFromCornersCoord(55, 6, 65, 8,), 4, false).inferGameInternals();
        gridExpected.addGameRange(RangeInfo.createFromCornersCoord(9, 9, 19, 11,), 5, false).inferGameInternals();
        gridExpected.addGameRange(RangeInfo.createFromCornersCoord(69, 9, 79, 11,), 6, false).inferGameInternals();
        gridExpected.addGameRange(RangeInfo.createFromCornersCoord(83, 9, 93, 11,), 7, false).inferGameInternals();
        gridExpected.addGameRange(RangeInfo.createFromCornersCoord(31, 9, 47, 11,), 9, false).inferGameInternals();

        const changes: GridChange[] = gridNew.diff(gridExpected, "T9");
        if (changes.length != 0)
        {
            grid.logChanges(changes);
            throw Error(`testMoveItemDownPushingOneGameDownMaintainBuffer: ${grid.logChangesToString(changes)}`);
        }
    }

    static testMoveItemUpPushingOneGameUpMaintainBuffer(appContext: IAppContext) {
        appContext;
        let grid: Grid = new Grid();

        grid.m_firstGridPattern = new RangeInfo(9, 1, 6, 1);

        // setup the precondition
        grid.addGameRange(RangeInfo.createFromCornersCoord(13, 6, 23, 8,), 1, false).inferGameInternals();
        grid.addGameRange(RangeInfo.createFromCornersCoord(27, 6, 37, 8,), 2, false).inferGameInternals();
        grid.addGameRange(RangeInfo.createFromCornersCoord(41, 6, 51, 8,), 3, false).inferGameInternals();
        grid.addGameRange(RangeInfo.createFromCornersCoord(55, 6, 65, 8,), 4, false).inferGameInternals();
        grid.addGameRange(RangeInfo.createFromCornersCoord(9, 9, 19, 11,), 5, false).inferGameInternals();
        grid.addGameRange(RangeInfo.createFromCornersCoord(69, 9, 79, 11,), 6, false).inferGameInternals();
        grid.addGameRange(RangeInfo.createFromCornersCoord(83, 9, 93, 11,), 7, false).inferGameInternals();
        grid.addGameRange(RangeInfo.createFromCornersCoord(31, 9, 47, 11,), 9, false).inferGameInternals();

        // now get the game we want to move
        let item: GridItem = grid.findGameItem(7);

        if (item == null)
            throw Error("testMoveItemUpPushingOneGameUpMaintainBuffer: can't find expected item");

        let mover: GameMover = new GameMover(grid);

        let gridNew: Grid = mover.moveGame(item, item.clone().shiftByRows(-2), "T9");

        // now verify that the grid was adjusted
        const gridExpected: Grid = new Grid();
        gridExpected.m_firstGridPattern = new RangeInfo(9, 1, 6, 1);

        // setup the precondition
        gridExpected.addGameRange(RangeInfo.createFromCornersCoord(13, 6, 23, 8,), 1, false).inferGameInternals();
        gridExpected.addGameRange(RangeInfo.createFromCornersCoord(27, 6, 37, 8,), 2, false).inferGameInternals();
        gridExpected.addGameRange(RangeInfo.createFromCornersCoord(41, 6, 51, 8,), 3, false).inferGameInternals();
        gridExpected.addGameRange(RangeInfo.createFromCornersCoord(55, 6, 65, 8,), 4, false).inferGameInternals();
        gridExpected.addGameRange(RangeInfo.createFromCornersCoord(9, 9, 19, 11,), 5, false).inferGameInternals();
        gridExpected.addGameRange(RangeInfo.createFromCornersCoord(69, 9, 79, 11,), 6, false).inferGameInternals();
        gridExpected.addGameRange(RangeInfo.createFromCornersCoord(83, 9, 93, 11,), 7, false).inferGameInternals();
        gridExpected.addGameRange(RangeInfo.createFromCornersCoord(31, 9, 47, 11,), 9, false).inferGameInternals();

        const changes: GridChange[] = gridNew.diff(gridExpected, "T9");
        if (changes.length != 0) {
            grid.logChanges(changes);
            throw Error(`testMoveItemUpPushingOneGameUpMaintainBuffer: ${grid.logChangesToString(changes)}`);
        }
    }
}