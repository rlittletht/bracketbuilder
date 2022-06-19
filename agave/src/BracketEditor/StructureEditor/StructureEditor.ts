
import { IBracketGame, BracketGame } from "../BracketGame";
import { IAppContext, AppContext } from "../../AppContext";
import { RangeInfo, Ranges, RangeOverlapKind } from "../../Interop/Ranges";
import { Grid } from "../Grid";
import { GameFormatting } from "../GameFormatting";
import { GlobalDataBuilder } from "../../Brackets/GlobalDataBuilder";
import { GridChange, GridChangeOperation } from "../GridChange";
import { GridItem } from "../GridItem";
import { _undoManager } from "../Undo";
import { DispatchWithCatchDelegate, Dispatcher } from "../Dispatcher";
import { GridRanker } from "../GridRanker";
import { GameMover } from "../GridAdjusters/GameMover";
import { GridBuilder } from "../../Brackets/GridBuilder";
import { ApplyGridChange } from "./ApplyGridChange";
import { StructureRemove } from "./StructureRemove";
import { StructureInsert } from "./StructureInsert";

let _moveSelection: RangeInfo = null;

export class StructureEditor
{
    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.toggleShowDataSheetsClick

        Show or hide all the supporting sheets.
    ----------------------------------------------------------------------------*/
    static async toggleShowDataSheetsClick(appContext: IAppContext)
    {
        let delegate: DispatchWithCatchDelegate = async (context) =>
        {
            await this.toggleShowDataSheets(appContext, context);
            await appContext.invalidateHeroList(context);
        };

        await Dispatcher.ExclusiveDispatchWithCatch(delegate, appContext);
    }
    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.undoClick

        undo the last operation (restore the previous grid)
    ----------------------------------------------------------------------------*/
    static async undoClick(appContext: IAppContext)
    {
        let delegate: DispatchWithCatchDelegate = async (context) =>
        {
            await _undoManager.undo(appContext, context);
            await appContext.invalidateHeroList(context);
        };

        await Dispatcher.ExclusiveDispatchWithCatch(delegate, appContext);
    }

    static async doCrash()
    {
        let a = null;
        a.foo = 1;
    }

