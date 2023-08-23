import { IAppContext } from "../../AppContext/AppContext";
import { RangeInfo } from "../../Interop/Ranges";
import { StreamWriter } from "../../Support/StreamWriter";
import { TestResult } from "../../Support/TestResult";
import { TestRunner } from "../../Support/TestRunner";
import { BracketGame, IBracketGame } from "../BracketGame";
import { GameId } from "../GameId";
import { GameNum } from "../GameNum";
import { Grid } from "../Grid";
import { GridItem } from "../GridItem";
import { GridAdjust } from "./GridAdjust";
import { IGridAdjuster } from "./IGridAdjuster";
import { Spacer } from "./Spacer";

/*----------------------------------------------------------------------------
    Adjuster_WantToGrowUpAtTopOfGrid.Adjuster_NeedExtraSpaceBelowRegionForGameInsert

    In this adjuster, we have a top source defined, but no bottom source.
    we have flexibility on the bottom, but if we are crowding an existing item
    we might want more space.
----------------------------------------------------------------------------*/
export class Adjuster_NeedExtraSpaceBelowRegionForGameInsert implements IGridAdjuster
{
    getMinRowForRegionContainingRow(gridTry: Grid, row: number): number
    {
        let minRow = Number.MAX_VALUE;

        gridTry.enumerateOverlapping(
            [{
                range: new RangeInfo(row, 1, 1, 100),
                delegate: (range, item, kind) =>
                {
                    range; kind;
                    minRow = Math.min(minRow, item.Range.FirstRow);
                    return true;
                }
            }]);

        return minRow;
    }

    calcAdjuster(gridTry: Grid, game: IBracketGame): { adjusterApplies: boolean, insertBefore?: number, rowsToInsert?: number }
    {
        let [source1, source2, outgoing] = gridTry.getRangeInfoForGameFeederItemConnectionPoints(game);

        if (source1 == null)
            return { adjusterApplies: false };

        if (source2 != null)
            return { adjusterApplies: false };

        if (outgoing != null)
            return { adjusterApplies: false };

        // source1 and 2 swap??
        const lastRowForGame = source1.LastRow + 11;

        // we don't have a bottom source, so let's assume we want a standard 11 height game
        const minRowForRegionOverlapping = this.getMinRowForRegionContainingRow(gridTry, lastRowForGame);

        if (minRowForRegionOverlapping > lastRowForGame)
            return { adjusterApplies: false };

        const bottomRegion = new RangeInfo(minRowForRegionOverlapping, 1000, 1, 1000);

        if (!gridTry.isRangeIndependent(bottomRegion))
            return { adjusterApplies: false };

        // now see how many rows we would like to insert
        const rowsNeeded = lastRowForGame - bottomRegion.FirstRow;

        if (!Spacer.canInsertRowSpaceBefore(gridTry, bottomRegion.FirstRow))
            return { adjusterApplies: false };

        return { adjusterApplies: true, insertBefore: bottomRegion.FirstRow, rowsToInsert: rowsNeeded };
    }

    doesAdjusterApply(
        gridTry: Grid,
        game: IBracketGame,
        column: number): boolean
    {
        column;

        const { adjusterApplies } = this.calcAdjuster(gridTry, game);

        return adjusterApplies;
    }

    doAdjustment(grid: Grid, game: IBracketGame, column: number): boolean
    {
        column;

        const { adjusterApplies, insertBefore, rowsToInsert } = this.calcAdjuster(grid, game);

        if (adjusterApplies)
            Spacer.insertRowSpaceBefore(grid, insertBefore, rowsToInsert);

        return adjusterApplies;
    }
}

export class Adjuster_NeedExtraSpaceBelowRegionForGameInsertTests
{
    static runAllTests(appContext: IAppContext, outStream: StreamWriter)
    {
        TestRunner.runAllTests(this, TestResult, appContext, outStream);
    }

    /*----------------------------------------------------------------------------
        %%Function: Adjuster_NeedExtraSpaceBelowRegionForGameInsert.testInsertSpaceAtTopRegion_SpacedAlreadyNotEnough

        
    ----------------------------------------------------------------------------*/
    static test_InsertSpaceAtTopRegion_SpacedAlreadyNotEnough(result: TestResult)
    {
        let grid: Grid = new Grid();

        grid.m_firstGridPattern = new RangeInfo(9, 1, 3, 1);

        // setup the precondition
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(101, 6, 111, 8,), 11, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(106, 9, 106, 11,), -1, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(115, 6, 125, 8,), 12, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(127, 9, 137, 11,), 13, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(141, 9, 151, 11,), 14, false).inferGameInternals();
        grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord(105, 12, 115, 14,), 15, true).inferGameInternals();

        // now try to insert game...
        let game: IBracketGame = BracketGame.CreateFromGameSync("T14", new GameNum(15));

        let gridNew: Grid = grid.clone();
        let reqColumn: number = 12;

        GridAdjust.rearrangeGridForCommonConflicts(gridNew, game, reqColumn);

        // now verify that the grid was adjusted
        let item: GridItem = gridNew.findGameItem(new GameId(13));

        if (item == null)
            result.addError("testInsertSpaceAtTopRegion_SpacedAlreadyNotEnough: game 13 disappeared?");

        if (item.Range.FirstRow != 131)
            result.addError("testInsertSpaceAtTopRegion_SpacedAlreadyNotEnough: game 13 didn't move!");
    }
}