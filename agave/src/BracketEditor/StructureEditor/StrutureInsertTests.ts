import { IAppContext } from "../../AppContext/AppContext";
import { RangeInfo } from "../../Interop/Ranges";
import { StreamWriter } from "../../Support/StreamWriter";
import { TestResult } from "../../Support/TestResult";
import { TestRunner } from "../../Support/TestRunner";
import { BracketGame, IBracketGame } from "../BracketGame";
import { GameId } from "../GameId";
import { Grid } from "../Grid";
import { GridChange } from "../GridChange";
import { GridRanker } from "../GridRanker";
import { StructureInsert } from "./StructureInsert";

interface SetupTestDelegate
{
    (grid: Grid, gridExpected: Grid): { insertAt: RangeInfo, game: IBracketGame };
}

export class StructureInsertTests
{
    static runAllTests(appContext: IAppContext, outStream: StreamWriter)
    {
        TestRunner.runAllTests(this, TestResult, appContext, outStream);
    }

    static doGameInsertTest(
        result: TestResult,
        bracket: string,
        setupTest: SetupTestDelegate,
        firstGridPattern?: RangeInfo)
    {
        let grid: Grid = new Grid();
        if (firstGridPattern)
            grid.m_firstGridPattern = firstGridPattern;
        else
            grid.m_firstGridPattern = new RangeInfo(9, 1, 6, 1);

        let gridExpected: Grid = grid.clone(); // clone so we get the same first grid pattern

        const { insertAt, game } = setupTest(grid, gridExpected);

        const { gridNew, failReason } = StructureInsert.buildNewGridForGameInsertAtSelection(insertAt, grid, game);

        const rank: number = GridRanker.getGridRank(gridNew, bracket);

        if (rank == -1)
        {
            result.addError("grid after insert is invalid");
            return;
        }

        const changes: GridChange[] = gridNew.diff(gridExpected, bracket);
        if (changes.length != 0)
        {
            grid.logChanges(changes);
            result.addError(
                `${grid.logChangesToString(changes)
                }`);
            return;
        }
    }

    static test_insertRequireSwapAwayInterveningRegion(result: TestResult)
    {
        // NOTE: this isn't a standard bracket scenario -- we now favor swapping games over inserting extra space,
        // so you will get the behavior in insertFavorsSwappingRegionsOverInsertingExtraSpace
        const setup: SetupTestDelegate =
            (grid, gridExpected) =>
            {
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(101, 6, 111, 8,), 11, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(117, 6, 127, 8,), 12, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(135, 9, 145, 11,), 13, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(149, 9, 159, 11,), 14, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(105, 9, 115, 11,), 15, true).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(121, 9, 131, 11,), 16, false).inferGameInternals();

                const game = BracketGame.CreateFromGameSync("T14", new GameId(19).GameNum);
                const insertAt = new RangeInfo(1, 1, 12, 1); // insert into column 12...

                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(101, 6, 111, 8,), 11, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(129, 6, 139, 8,), 12, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(117, 9, 127, 11,), 13, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(149, 9, 159, 11,), 14, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(105, 9, 115, 11,), 15, true).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(133, 9, 143, 11,), 16, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(109, 12, 123, 14,), 19, false).inferGameInternals();

                return { insertAt: insertAt, game: game };
            };

        this.doGameInsertTest(
            result,
            "T14",
            setup,
            new RangeInfo(9, 1, 3, 1));
    }

    static test_insertFavorsSwappingRegionsOverInsertingExtraSpace(result: TestResult)
    {
        const setup: SetupTestDelegate =
            (grid, gridExpected) =>
            {
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(101, 6, 111, 8,), 11, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(117, 6, 127, 8,), 12, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(129, 9, 139, 11,), 13, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(143, 9, 153, 11,), 14, false).inferGameInternals();
                grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(105, 9, 115, 11,), 15, true).inferGameInternals();

                const game = BracketGame.CreateFromGameSync("T14", new GameId(16).GameNum);
                const insertAt = new RangeInfo(1, 1, 9, 1); // insert into column 9...

                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(101, 6, 111, 8,), 11, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(141, 6, 151, 8,), 12, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(117, 9, 127, 11,), 13, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(129, 9, 139, 11,), 14, false).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(105, 9, 115, 11,), 15, true).inferGameInternals();
                gridExpected.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(145, 9, 155, 11,), 16, false).inferGameInternals();

                return { insertAt: insertAt, game: game };
            };

        this.doGameInsertTest(
            result,
            "T14",
            setup,
            new RangeInfo(9, 1, 3, 1));
    }
}

