import { IAppContext } from "../AppContext/AppContext";
import { Grid } from "./Grid";
import { RangeInfo } from "../Interop/Ranges";
import { IBracketGame, BracketGame, IBracketGame as IBracketGame1 } from "./BracketGame";
import { GridItem } from "./GridItem";
import { GridAdjust } from "./GridAdjusters/GridAdjust";
import { GameMover } from "./GameMover";
import { GridChange } from "./GridChange";
import { GameId } from "./GameId";
import * as GridRanker from "./GridRanker";
import { TestResult } from "../Support/TestResult";
import { TestRunner } from "../Support/TestRunner";
import { StreamWriter } from "../Support/StreamWriter";

interface SetupGridTestDelegate
{
    (grid: Grid, gridExpected: Grid): [GridItem, GridItem];
}

interface GridTestDelegate
{
    (grid: Grid, gridExpected: Grid, gridItemOld: GridItem, gridItemNew: GridItem, bracket: string): boolean;
}

export class GridTests
{
    static runAllTests(appContext: IAppContext, outStream: StreamWriter)
    {
        TestRunner.runAllTests(this, TestResult, appContext, outStream);
    }

    static doGridTest(
        result: TestResult,
        bracket: string,
        delegate: SetupGridTestDelegate,
        testDelegate: GridTestDelegate)
    {
        let grid: Grid = new Grid();
        grid.m_firstGridPattern = new RangeInfo(9, 1, 6, 1);

        let gridExpected: Grid = grid.clone(); // clone so we get the same first grid pattern

        const [itemOld, itemNew] = delegate(grid, gridExpected);

        const passed = testDelegate(grid, gridExpected, itemOld, itemNew, bracket);

        grid.logGridCondensed();

        if (!passed)
            result.addError("failed");
    }

    static test_getConnectedGridItemForGameResult_NotConnected(result: TestResult)
    {
        const setup: SetupGridTestDelegate =
            (grid, gridExpected): [GridItem, GridItem] =>
            {
                gridExpected;
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(129, 15, 139, 17,), 13, false).inferGameInternals();
                // grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(121, 18, 135, 20,), 18, false).inferGameInternals();

                const itemOld: GridItem = grid.findGameItem(new GameId(13));

                return [itemOld, null];
            };

        const test: GridTestDelegate =
            (grid: Grid, gridExpected: Grid, gridItem: GridItem, gridItemNew: GridItem, bracket: string): boolean =>
            {
                gridExpected;
                gridItemNew;
                bracket;

                const game: IBracketGame = BracketGame.CreateFromGameSync(bracket, gridItem.GameId.GameNum);

                const outgoing: GridItem = grid.getConnectedGridItemForGameResult(game);

                return (outgoing == null);
            }

        this.doGridTest(
            result,
            "T13",
            setup,
            test);
    }

    static test_getConnectedGridItemForGameResult_ConnectedAdjacent(result: TestResult)
    {
        const setup: SetupGridTestDelegate =
            (grid, gridExpected): [GridItem, GridItem] =>
            {
                gridExpected;
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(129, 15, 139, 17,), 13, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(121, 18, 135, 20,), 18, false).inferGameInternals();

                const itemOld: GridItem = grid.findGameItem(new GameId(13));

                return [itemOld, null];
            };

        const test: GridTestDelegate =
            (grid: Grid, gridExpected: Grid, gridItem: GridItem, gridItemNew: GridItem, bracket: string): boolean =>
            {
                gridExpected;
                gridItemNew;
                bracket;

                const game: IBracketGame = BracketGame.CreateFromGameSync(bracket, gridItem.GameId.GameNum);

                const outgoing: GridItem = grid.getConnectedGridItemForGameResult(game);

                if (outgoing == null)
                    return false;

                if (!outgoing.GameId.equals(new GameId(18)))
                    return false;

                return true;
            }

        this.doGridTest(
            result,
            "T13",
            setup,
            test);
    }

    static test_getConnectedGridItemForGameResult_ConnectedByLine(result: TestResult)
    {
        const setup: SetupGridTestDelegate =
            (grid, gridExpected): [GridItem, GridItem] =>
            {
                gridExpected;
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(129, 15, 139, 17,), 13, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(122, 18, 122, 20,), -1, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(121, 21, 135, 23,), 18, false).inferGameInternals();

                const itemOld: GridItem = grid.findGameItem(new GameId(13));

                return [itemOld, null];
            };

        const test: GridTestDelegate =
            (grid: Grid, gridExpected: Grid, gridItem: GridItem, gridItemNew: GridItem, bracket: string): boolean =>
            {
                gridExpected;
                gridItemNew;
                bracket;

                const game: IBracketGame = BracketGame.CreateFromGameSync(bracket, gridItem.GameId.GameNum);

                const outgoing: GridItem = grid.getConnectedGridItemForGameResult(game);

                if (outgoing == null)
                    return false;

                if (!outgoing.GameId.equals(new GameId(18)))
                    return false;

                return true;
            }

        this.doGridTest(
            result,
            "T13",
            setup,
            test);
    }
}
