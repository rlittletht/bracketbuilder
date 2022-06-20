import { IAppContext, IAppContext as IAppContext1, IAppContext as IAppContext2 } from "../../AppContext";
import { IBracketGame } from "../BracketGame";
import { RangeInfo, Ranges } from "../../Interop/Ranges";
import { FormulaBuilder } from "../FormulaBuilder";
import { GameFormatting } from "../GameFormatting";
import { Grid } from "../Grid";
import { StructureRemove } from "./StructureRemove";
import { ApplyGridChange } from "./ApplyGridChange";
import { _undoManager } from "../Undo";
import { StructureEditor } from "./StructureEditor";

export class StructureInsert
{
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

    static async insertChampionshipGameAtRange(appContext: IAppContext, ctx: any, game: IBracketGame, insertRangeInfo: RangeInfo)
    {
        if (insertRangeInfo == null)
        {
            appContext.log("Selection is invalid for a game insert");
            return;
        }

        const sheet: Excel.Worksheet = ctx.workbook.worksheets.getActiveWorksheet();
        ctx.trackedObjects.add(sheet);

        const rng: Excel.Range = Ranges.rangeFromRangeInfo(sheet, insertRangeInfo);
        ctx.trackedObjects.add(rng);

        // figure out how big the game will be (width,height)
        let formulas: any[][] = [];

        formulas.push(
            [FormulaBuilder.getTeamNameFormulaFromSource(game.TopTeamName, game.BracketName), ""]);
        formulas.push(["", ""]);
        formulas.push(["Champion", ""]);

        let rngTarget: Excel.Range = rng.worksheet.getRangeByIndexes(
            insertRangeInfo.FirstRow,
            insertRangeInfo.FirstColumn,
            insertRangeInfo.RowCount,
            insertRangeInfo.ColumnCount - 1); // we don't want to include the line column

        rngTarget.formulas = formulas;
        ctx.trackedObjects.add(rngTarget);

        // if there are any existing global names for this game, they will get deleted -- 
        // by now, we are committed to this game going in this spot

        // now we have to format the game and assign global names
        GameFormatting.formatTeamNameRangeRequest(rng.worksheet.getRangeByIndexes(insertRangeInfo.FirstRow, insertRangeInfo.FirstColumn, 1, 2));
        await Ranges.createOrReplaceNamedRange(ctx, game.TopTeamCellName, rng.worksheet.getRangeByIndexes(insertRangeInfo.FirstRow, insertRangeInfo.FirstColumn, 1, 1));

        GameFormatting.formatGameInfoBodyTextRequest(rng.worksheet.getRangeByIndexes(insertRangeInfo.LastRow, insertRangeInfo.FirstColumn, 1, 2));

        GameFormatting.formatConnectingLineRangeRequest(rng.worksheet.getRangeByIndexes(insertRangeInfo.FirstRow + 1, insertRangeInfo.FirstColumn, 1, 1));

        ctx.trackedObjects.remove(rngTarget);

        // at this point, the game is insert and the names are assigned. we can bind the game object to the sheet
        await game.Bind(ctx);
        ctx.trackedObjects.remove(rngTarget);
        ctx.trackedObjects.remove(rng);
        ctx.trackedObjects.remove(sheet);
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureInsert.setAndFormatGameInfo

        set the text for the game info, and format the ranges
    ----------------------------------------------------------------------------*/
    static setAndFormatGameInfo(
        sheet: Excel.Worksheet,
        gameInfoRange: RangeInfo,
        gameInfoRangeInfo: RangeInfo,
        game: IBracketGame,
        connectedTop: boolean,
        connectedBottom: boolean)
    {
        let formulas: any[][] = [];
        let topString: string = game.FormatLoser();
        let bottomString: string = "";

        if (topString == "" && !connectedTop)
        {
            topString = game.TopSource;
            if (topString != "" && topString[0] != 'L')
                topString = "";
        }

        if (!connectedBottom)
        {
            bottomString = game.BottomSource;
            if (bottomString != "" && bottomString[0] != 'L')
                bottomString = "";
        }

        const fCompressGame = gameInfoRangeInfo.FirstRow - gameInfoRange.FirstRow - 1 < 0;

        // we have to compress the game by losing the top row
        if (!fCompressGame)
        {
            formulas.push([topString]);
            this.pushPadding(
                formulas,
                [""],
                gameInfoRangeInfo.FirstRow - gameInfoRange.FirstRow - 1);
        }

        formulas.push(
            [
                FormulaBuilder.getFieldFormulaFromGameNumber(game.GameNum)
            ]);
        formulas.push([""]);
        formulas.push([FormulaBuilder.getTimeFormulaFromGameId(game.GameId)]);

        this.pushPadding(formulas, [""], gameInfoRange.LastRow - gameInfoRangeInfo.LastRow);
        formulas.push([""]);
        formulas.push([bottomString]);

        const rng: Excel.Range = Ranges.rangeFromRangeInfo(sheet, gameInfoRange);
        rng.formulas = formulas;

        GameFormatting.formatGameInfoBodyTextRequest(Ranges.rangeFromRangeInfo(sheet, gameInfoRangeInfo.offset(0, 1, 0, 1)));
        GameFormatting.formatGameInfoTimeTextRequest(Ranges.rangeFromRangeInfo(sheet, gameInfoRangeInfo.offset(2, 1, 0, 1)));
        if (!fCompressGame)
            GameFormatting.formatGameInfoAdvanceToTextRequest(Ranges.rangeFromRangeInfo(sheet, gameInfoRange.offset(0, 1, 0, 1)), Excel.VerticalAlignment.top);

        GameFormatting.formatGameInfoAdvanceToTextRequest(Ranges.rangeFromRangeInfo(sheet, gameInfoRange.bottomLeft().offset(0, 1, 0, 1)), Excel.VerticalAlignment.bottom);

        return;
    }


    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.insertGameAtSelection

        this will insert the text and set the global cell names for all the parts
        of the game. 
    ----------------------------------------------------------------------------*/
    static async insertGameAtRange(
        appContext: IAppContext1,
        ctx: any,
        game: IBracketGame,
        insertRangeInfo: RangeInfo,
        connectedTop: boolean,
        connectedBottom: boolean)
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

        formulas.push([FormulaBuilder.getFieldFormulaFromGameNumber(game.GameNum), `G${game.GameId.Value}`]);
        // we will fill in the game info text later. for now just push space

        this.pushPadding(formulas, ["", ""], 4 + insertRangeInfo.LastRow - gameInfoRangeInfo.LastRow - 1);

        formulas.push(
            [FormulaBuilder.getTeamNameFormulaFromSource(game.BottomTeamName, game.BracketName), ""]);

        let rngTarget: Excel.Range = rng.worksheet.getRangeByIndexes(
            insertRangeInfo.FirstRow,
            insertRangeInfo.FirstColumn,
            insertRangeInfo.RowCount,
            insertRangeInfo.ColumnCount - 1); // we don't want to include the line column

        rngTarget.formulas = formulas;
        this.setAndFormatGameInfo(
            rng.worksheet,
            new RangeInfo(insertRangeInfo.FirstRow + 2, insertRangeInfo.RowCount - 4, insertRangeInfo.FirstColumn, 1),
            gameInfoRangeInfo,
            game,
            connectedTop,
            connectedBottom);

        ctx.trackedObjects.add(rngTarget);

        // if there are any existing global names for this game, they will get deleted -- 
        // by now, we are committed to this game going in this spot

        // now we have to format the game and assign global names
        GameFormatting.formatTeamNameRangeRequest(rng.worksheet.getRangeByIndexes(insertRangeInfo.FirstRow, insertRangeInfo.FirstColumn, 1, 2));
        await Ranges.createOrReplaceNamedRange(ctx, game.TopTeamCellName, rng.worksheet.getRangeByIndexes(insertRangeInfo.FirstRow, insertRangeInfo.FirstColumn, 1, 1));

        GameFormatting.formatTeamNameRangeRequest(rng.worksheet.getRangeByIndexes(insertRangeInfo.LastRow, insertRangeInfo.FirstColumn, 1, 2));
        await Ranges.createOrReplaceNamedRange(ctx, game.BottomTeamCellName, rng.worksheet.getRangeByIndexes(insertRangeInfo.LastRow, insertRangeInfo.FirstColumn, 1, 1));

        GameFormatting.formatConnectingLineRangeRequest(rng.worksheet.getRangeByIndexes(insertRangeInfo.FirstRow + 1, insertRangeInfo.FirstColumn, 1, 3));
        GameFormatting.formatConnectingLineRangeRequest(rng.worksheet.getRangeByIndexes(insertRangeInfo.FirstRow + insertRangeInfo.RowCount - 2, insertRangeInfo.FirstColumn, 1, 3));
        GameFormatting.formatConnectingLineRangeRequest(rng.worksheet.getRangeByIndexes(insertRangeInfo.FirstRow + 1, insertRangeInfo.FirstColumn + 2, insertRangeInfo.RowCount - 2, 1));

        ctx.trackedObjects.remove(rngTarget);
        rngTarget = rng.worksheet.getRangeByIndexes(gameInfoRangeInfo.FirstRow, gameInfoRangeInfo.FirstColumn + 1, 3, 1)
        ctx.trackedObjects.add(rngTarget);

        GameFormatting.formatGameInfoGameNumberRequest(rngTarget);
        await Ranges.createOrReplaceNamedRange(ctx, game.GameNumberCellName, rngTarget);

        // at this point, the game is insert and the names are assigned. we can bind the game object to the sheet
        await game.Bind(ctx);
        ctx.trackedObjects.remove(rngTarget);
        ctx.trackedObjects.remove(rng);
        ctx.trackedObjects.remove(sheet);
    }


    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.insertGameAtSelection
    ----------------------------------------------------------------------------*/
    static async insertGameAtSelection(appContext: IAppContext2, ctx: any, game: IBracketGame)
    {
        game.Unbind();

        // first, see if this game is already on the bracket, and if so, delete it
        await game.Bind(ctx);

        if (game.IsLinkedToBracket)
            await StructureRemove.findAndRemoveGame(appContext, ctx, game, game.BracketName);

        // first make sure we have a complete grid for the bracket
        let grid: Grid = await StructureEditor.gridBuildFromBracket(ctx);

        // now let's figure out where we want to insert the game
        let requested: RangeInfo = await Ranges.createRangeInfoForSelection(ctx);

        if (requested.FirstColumn < grid.FirstGridPattern.FirstColumn)
        {
            appContext.log(`Can't insert game. Please select a cell in a Team Name column in the bracket grid -- column "${Ranges.getColName(grid.FirstGridPattern.FirstColumn)}" or greater)`);
            return;
        }

        if ((requested.FirstColumn - grid.FirstGridPattern.FirstColumn) % 3 != 0)
        {
            const validColumns: string =
                `${Ranges.getColName(grid.FirstGridPattern.FirstColumn)}, `
                    + `${Ranges.getColName(grid.FirstGridPattern.FirstColumn + 3)}, `
                    + `${Ranges.getColName(grid.FirstGridPattern.FirstColumn + 6)}, `
                    + `${Ranges.getColName(grid.FirstGridPattern.FirstColumn + 9)}, `
                    + `${Ranges.getColName(grid.FirstGridPattern.FirstColumn + 12)}, `
                    + `${Ranges.getColName(grid.FirstGridPattern.FirstColumn + 15)}, `
                    + `${Ranges.getColName(grid.FirstGridPattern.FirstColumn + 18)}, `
                    + `${Ranges.getColName(grid.FirstGridPattern.FirstColumn + 21)}, `
                    + `${Ranges.getColName(grid.FirstGridPattern.FirstColumn + 24)}, `
                    + `${Ranges.getColName(grid.FirstGridPattern.FirstColumn + 27)}`;

            appContext.log(`Can't insert game. Please select a cell in a Team Name column, not a score column or a line column. Valid columns include (${validColumns})`);
            return;
        }

        let gridNew: Grid = null;
        let failReason: string = null;

        [gridNew, failReason] = grid.buildNewGridForGameAdd(game, requested);

        if (failReason != null)
        {
            appContext.log(`failed: ${failReason}`);
            return;
        }

        _undoManager.setUndoGrid(grid);
        await ApplyGridChange.diffAndApplyChanges(appContext, ctx, grid, gridNew, game.BracketName);
    }
}