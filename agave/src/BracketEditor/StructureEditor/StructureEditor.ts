
import { IBracketGame, BracketGame, IBracketGame as IBracketGame1 } from "../BracketGame";
import { IAppContext, AppContext } from "../../AppContext/AppContext";
import { RangeInfo, Ranges, RangeOverlapKind } from "../../Interop/Ranges";
import { Grid, AdjustRangeGrowExtraRow } from "../Grid";
import { GameFormatting } from "../GameFormatting";
import { GlobalDataBuilder } from "../../Brackets/GlobalDataBuilder";
import { GridChange, GridChangeOperation } from "../GridChange";
import { GridItem } from "../GridItem";
import { _undoManager } from "../Undo";
import { DispatchWithCatchDelegate, Dispatcher } from "../Dispatcher";
import { GridRanker } from "../GridRanker";
import { GameMover } from "../GameMover";
import { GridBuilder } from "../../Brackets/GridBuilder";
import { ApplyGridChange } from "./ApplyGridChange";
import { StructureRemove } from "./StructureRemove";
import { StructureInsert } from "./StructureInsert";
import { JsCtx } from "../../Interop/JsCtx";
import { PerfTimer } from "../../PerfTimer";
import { Coachstate } from "../../Coachstate";
import { CoachTransition } from "../../CoachTransition";
import { HelpTopic, HelpInfo } from "../../HelpInfo";
import { SetupState } from "../../Setup";

let _moveSelection: RangeInfo = null;

