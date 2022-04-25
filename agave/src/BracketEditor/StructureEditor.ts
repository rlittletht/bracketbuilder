
import { IBracketGame, BracketGame } from "./BracketGame";
import { BracketDefinition, GameDefinition } from "../Brackets/BracketDefinitions";
import { FormulaBuilder } from "./FormulaBuilder";
import { IAppContext} from "../AppContext";
import { RangeInfo, Ranges, RangeOverlapKind } from "../Interop/Ranges";
import { OADate } from "../Interop/Dates";
import { Grid } from "./Grid";
import { BracketStructureBuilder } from "../Brackets/BracketStructureBuilder";
import { GameFormatting } from "./GameFormatting";
import { GameLines } from "./GameLines";
import { GridGameInsert } from "./GridGameInsert";
import { GridChange, GridChangeOperation } from "./GridChange";
import { GridItem } from "./GridItem";

export class StructureEditor
{
    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.insertGameAtSelectionClick

        Insert the given bracket game into the current bracket, using the current
        selection (.cells(0,0)) as the top left of the game.

        this does not assume 
    ----------------------------------------------------------------------------*/
    static async insertGameAtSelectionClick(appContext: IAppContext, game: IBracketGame)
    {
        await Excel.run(async (context) =>
            this.insertGameAtSelection(appContext, context, game));
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.findAndRemoveGameClick

        find the given game in the bracket grid and remove it.
    ----------------------------------------------------------------------------*/
    static async findAndRemoveGameClick(appContext: IAppContext, game: IBracketGame)
    {
        await Excel.run(async (context) =>
            { StructureEditor.findAndRemoveGame(appContext, context, game) } );
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

        if (!await GameFormatting.isCellInLineRow(ctx, range.getOffsetRange(-1, 0)) ||
            !await GameFormatting.isCellInLineRow(ctx, range.getOffsetRange(1, 0)))
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
        %%Function: StructureEditor.pushPadding

        just (count) number of the given value. useful for padding things
    ----------------------------------------------------------------------------*/
    static pushPadding(ary: any[][], valToPush: any, count: number)
    {
        while (count > 0)
        {
            ary.push(valToPush);
            count--;
        }
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.gridBuildFromBracket
    ----------------------------------------------------------------------------*/
    static async gridBuildFromBracket(context: any): Promise<Grid>
    {
        let grid: Grid = new Grid();

        // get the bracket choice
        const bracketChoice: Excel.Range = await Ranges.getRangeForNamedCell(context, "BracketChoice");
        bracketChoice.load("values");
        await context.sync();

        await grid.loadGridFromBracket(context,
            bracketChoice.values[0][0]);

        return grid;
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.insertGameAtSelection
    ----------------------------------------------------------------------------*/
    static async insertGameAtSelection(appContext: IAppContext, ctx: any, game: IBracketGame)
    {
        game.Unbind();

        // first, see if this game is already on the bracket, and if so, delete it
        await game.Bind(ctx);

        if (game.IsLinkedToBracket)
            await this.findAndRemoveGame(appContext, ctx, game);

        // first make sure we have a complete grid for the bracket
        let grid: Grid = await this.gridBuildFromBracket(ctx);

        // now let's figure out where we want to insert the game
        let requested: RangeInfo = await Ranges.createRangeInfoForSelection(ctx);

        const gridInsert: GridGameInsert = grid.gridGameInsertForGame(game, requested);

        if (gridInsert.m_failReason != null)
        {
            appContext.log(`failed: ${gridInsert.m_failReason}`);
            return;
        }

        /*
        const insertRangeInfo = await StructureEditor.getValidRangeInfoForGameInsert(ctx, rng);

        // ok, see if it overlaps anything on the schedule
        let overlapKind: RangeOverlapKind = grid.doesRangeOverlap(insertRangeInfo);

        if (overlapKind != RangeOverlapKind.None)
        {
            appContext.log(`Can't insert game at ${insertRangeInfo.toString()} -- overlap detected`);
            return;
        }
        */
        // we aren't free and clear yet -- we have to try to place the game and make attachments
        let gridNew: Grid = grid.clone();

        // gridNew.addGameRange(insertRangeInfo, game.GameNum);
        if (gridInsert.m_rangeFeederTop != null)
            gridNew.addLineRange(gridInsert.m_rangeFeederTop);
        if (gridInsert.m_rangeFeederBottom != null)
            gridNew.addLineRange(gridInsert.m_rangeFeederBottom);
        if (gridInsert.m_rangeWinnerFeeder != null)
            gridNew.addLineRange(gridInsert.m_rangeWinnerFeeder);

        // this IBracketGame probably won't get anywhere right now, so setting the top/bottom
        // is probably pointless.  the addGameRange below will capture the swap.
        // FUTURE: When we implement persistent game data (like team names, game times, etc),
        // we *could* persist the swap data at this point, and when they build the game for insert
        // we *could* try to read the swap data during that load.  but that might be overkill
        // it might be better to just let the game insert handle the swap setting
        game.SetSwapTopBottom(gridInsert.m_swapTopBottom);
        gridNew.addGameRange(gridInsert.m_rangeGame, game.GameNum, gridInsert.m_swapTopBottom);

        await this.diffAndApplyChanges(appContext, ctx, grid, gridNew, game.BracketName);
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.diffAndApplyChanges

        Take two grids, diff them, and apply the changes
    ----------------------------------------------------------------------------*/
    static async diffAndApplyChanges(appContext: IAppContext, ctx: any, grid: Grid, gridNew: Grid, bracketName: string)
    {
        // now, diff the grids
        const changes: GridChange[] = grid.diff(gridNew);

        grid.logChanges(changes);

        await this.applyChanges(appContext, ctx, changes, bracketName);
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.executeRemoveChange
    ----------------------------------------------------------------------------*/
    static async executeRemoveChange(appContext: IAppContext, ctx: any, change: GridChange, bracketName: string)
    {
        if (change.IsLine)
        {
            console.log("appc.3");
            // simple, just remove the line formatting
            GameFormatting.removeAllGameFormatting(
                Ranges.rangeFromRangeInfo(ctx.workbook.worksheets.getActiveWorksheet(), change.Range));

            console.log("appc.4");
            await ctx.sync();
            console.log("appc.5");
            return;
        }

        console.log("appc.6");
        // if its a game, then we have to completely remove it, including its
        // named ranges
        let game: IBracketGame = await BracketGame.CreateFromGame(ctx, bracketName, change.GameNumber - 1);

        console.log("appc.7");
        // if we couldn't create the game, or if its not linked to the bracket, then
        // just delete the range
        if (game == null || !game.IsLinkedToBracket)
        {
            console.log("appc.8");
            await this.removeGame(appContext, ctx, null, change.Range, false);
            console.log("appc.9");
        }
        else
        {
            console.log("appc.10");
            await this.removeGame(appContext, ctx, game, change.Range, false);
            console.log("appc.11");
        }
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.executeAddChange
    ----------------------------------------------------------------------------*/
    static async executeAddChange(appContext: IAppContext, ctx: any, change: GridChange, bracketName: string)
    {
        console.log("appc.14");
        if (change.IsLine)
        {
            console.log("appc.14.1");

            // just format the range as an underline
            await GameFormatting.formatConnectingLineRange(
                ctx,
                Ranges.rangeFromRangeInfo(
                    ctx.workbook.worksheets.getActiveWorksheet(),
                    change.Range));

            console.log("appc.14.2");
            return;
        }
        let game: BracketGame = new BracketGame();

        console.log("appc.15");
        await game.Load(ctx, bracketName, change.GameNumber - 1);
        console.log("appc.16");
        if (game.IsLinkedToBracket)
            throw "game can't be linked - we should have already removed it from the bracket";

        game.SetSwapTopBottom(change.SwapTopBottom);
        console.log("appc.17");
        await this.insertGameAtRange(appContext, ctx, game, change.Range);
        console.log("appc.18");
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.applyChanges

        apply the set of GridChanges calculated from a diff of two grids
    ----------------------------------------------------------------------------*/
    static async applyChanges(appContext: IAppContext, ctx: any, changes: GridChange[], bracketName: string)
    {
        console.log("appc.1");

        // do all the removes first
        for (let item of changes)
        {
            console.log("appc.2");
            if (item.ChangeOp == GridChangeOperation.Insert)
                continue;

            await this.executeRemoveChange(appContext, ctx, item, bracketName);
        }

        // and now do all the adds

        console.log("appc.12");
        for (let item of changes)
        {
            console.log("appc.13");
            if (item.ChangeOp == GridChangeOperation.Remove)
                continue;

            await this.executeAddChange(appContext, ctx, item, bracketName);
        }
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.insertGameAtSelection

        this will insert the text and set the global cell names for all the parts
        of the game. 
    ----------------------------------------------------------------------------*/
    static async insertGameAtRange(appContext: IAppContext, ctx: any, game: IBracketGame, insertRangeInfo: RangeInfo)
    {
        // don't automatically remove games anymore in this function -- callers need to
        // take care of that now

        /*
        // first, see if this game is already on the bracket, and if so, delete it
        await game.Bind(ctx);

        if (game.IsLinkedToBracket)
            await this.findAndRemoveGame(appContext, ctx, game);
        */

        if (insertRangeInfo == null)
        {
            appContext.log("Selection is invalid for a game insert");
            return;
        }

        const sheet: Excel.Worksheet = ctx.workbook.worksheets.getActiveWorksheet();
        ctx.trackedObjects.add(sheet);

        const rng: Excel.Range = Ranges.rangeFromRangeInfo(sheet, insertRangeInfo);
        ctx.trackedObjects.add(rng);

        const gameInfoRangeInfo = Grid.getRangeInfoForGameInfo(insertRangeInfo);

        // figure out how big the game will be (width,height)
        let formulas: any[][] = [];

        formulas.push(
            [FormulaBuilder.getTeamNameFormulaFromSource(game.TopTeamName, game.BracketName), ""]);

        // push padding for the underline row AND the number of blank lines 
        this.pushPadding(
            formulas,
            ["", ""],
            gameInfoRangeInfo.FirstRow
            - (insertRangeInfo.FirstRow + 1));

        formulas.push([game.Field, `G${game.GameNum}`]);
        formulas.push(["", ""]);
        formulas.push([OADate.OATimeFromMinutes(game.StartTime), ""]);
        formulas.push(["", ""]);
        formulas.push([game.FormatLoser(), ""]);

        this.pushPadding(formulas, ["", ""], insertRangeInfo.LastRow - gameInfoRangeInfo.LastRow - 1);

        formulas.push(
            [FormulaBuilder.getTeamNameFormulaFromSource(game.BottomTeamName, game.BracketName), ""]);

        rng.load("rowIndex");
        rng.load("columnIndex");
        await ctx.sync();

        let rngTarget: Excel.Range = rng.worksheet.getRangeByIndexes(
            insertRangeInfo.FirstRow,
            insertRangeInfo.FirstColumn,
            insertRangeInfo.RowCount,
            insertRangeInfo.ColumnCount - 1); // we don't want to include the line column

        rngTarget.formulas = formulas;
        ctx.trackedObjects.add(rngTarget);
        await ctx.sync();

        // if there are any existing global names for this game, they will get deleted -- 
        // by now, we are committed to this game going in this spot

        // now we have to format the game and assign global names
        await GameFormatting.formatTeamNameRange(ctx, rng.worksheet.getRangeByIndexes(insertRangeInfo.FirstRow, insertRangeInfo.FirstColumn, 1, 2));
        await Ranges.createOrReplaceNamedRange(ctx, game.TopTeamCellName, rng.worksheet.getRangeByIndexes(insertRangeInfo.FirstRow, insertRangeInfo.FirstColumn, 1, 1));

        await GameFormatting.formatTeamNameRange(ctx, rng.worksheet.getRangeByIndexes(insertRangeInfo.LastRow, insertRangeInfo.FirstColumn, 1, 2));
        await Ranges.createOrReplaceNamedRange(ctx, game.BottomTeamCellName, rng.worksheet.getRangeByIndexes(insertRangeInfo.LastRow, insertRangeInfo.FirstColumn, 1, 1));

        await GameFormatting.formatGameInfoBodyText(ctx, rng.worksheet.getRangeByIndexes(gameInfoRangeInfo.FirstRow, insertRangeInfo.FirstColumn, 1, 1));
        await GameFormatting.formatGameInfoTimeText(ctx, rng.worksheet.getRangeByIndexes(gameInfoRangeInfo.FirstRow + 2, insertRangeInfo.FirstColumn, 1, 1));
        await GameFormatting.formatGameInfoAdvanceToText(ctx, rng.worksheet.getRangeByIndexes(gameInfoRangeInfo.FirstRow + 4, insertRangeInfo.FirstColumn, 1, 1));

        await GameFormatting.formatConnectingLineRange(ctx, rng.worksheet.getRangeByIndexes(insertRangeInfo.FirstRow + 1, insertRangeInfo.FirstColumn, 1, 3));
        await GameFormatting.formatConnectingLineRange(ctx, rng.worksheet.getRangeByIndexes(insertRangeInfo.FirstRow + insertRangeInfo.RowCount - 2, insertRangeInfo.FirstColumn, 1, 3));
        await GameFormatting.formatConnectingLineRange(ctx, rng.worksheet.getRangeByIndexes(insertRangeInfo.FirstRow + 1, insertRangeInfo.FirstColumn + 2, insertRangeInfo.RowCount - 2, 1));

        ctx.trackedObjects.remove(rngTarget);
        rngTarget = rng.worksheet.getRangeByIndexes(gameInfoRangeInfo.FirstRow, gameInfoRangeInfo.FirstColumn + 1, 3, 1)
        ctx.trackedObjects.add(rngTarget);

        await GameFormatting.formatGameInfoGameNumber(ctx, rngTarget);
        await Ranges.createOrReplaceNamedRange(ctx, game.GameNumberCellName, rngTarget);

        // at this point, the game is insert and the names are assigned. we can bind the game object to the sheet
        await game.Bind(ctx);
        ctx.trackedObjects.remove(rngTarget);
        ctx.trackedObjects.remove(rng);
        ctx.trackedObjects.remove(sheet);
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.obliterateGameRangeFromSheet

        remove all traces of this game, including any lines extending into and
        out of it.

        The provided range has to include the top and bottom team names, the
        score column, and the line column. (most times this will be provided
        via getRangeInfoForGame)

        this does NOT take care of pushing data back to the bracket sources.
        this is the last step in deleting a game from the sheet.

        UNDONE: if there are any named ranges, they will be removed as well
        (there doesn't appear to be an API for this in javascript, so we will
        rely on the caller to cleanup the names)
    ----------------------------------------------------------------------------*/
    static async obliterateGameRangeFromSheet(ctx: any, appContext: IAppContext, rangeInfo: RangeInfo, removeConnections: boolean)
    {
        appContext;
        let sheet: Excel.Worksheet = ctx.workbook.worksheets.getActiveWorksheet();
        ctx.trackedObjects.add(sheet);

        if (removeConnections)
        {
            // now go looking for connecting lines
            let feederLine: RangeInfo;

            feederLine = await GameLines.getFeedingLineRangeInfo(ctx, sheet, new RangeInfo(rangeInfo.FirstRow + 1, 1, rangeInfo.FirstColumn, 1));
            GameFormatting.removeAllGameFormatting(Ranges.rangeFromRangeInfo(sheet, feederLine));

            feederLine = await GameLines.getFeedingLineRangeInfo(ctx, sheet, new RangeInfo(rangeInfo.LastRow - 1, 1, rangeInfo.FirstColumn, 1));
            GameFormatting.removeAllGameFormatting(Ranges.rangeFromRangeInfo(sheet, feederLine));
        }

        let range: Excel.Range = Ranges.rangeFromRangeInfo(sheet, rangeInfo);
        ctx.trackedObjects.add(range);
        GameFormatting.removeAllGameFormatting(range);

//        await this.removeAllGameFormatting(ctx, range);
        range.load("rowIndex");
        range.load("columnIndex");

        // and now look for merged regions so we can find the outgoing line
        let areas: Excel.RangeAreas = range.getMergedAreasOrNullObject();

        await ctx.sync();

        if (!areas.isNullObject)
        {
            let mergedRange: Excel.Range = areas.areas.getItemAt(0);
            ctx.trackedObjects.add(mergedRange);

            GameFormatting.removeAllGameFormatting(mergedRange);

            mergedRange.load("address");
            mergedRange.load("rowIndex");
            mergedRange.load("columnIndex");

            await ctx.sync();
            if (removeConnections)
            {
                // the middle row is the outgoing row
                let rangeLine: Excel.Range =
                    sheet.getRangeByIndexes(mergedRange.rowIndex + 1, mergedRange.columnIndex + 1, 1, 1);

                rangeLine.load("rowIndex");
                rangeLine.load("columnIndex");

                if (await GameFormatting.isCellInLineColumn(ctx, rangeLine))
                {
                    let feederLine: RangeInfo = await GameLines.getOutgoingLineRange(ctx,
                        sheet,
                        new RangeInfo(rangeLine.rowIndex, 1, rangeLine.columnIndex, 1));

                    GameFormatting.removeAllGameFormatting(Ranges.rangeFromRangeInfo(sheet, feederLine));
                }
            }

            mergedRange.unmerge();
            await ctx.sync();

            ctx.trackedObjects.remove(range);
            ctx.trackedObjects.remove(mergedRange);
            ctx.trackedObjects.remove(sheet);
        }
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.removeGame

        Remove the given bracket game from the sheet.
        If only the rangeinfo is provided, then use that as the range to remove.
        If both are provided, they must be consistent.
    ----------------------------------------------------------------------------*/
    static async removeGame(appContext: IAppContext, ctx: any, game: IBracketGame, range: RangeInfo, removeConnections: boolean)
    {
        console.log("remgm.1");

        if (range != null && game != null && game.IsLinkedToBracket)
        {
            console.log("remgm.2");
            if (!range.isEqual(game.FullGameRange))
                throw "remove game: bound game range != given range";
            console.log("remgm.3");
        }

        console.log("remgm.4");
        await this.obliterateGameRangeFromSheet(ctx, appContext, range == null ? game.FullGameRange : range, removeConnections);

        console.log("remgm.5");
        if (game != null && game.IsLinkedToBracket)
        {
            // obliterate can't deal with the named ranges (there's no way to map
            // range back to named item), but we know the names, so we can delete them
            console.log("remgm.6");
            await Ranges.ensureGlobalNameDeleted(ctx, game.TopTeamCellName);
            console.log("remgm.7");
            await Ranges.ensureGlobalNameDeleted(ctx, game.BottomTeamCellName);
            console.log("remgm.8");
            await Ranges.ensureGlobalNameDeleted(ctx, game.GameNumberCellName);
            console.log("remgm.9");
        }
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.findAndRemoveGame

        If there is a selected range, and that range doesn't overlap any known
        bracket games, then we will assume the user is trying to unformat a game
        that is corrupted (missing name definitions). Remove all the game
        formatting in the range

        If there is no selected range, then find the given game and remove it.

    ----------------------------------------------------------------------------*/
    static async findAndRemoveGame(appContext: IAppContext, ctx: any, game: IBracketGame)
    {
        const rangeSelected: RangeInfo = await Ranges.createRangeInfoForSelection(ctx);

        await game.Bind(ctx);

        // if we can't bind to the game, and if the selection is a single cell, then
        // we can't do anything
        if (!game.IsLinkedToBracket && rangeSelected.RowCount <= 1 && rangeSelected.ColumnCount <= 1)
        {
            appContext.log(`Cannot find game ${game.GameNum} in the bracket`);
            return;
        }

        // load the grid
        let grid: Grid = await Grid.createGridFromBracket(ctx, game.BracketName);

        // first, see if the selected range overlaps any known games
        if (!rangeSelected.IsSingleCell)
        {
            if (grid.doesRangeOverlap(rangeSelected) == RangeOverlapKind.None)
            {
                this.removeGame(appContext, ctx, null, rangeSelected, true);
                return;
            }
        }

        // find the given game in the grid
        let items: GridItem[] = grid.getAllGameItems(game.GameNum);

        if (items.length > 0)
        {
            let gridNew: Grid = grid.clone();

            gridNew.removeItems(items);
            await this.diffAndApplyChanges(appContext, ctx, grid, gridNew, game.BracketName);
            return;
        }

        // we're linked to a game, so we can go straight to it and obliterate it
//        await this.removeGame(appContext, ctx, game, rangeSelected);

//        await game.Bind(ctx);
    }

    static async testGridClick(appContext: IAppContext)
    {
        appContext;
        await Excel.run(async (context) =>
        {
            let grid: Grid = await this.gridBuildFromBracket(context);

            grid.logGrid();
        });
    }
}