    static async finalizeClick(appContext: IAppContext)
    {
        let delegate: DispatchWithCatchDelegate = async (context) =>
        {
            await this.applyFinalFormatting(appContext, context, await this.getBracketName(context));
            await appContext.invalidateHeroList(context);
        };

        await Dispatcher.ExclusiveDispatchWithCatch(delegate, appContext);
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.redoClick

        redo the last undone operation (restore the grid that was undone)
    ----------------------------------------------------------------------------*/
    static async redoClick(appContext: IAppContext)
    {
        let delegate: DispatchWithCatchDelegate = async (context) =>
        {
            await _undoManager.redo(appContext, context);
            await appContext.invalidateHeroList(context);
        };

        await Dispatcher.ExclusiveDispatchWithCatch(delegate, appContext);
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.insertGameAtSelectionClick

        Insert the given bracket game into the current bracket, using the current
        selection (.cells(0,0)) as the top left of the game.

        this does not assume 
    ----------------------------------------------------------------------------*/
    static async insertGameAtSelectionClick(appContext: IAppContext, game: IBracketGame)
    {
        let delegate: DispatchWithCatchDelegate = async (context) =>
        {
            await StructureInsert.insertGameAtSelection(appContext, context, game);
            await appContext.invalidateHeroList(context);
        };

        await Dispatcher.ExclusiveDispatchWithCatch(delegate, appContext);
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.repairGameAtSelectionClick

        Remove and reinsert the game at the selection
    ----------------------------------------------------------------------------*/
    static async repairGameAtSelectionClick(appContext: IAppContext)
    {
        let delegate: DispatchWithCatchDelegate = async (context) =>
        {
            await this.repairGameAtSelection(appContext, context, await this.getBracketName(context));
            await appContext.invalidateHeroList(context);
        };

        await Dispatcher.ExclusiveDispatchWithCatch(delegate, appContext);
    }


    static async captureSelectionForMove(appContext: IAppContext)
    {
        let delegate: DispatchWithCatchDelegate = async (context) =>
        {
            _moveSelection = await Ranges.createRangeInfoForSelection(context);
            await appContext.invalidateHeroList(context);
        };

        await Dispatcher.ExclusiveDispatchWithCatch(delegate, appContext);
    }

    static async moveGameAtSelectionClick(appContext: IAppContext)
    {
        if (_moveSelection == null)
        {
            appContext.log("no selection was capture for the move");
            return;
        }

        let delegate: DispatchWithCatchDelegate = async (context) =>
        {
            await this.doGameMoveToSelection(appContext, context, _moveSelection, await this.getBracketName(context));
            await appContext.invalidateHeroList(context);
        };

        await Dispatcher.ExclusiveDispatchWithCatch(delegate, appContext);
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.removeGameAtSelectionClick

        Remove the game that the selection overlaps
    ----------------------------------------------------------------------------*/
    static async removeGameAtSelectionClick(appContext: IAppContext)
    {
        let delegate: DispatchWithCatchDelegate = async (context) =>
        {
            await StructureRemove.findAndRemoveGame(appContext, context, null, await this.getBracketName(context));
            await appContext.invalidateHeroList(context);
        };

        await Dispatcher.ExclusiveDispatchWithCatch(delegate, appContext);
    }


    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.findAndRemoveGameClick

        find the given game in the bracket grid and remove it.
    ----------------------------------------------------------------------------*/
    static async findAndRemoveGameClick(appContext: IAppContext, game: IBracketGame)
    {
        let delegate: DispatchWithCatchDelegate = async (context) =>
        {
            await StructureRemove.findAndRemoveGame(appContext, context, game, game.BracketName);
            await appContext.invalidateHeroList(context);
        };

        await Dispatcher.ExclusiveDispatchWithCatch(delegate, appContext);
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.toggleShowDataSheets

        Show or hide all the supporting sheets.
    ----------------------------------------------------------------------------*/
    static async toggleShowDataSheets(appContext: IAppContext, ctx: any)
    {
        appContext;

        // first, determine if we are hiding or showing -- based on whether
        // the global data sheet is hidden
        const dataSheet: Excel.Worksheet = ctx.workbook.worksheets.getItem(GlobalDataBuilder.SheetName);

        dataSheet.load("visibility");
        await ctx.sync();

        const visibility: Excel.SheetVisibility =
            dataSheet.visibility == Excel.SheetVisibility.hidden
                ? Excel.SheetVisibility.visible
                : Excel.SheetVisibility.hidden;

        ctx.workbook.worksheets.load("items");
        await ctx.sync();
        ctx.workbook.worksheets.items.forEach(
            async sheet =>
            {
                sheet.load("name");
                await ctx.sync();
                if (sheet.name != GridBuilder.SheetName)
                    sheet.visibility = visibility;
            });

        await ctx.sync();
    }


    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.isRangeValidForAnyGame
    ----------------------------------------------------------------------------*/
    static async isRangeValidForAnyGame(ctx: any, range: Excel.Range): Promise<boolean>
    {
        return await GameFormatting.isCellInGameTitleColumn(ctx, range)
            && await GameFormatting.isCellInGameScoreColumn(ctx, range.getOffsetRange(0, 1))
            && await GameFormatting.isCellInLineColumn(ctx, range.getOffsetRange(0, 2));
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.isRangeValidForTopOrBottomGame
    ----------------------------------------------------------------------------*/
    static async isRangeValidForTopOrBottomGame(ctx: any, range: Excel.Range): Promise<boolean>
    {
        range.load("address");
        await ctx.sync();

        if (!await GameFormatting.isCellInLineRow(ctx, range.getOffsetRange(-1, 0)) || !await GameFormatting.isCellInLineRow(ctx, range.getOffsetRange(1, 0)))
        {
            return false;
        }

        return await StructureEditor.isRangeValidForAnyGame(ctx, range);
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.getValidRangeInfoForGameInsert
    ----------------------------------------------------------------------------*/
    static async getValidRangeInfoForGameInsert(ctx: any, range: Excel.Range): Promise<RangeInfo>
    {
        range.load("rowIndex");
        range.load("rowCount");
        range.load("columnIndex");
        await ctx.sync();

        const rowCount: number = range.rowCount == 1 ? 11 : range.rowCount;

        if (rowCount >= 9
            && await StructureEditor.isRangeValidForTopOrBottomGame(ctx, range.getCell(0, 0))
            && await StructureEditor.isRangeValidForTopOrBottomGame(ctx, range.getCell(rowCount - 1, 0)))
        {
            return new RangeInfo(range.rowIndex, rowCount, range.columnIndex, 3);
        }

        return null
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.getBracketName

        get the bracketName from the workbook
    ----------------------------------------------------------------------------*/
    static async getBracketName(ctx: any): Promise<string>
    {
        // get the bracket choice
        const bracketChoice: Excel.Range = await Ranges.getRangeForNamedCell(ctx, "BracketChoice");
        bracketChoice.load("values");
        await ctx.sync();

        return bracketChoice.values[0][0];
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.gridBuildFromBracket
    ----------------------------------------------------------------------------*/
    static async gridBuildFromBracket(context: any): Promise<Grid>
    {
        const grid: Grid = await Grid.createGridFromBracket(context, await this.getBracketName(context));

        return grid;
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.repairGameAtSelection
    ----------------------------------------------------------------------------*/
    static async repairGameAtSelection(appContext: IAppContext, ctx: any, bracketName: string)
    {
        let selection: RangeInfo = await Ranges.createRangeInfoForSelection(ctx);

        let grid: Grid = await this.gridBuildFromBracket(ctx);
        const [item, kind] = grid.getFirstOverlappingItem(selection);

        if (kind == RangeOverlapKind.None || item == null || item.isLineRange)
        {
            appContext.log(`no game detected at range ${selection.toString()}`);
            return;
        }

        // since we want to delete and add it back, we're going to manually
        // create out diff list
        let changes: GridChange[] = [];

        changes.push(new GridChange(GridChangeOperation.Remove, GridItem.createFromItem(item)));
        changes.push(new GridChange(GridChangeOperation.Insert, GridItem.createFromItem(item)));

        await ApplyGridChange.applyChanges(appContext, ctx, changes, bracketName);
    }

    static async doGameMoveToSelection(appContext: IAppContext, ctx: any, selection: RangeInfo, bracketName: string)
    {
        const grid: Grid = await Grid.createGridFromBracket(ctx, bracketName);
        const itemOld: GridItem = grid.inferGameItemFromSelection(selection);
        const newSelection: RangeInfo = await await Ranges.createRangeInfoForSelection(ctx);
        const itemNew: GridItem = itemOld.clone().setAndInferGameInternals(newSelection);

        const mover: GameMover = new GameMover(grid);
        const gridNew = mover.moveGame(itemOld, itemNew, bracketName);

        if (gridNew != null)
        {
            _undoManager.setUndoGrid(grid);
            await ApplyGridChange.diffAndApplyChanges(appContext, ctx, grid, gridNew, bracketName);
        }
    }

    static async testGridClick(appContext: IAppContext)
    {
        appContext;
        let delegate: DispatchWithCatchDelegate = async (context) =>
        {
            let grid: Grid = await this.gridBuildFromBracket(context);

            grid.logGrid();
            
            console.log(`rank: ${GridRanker.getGridRank(grid, await this.getBracketName(context))}`)
        };

        await Dispatcher.ExclusiveDispatchWithCatch(delegate, appContext);
    }

    static async applyFinalFormatting(appContext: IAppContext, ctx: any, bracketName: string)
    {
        appContext;

        const grid: Grid = await Grid.createGridFromBracket(ctx, bracketName);
        const gridArea: RangeInfo = grid.getPrintArea(4);

        const printArea: RangeInfo = RangeInfo.createFromCorners(
            gridArea.topLeft().newSetRow(0),
            gridArea.bottomRight().offset(0, 1, 0, 1));

        console.log(`gridArea: ${gridArea.toString()}`);

        const sheet: Excel.Worksheet = ctx.workbook.worksheets.getActiveWorksheet();
        sheet.pageLayout.centerHorizontally = true;
        sheet.pageLayout.centerVertically = true;
        sheet.pageLayout.orientation = Excel.PageOrientation.landscape;
        sheet.pageLayout.bottomMargin = 0;
        sheet.pageLayout.topMargin = 0;
        sheet.pageLayout.leftMargin = 0;
        sheet.pageLayout.rightMargin = 0;
        sheet.pageLayout.footerMargin = 0;
        sheet.pageLayout.headerMargin = 0;
        const range: Excel.Range = Ranges.rangeFromRangeInfo(sheet, printArea);
        sheet.pageLayout.setPrintArea(range);

        // and merge the main tournament rows...
        for (let row: number = 0; row < 4; row++)
        {
            const toMerge: RangeInfo = new RangeInfo(
                row,
                1,
                printArea.FirstColumn,
                printArea.ColumnCount);

            const range: Excel.Range = Ranges.rangeFromRangeInfo(sheet, toMerge);
            range.merge(true);
            range.format.horizontalAlignment = Excel.HorizontalAlignment.center;
        }

        // and place the hosted and last updated merge regions
        const rangeHosted: Excel.Range = sheet.getRangeByIndexes(
            printArea.LastRow - 2,
            printArea.FirstColumn,
            1,
            printArea.ColumnCount);
        const rangeHosted1: Excel.Range = sheet.getRangeByIndexes(
            printArea.LastRow - 2,
            printArea.FirstColumn,
            1,
            1);

        rangeHosted1.formulas = [["=\"HOSTED BY \" & TournamentHost"]];
        rangeHosted.format.horizontalAlignment = Excel.HorizontalAlignment.center;
        rangeHosted.format.font.size = 14;
        rangeHosted.format.font.bold = true;

        rangeHosted.merge(true);

        const rangeLastUpdate: Excel.Range = sheet.getRangeByIndexes(
            printArea.LastRow,
            printArea.FirstColumn,
            1,
            printArea.ColumnCount);
        const rangeLastUpdate1: Excel.Range = sheet.getRangeByIndexes(
            printArea.LastRow,
            printArea.FirstColumn,
            1,
            1);

        rangeLastUpdate1.formulas = [["=\"LAST UPDATED: \" & TEXT(LastUpdate, \"mm/dd/YYYY hh:MM AM/PM\")"]];
        rangeLastUpdate.format.horizontalAlignment = Excel.HorizontalAlignment.right;
        rangeLastUpdate.merge(true);

        // now merge the last day on the title
        const rangeChampionDayTop: Excel.Range = sheet.getRangeByIndexes(
            4,
            printArea.LastColumn - 2,
            1,
            1);
        const rangeChampionDayBottom: Excel.Range = sheet.getRangeByIndexes(
            5,
            printArea.LastColumn - 2,
            1,
            1);

        rangeChampionDayTop.formulas = [[ "" ]];
        rangeChampionDayBottom.formulas = [[ "" ]];

        const rangeWholeChampionDayTop: Excel.Range = sheet.getRangeByIndexes(
            4,
            printArea.LastColumn - 5,
            1,
            5);
        const rangeWholeChampionDayBottom: Excel.Range = sheet.getRangeByIndexes(
            5,
            printArea.LastColumn - 5,
            1,
            5);

        rangeWholeChampionDayTop.merge(true);
        rangeWholeChampionDayBottom.merge(true);

        const rangeUnformat: Excel.Range = sheet.getRangeByIndexes(
            3,
            printArea.LastColumn + 1,
            3,
            printArea.FirstColumn + GridBuilder.maxDays * 3 - printArea.LastColumn);

        rangeUnformat.clear();
        rangeUnformat.unmerge();
        sheet.pageLayout.zoom = {
            horizontalFitToPages: 1,
            verticalFitToPages: 1,
            scale: null
        };

        await ctx.sync();
    }
}