export class StructureEditor
{
    static async copySelectionToClipboardClick(appContext: IAppContext)
    {
        if (!Dispatcher.RequireBracketReady(appContext))
            return;

        let delegate: DispatchWithCatchDelegate = async (context) =>
        {
            await this.copySelectionToClipboard(appContext, context);
            await appContext.invalidateHeroList(context);
        };

        await Dispatcher.ExclusiveDispatchWithCatch(delegate, appContext);
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.syncBracketChangesFromGameSheet

        sync any override changes from the game sheet into the field & team
        tables.
    ----------------------------------------------------------------------------*/
    static async syncBracketChangesFromGameSheetClick(appContext: IAppContext)
    {
        if (!Dispatcher.RequireBracketReady(appContext))
            return;

        let delegate: DispatchWithCatchDelegate = async (context) =>
        {
            await this.syncBracketChangesFromGameSheet(appContext, context);
            await appContext.invalidateHeroList(context);
        };

        await Dispatcher.ExclusiveDispatchWithCatch(delegate, appContext);
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.toggleShowDataSheetsClick

        Show or hide all the supporting sheets.
    ----------------------------------------------------------------------------*/
    static async toggleShowDataSheetsClick(appContext: IAppContext)
    {
        if (!Dispatcher.RequireBracketReady(appContext))
            return;

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
        if (!Dispatcher.RequireBracketReady(appContext))
            return;

        let delegate: DispatchWithCatchDelegate = async (context) =>
        {
            context.pushTrackingBookmark('undo');
            await _undoManager.undo(appContext, context);
            context.releaseTrackedItemsUntil('undo');

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
        if (!Dispatcher.RequireBracketReady(appContext))
            return;

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
        if (!Dispatcher.RequireBracketReady(appContext))
            return;

        let delegate: DispatchWithCatchDelegate = async (context) =>
        {
            context.pushTrackingBookmark('redo');
            await _undoManager.redo(appContext, context);
            context.releaseTrackedItemsUntil('redo');

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
        if (!Dispatcher.RequireBracketReady(appContext))
            return;

        let delegate: DispatchWithCatchDelegate = async (context) =>
        {
            const timer: PerfTimer = new PerfTimer();

            timer.pushTimer("insertGameAtSelectionClick PART 1");
            const bookmark: string = "insertGameAtSelection";
            context.pushTrackingBookmark(bookmark);
            await StructureInsert.insertGameAtSelection(appContext, context, game);
            context.releaseTrackedItemsUntil(bookmark);
            timer.popTimer();

            timer.pushTimer("insertGameAtSelectionClick PART 2");

            appContext.Teaching.transitionState(CoachTransition.AddGame);

            await appContext.invalidateHeroList(context);
            timer.popTimer();
        };

        await Dispatcher.ExclusiveDispatchWithCatch(delegate, appContext);
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.repairGameAtSelectionClick

        Remove and reinsert the game at the selection
    ----------------------------------------------------------------------------*/
    static async repairGameAtSelectionClick(appContext: IAppContext)
    {
        if (!Dispatcher.RequireBracketReady(appContext))
            return;

        let delegate: DispatchWithCatchDelegate = async (context) =>
        {
            const bookmark: string = "repairGameAtSelectionClick";
            context.pushTrackingBookmark(bookmark);
            await this.repairGameAtSelection(appContext, context, await this.getBracketName(context));
            context.releaseTrackedItemsUntil(bookmark);

            appContext.Teaching.transitionState(CoachTransition.PullChanges);

            await appContext.invalidateHeroList(context);
        };

        await Dispatcher.ExclusiveDispatchWithCatch(delegate, appContext);
    }


    static async captureSelectionForMove(appContext: IAppContext)
    {
        if (!Dispatcher.RequireBracketReady(appContext))
            return;

        let delegate: DispatchWithCatchDelegate = async (context) =>
        {
            _moveSelection = await Ranges.createRangeInfoForSelection(context);
            // try to extend the selection
            let grid: Grid = await this.gridBuildFromBracket(context);
            const [item, kind] = grid.getFirstOverlappingItem(_moveSelection);

            if (kind != RangeOverlapKind.None && item != null && !item.isLineRange)
            {
                _moveSelection = item.Range;
                const range: Excel.Range = Ranges.rangeFromRangeInfo(context.Ctx.workbook.worksheets.getActiveWorksheet(), _moveSelection);
                range.select();

                await context.sync();
            }
            await appContext.invalidateHeroList(context);
        };

        await Dispatcher.ExclusiveDispatchWithCatch(delegate, appContext);
    }

    static async moveGameAtSelectionClick(appContext: IAppContext)
    {
        if (!Dispatcher.RequireBracketReady(appContext))
            return;

        if (_moveSelection == null)
        {
            appContext.Messages.error(
                ["No game was captured for the move. You have to pick up a game first."],
                { topic: HelpTopic.Commands_PickupGame });

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
        if (!Dispatcher.RequireBracketReady(appContext))
            return;

        let delegate: DispatchWithCatchDelegate = async (context) =>
        {
            const bookmark: string = "removeGameAtSelectionClick";
            context.pushTrackingBookmark(bookmark);
            await StructureRemove.findAndRemoveGame(appContext, context, null, await this.getBracketName(context));
            context.releaseTrackedItemsUntil(bookmark);

            appContext.Teaching.transitionState(CoachTransition.RemoveGame);

            await appContext.invalidateHeroList(context);
        };

        await Dispatcher.ExclusiveDispatchWithCatch(delegate, appContext);
    }


    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.findAndRemoveGameClick

        find the given game in the bracket grid and remove it.
    ----------------------------------------------------------------------------*/
    static async findAndRemoveGameClick(appContext: IAppContext, game: IBracketGame1)
    {
        if (!Dispatcher.RequireBracketReady(appContext))
            return;

        let delegate: DispatchWithCatchDelegate = async (context) =>
        {
            const bookmark: string = "removeGameAtSelectionClick";
            context.pushTrackingBookmark(bookmark);

            await StructureRemove.findAndRemoveGame(appContext, context, game, game.BracketName);
            context.releaseTrackedItemsUntil(bookmark);
            appContext.Teaching.transitionState(CoachTransition.RemoveGame);

            await appContext.invalidateHeroList(context);
        };

        await Dispatcher.ExclusiveDispatchWithCatch(delegate, appContext);
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.copySelectionToClipboard

        Copy the selected area of the bracket to the clipboard
    ----------------------------------------------------------------------------*/
    static async copySelectionToClipboard(appContext: IAppContext, context: JsCtx)
    {
        const grid: Grid = await Grid.createGridFromBracket(context, appContext.getSelectedBracket());
        const selection: RangeInfo = await Ranges.createRangeInfoForSelection(context);

        const gridSelection = grid.createFromRange(selection);

        const selString = gridSelection.logGridCondensedString();
        navigator.clipboard.writeText(selString);
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.syncBracketChangesFromGameSheet

        repair all the items that are 'dirty'
    ----------------------------------------------------------------------------*/
    static async syncBracketChangesFromGameSheet(appContext: IAppContext, context: JsCtx)
    {
        const bracketName: string = await this.getBracketName(context);

        const grid: Grid = await Grid.createGridFromBracket(context, bracketName);

        const bookmark: string = "syncBracketChanges";
        context.pushTrackingBookmark(bookmark);

        // enumerate all the games and collect them
        const items: GridItem[] = [];

        grid.enumerateMatching(
            (item: GridItem) =>
            {
                items.push(item);
                return true;
            },
            (item: GridItem) =>
            {
                return !item.isLineRange;
            });

        const changes: GridChange[] = [];

        for (let item of items)
        {
            const game: IBracketGame = await BracketGame.CreateFromGameId(context, bracketName, item.GameId);

            if (game.NeedsDataPull)
            {
                changes.push(new GridChange(GridChangeOperation.RemoveLite, GridItem.createFromItem(item)));
                changes.push(new GridChange(GridChangeOperation.InsertLite, GridItem.createFromItem(item)));
            }
        }

        await ApplyGridChange.applyChanges(appContext, context, changes, bracketName);
        appContext.Teaching.transitionState(CoachTransition.PullChanges);

        context.releaseTrackedItemsUntil(bookmark);
    }


    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.toggleShowDataSheets

        Show or hide all the supporting sheets.
    ----------------------------------------------------------------------------*/
    static async toggleShowDataSheets(appContext: IAppContext, context: JsCtx)
    {
        appContext;

        // first, determine if we are hiding or showing -- based on whether
        // the global data sheet is hidden
        const dataSheet: Excel.Worksheet = context.Ctx.workbook.worksheets.getItem(GlobalDataBuilder.SheetName);

        dataSheet.load("visibility");
        await context.sync();

        const visibility: Excel.SheetVisibility =
            dataSheet.visibility == Excel.SheetVisibility.hidden
                ? Excel.SheetVisibility.visible
                : Excel.SheetVisibility.hidden;

        context.Ctx.workbook.worksheets.load("items");
        await context.sync();
        context.Ctx.workbook.worksheets.items.forEach(
            async sheet =>
            {
                sheet.load("name");
                await context.sync();
                if (sheet.name != GridBuilder.SheetName)
                    sheet.visibility = visibility;
            });

        await context.sync();
    }


    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.isRangeValidForAnyGame
    ----------------------------------------------------------------------------*/
    static async isRangeValidForAnyGame(context: JsCtx, range: Excel.Range): Promise<boolean>
    {
        return await GameFormatting.isCellInGameTitleColumn(context, range)
            && await GameFormatting.isCellInGameScoreColumn(context, range.getOffsetRange(0, 1))
            && await GameFormatting.isCellInLineColumn(context, range.getOffsetRange(0, 2));
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.isRangeValidForTopOrBottomGame
    ----------------------------------------------------------------------------*/
    static async isRangeValidForTopOrBottomGame(context: JsCtx, range: Excel.Range): Promise<boolean>
    {
        range.load("address");
        await context.sync();

        if (!await GameFormatting.isCellInLineRow(context, range.getOffsetRange(-1, 0)) || !await GameFormatting.isCellInLineRow(context, range.getOffsetRange(1, 0)))
        {
            return false;
        }

        return await StructureEditor.isRangeValidForAnyGame(context, range);
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.getValidRangeInfoForGameInsert
    ----------------------------------------------------------------------------*/
    static async getValidRangeInfoForGameInsert(context: JsCtx, range: Excel.Range): Promise<RangeInfo>
    {
        range.load("rowIndex");
        range.load("rowCount");
        range.load("columnIndex");
        await context.sync();

        const rowCount: number = range.rowCount == 1 ? 11 : range.rowCount;

        if (rowCount >= 9
            && await StructureEditor.isRangeValidForTopOrBottomGame(context, range.getCell(0, 0))
            && await StructureEditor.isRangeValidForTopOrBottomGame(context, range.getCell(rowCount - 1, 0)))
        {
            return new RangeInfo(range.rowIndex, rowCount, range.columnIndex, 3);
        }

        return null
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.getBracketName

        get the bracketName from the workbook
    ----------------------------------------------------------------------------*/
    static async getBracketName(context: JsCtx): Promise<string>
    {
        const values: any[][] = await Ranges.getValuesFromNamedCellRange(context, "BracketChoice");
        return values[0][0];
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.getFieldCount
    ----------------------------------------------------------------------------*/
    static async getFieldCount(context: JsCtx): Promise<number>
    {
        const values: any[][] = await Ranges.getValuesFromNamedCellRange(context, "FieldCount");
        return values[0][0];
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.getNextFieldName
    ----------------------------------------------------------------------------*/
    static getNextFieldName(fields: string[], fieldCount: number): string
    {
        if (fields == null)
            return "Field #1";

        let lastFieldNum: number = 0;

        for (let field of fields)
        {
            const fieldNumCur: number = parseInt(field[field.length - 1]);

            if (fieldNumCur > lastFieldNum)
                lastFieldNum = fieldNumCur;
        }

        if (lastFieldNum >= fieldCount)
            return "Field #1";

        return `Field #${lastFieldNum + 1}`;
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
    static async repairGameAtSelection(appContext: IAppContext, context: JsCtx, bracketName: string)
    {
        let selection: RangeInfo = await Ranges.createRangeInfoForSelection(context);

        let grid: Grid = await this.gridBuildFromBracket(context);
        const [item, kind] = grid.getFirstOverlappingItem(selection);

        if (kind == RangeOverlapKind.None || item == null || item.isLineRange)
        {
            appContext.Messages.error(
                [`Could not find a game at the selected range: ${selection.toString()}`],
                { topic: HelpTopic.Commands_RepairGame });

            return;
        }

        // since we want to delete and add it back, we're going to manually
        // create our diff list
        let changes: GridChange[] = [];

        changes.push(new GridChange(GridChangeOperation.Remove, GridItem.createFromItem(item)));
        changes.push(new GridChange(GridChangeOperation.Insert, GridItem.createFromItem(item)));

        await ApplyGridChange.applyChanges(appContext, context, changes, bracketName);
    }

    static async doGameMoveToSelection(appContext: IAppContext, context: JsCtx, selection: RangeInfo, bracketName: string)
    {
        const grid: Grid = await Grid.createGridFromBracket(context, bracketName);
        const itemOld: GridItem = grid.inferGameItemFromSelection(selection);
        const newSelection: RangeInfo = await await Ranges.createRangeInfoForSelection(context);

        grid.adjustSelectionForGameInsertOrMove(newSelection);
        newSelection.setLastColumn(newSelection.FirstColumn + 2);

        // let's log some things useful for unit test building
        console.log("MOVE: Original grid");
        grid.logGridCondensed();
        // now make the selection a happy selection
        const itemNew: GridItem = itemOld.clone().setAndInferGameInternals(newSelection);

        console.log("MOVE: RequestedTarget:");
        console.log(`${itemNew.GameId == null ? -1 : itemNew.GameId.Value}:${itemNew.SwapTopBottom ? "S" : ""} ${itemNew.Range.toString()}`);

        const mover: GameMover = new GameMover(grid);
        const gridNew = mover.moveGame(itemOld, itemNew, bracketName);

        if (gridNew == null)
        {
            appContext.Messages.error(["I don't know how to move the game to this selection. It would probably break the bracket."], null, 8000);
            return;
        }

        if (gridNew != null)
        {
            // move isn't going to change any field/times
            _undoManager.setUndoGrid(grid, []);
            await ApplyGridChange.diffAndApplyChanges(appContext, context, grid, gridNew, bracketName);
            if (mover.Warning != "")
                appContext.Messages.error([mover.Warning], null, 8000);
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

    static async applyFinalFormatting(appContext: IAppContext, context: JsCtx, bracketName: string)
    {
        appContext;

        const grid: Grid = await Grid.createGridFromBracket(context, bracketName);
        const gridArea: RangeInfo = grid.getPrintArea(6);

        const printArea: RangeInfo = RangeInfo.createFromCorners(
            gridArea.topLeft().newSetRow(0),
            gridArea.bottomRight().offset(0, 1, 0, 1));

        console.log(`gridArea: ${gridArea.toString()}`);

        const sheet: Excel.Worksheet = context.Ctx.workbook.worksheets.getActiveWorksheet();
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
        rangeWholeChampionDayTop.format.borders.getItem('EdgeRight').weight = Excel.BorderWeight.thick;
        rangeWholeChampionDayBottom.format.borders.getItem('EdgeRight').weight = Excel.BorderWeight.thick;

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

        await context.sync();
    }
}