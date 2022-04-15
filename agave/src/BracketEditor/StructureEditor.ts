
import { IBracketGame } from "./BracketGame";
import { BracketDefinition } from "../Brackets/BracketDefinitions";
import { FormulaBuilder } from "./FormulaBuilder";
import { IAppContext} from "../AppContext";
import { RangeInfo, Ranges } from "../Interop/Ranges";
import { OADate } from "../Interop/Dates";

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
        %%Function: StructureEditor.formatTeamNameRange
    ----------------------------------------------------------------------------*/
    static async formatTeamNameRange(ctx: any, teamNameRange: Excel.Range)
    {
        teamNameRange.format.font.name = "Arial Black";
        teamNameRange.format.font.size = 9;
        teamNameRange.format.horizontalAlignment = Excel.HorizontalAlignment.center;
        teamNameRange.format.verticalAlignment = Excel.VerticalAlignment.center;

        await ctx.sync();
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.formatConnectingLineRange
    ----------------------------------------------------------------------------*/
    static async formatConnectingLineRange(ctx: any, lineRange: Excel.Range)
    {
        lineRange.format.fill.color = "black";
        
        await ctx.sync();
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.formatGameInfoBodyText
    ----------------------------------------------------------------------------*/
    static async formatGameInfoBodyText(ctx: any, range: Excel.Range)
    {
        range.format.font.name = "Calibri";
        range.format.font.size = 9;
        range.format.horizontalAlignment = Excel.HorizontalAlignment.center;
        range.format.verticalAlignment = Excel.VerticalAlignment.top;

        await ctx.sync();
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.formatGameInfoTimeText
    ----------------------------------------------------------------------------*/
    static async formatGameInfoTimeText(ctx: any, range: Excel.Range)
    {
        range.format.font.name = "Calibri";
        range.format.font.size = 9;
        range.format.horizontalAlignment = Excel.HorizontalAlignment.center;
        range.format.verticalAlignment = Excel.VerticalAlignment.bottom;
        range.numberFormat = [["h:mm AM/PM"]];

        await ctx.sync();
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.formatGameInfoAdvanceToText
    ----------------------------------------------------------------------------*/
    static async formatGameInfoAdvanceToText(ctx: any, range: Excel.Range)
    {
        range.format.font.name = "Calibri";
        range.format.font.size = 6;
        range.format.horizontalAlignment = Excel.HorizontalAlignment.center;
        range.format.verticalAlignment = Excel.VerticalAlignment.top;

        await ctx.sync();
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.formatGameInfoGameNumber
    ----------------------------------------------------------------------------*/
    static async formatGameInfoGameNumber(ctx: any, range: Excel.Range)
    {
        range.format.font.name = "Calibri";
        range.format.font.size = 8;
        range.format.font.bold = true;
        range.format.horizontalAlignment = Excel.HorizontalAlignment.right;
        range.format.verticalAlignment = Excel.VerticalAlignment.center;
        range.merge(false);

        await ctx.sync();
    }


    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.formatRangeNormal
    ----------------------------------------------------------------------------*/
    static async formatRangeNormal(ctx: any, range: Excel.Range)
    {
        range.format.fill.clear();
        range.format.font.name = "Calibri";
        range.format.font.size = 11;
        range.format.horizontalAlignment = Excel.HorizontalAlignment.left;
        range.format.verticalAlignment = Excel.VerticalAlignment.top;

        await ctx.sync();
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.isCellInLineRow
    ----------------------------------------------------------------------------*/
    static async isCellInLineRow(ctx: any, range: Excel.Range): Promise<boolean>
    {
        range.load("height");
        range.load("address");
        await ctx.sync();

        return range.height < 1;
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.isCellInLineColumn
    ----------------------------------------------------------------------------*/
    static async isCellInLineColumn(ctx: any, range: Excel.Range): Promise<boolean>
    {
        range.load("width");
        await ctx.sync();

        return range.width < 5;
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.isCellInGameTitleColumn
    ----------------------------------------------------------------------------*/
    static async isCellInGameTitleColumn(ctx: any, range: Excel.Range): Promise<boolean>
    {
        range.load("width");
        await ctx.sync();

        return range.width > 20;
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.isCellInGameScoreColumn
    ----------------------------------------------------------------------------*/
    static async isCellInGameScoreColumn(ctx: any, range: Excel.Range): Promise<boolean>
    {
        range.load("width");
        await ctx.sync();

        return range.width <= 20;
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.isRangeValidForAnyGame
    ----------------------------------------------------------------------------*/
    static async isRangeValidForAnyGame(ctx: any, range: Excel.Range): Promise<boolean>
    {
        return await StructureEditor.isCellInGameTitleColumn(ctx, range)
            && await StructureEditor.isCellInGameScoreColumn(ctx, range.getOffsetRange(0, 1))
            && await StructureEditor.isCellInLineColumn(ctx, range.getOffsetRange(0, 2));
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.isRangeValidForTopOrBottomGame
    ----------------------------------------------------------------------------*/
    static async isRangeValidForTopOrBottomGame(ctx: any, range: Excel.Range): Promise<boolean>
    {
        range.load("address");
        await ctx.sync();

        if (!await StructureEditor.isCellInLineRow(ctx, range.getOffsetRange(-1, 0)) ||
            !await StructureEditor.isCellInLineRow(ctx, range.getOffsetRange(1, 0)))
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
            return new RangeInfo(range.rowIndex, rowCount, range.columnIndex, 2);
        }

        return null
    }

    static getRangeInfoForGameInfo(rangeInfo: RangeInfo): RangeInfo
    {
        if (rangeInfo.RowCount < 9)
            throw new Error("bad rangeInfo param");

        // this is the total number of full height rows to fill information into
        const bodyRowCount: number = Math.floor((rangeInfo.RowCount - 3 - 1) / 2 + 0.5);

        // this is the offset to the first row of body text, in full height rows.
        // We need 3 full height rows for our data, so the remaining is divided between the two
        const bodyTopText: number = Math.floor((bodyRowCount - 3) / 2 + 0.5);

        // now we have to convert this offset to full height rows into actual row offsets
        // and calculate the offset from the start of the game info region (which will
        // always start at least after the game title and the underline row)
        return new RangeInfo(rangeInfo.FirstRow + 2 + bodyTopText * 2, 5, rangeInfo.FirstColumn, rangeInfo.ColumnCount);
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
        %%Function: StructureEditor.insertGameAtSelection

        this will insert the text and set the global cell names for all the parts
        of the game. 
    ----------------------------------------------------------------------------*/
    static async insertGameAtSelection(appContext: IAppContext, ctx: any, game: IBracketGame)
    {
        const rng: Excel.Range = ctx.workbook.getSelectedRange();

        const insertRangeInfo = await StructureEditor.getValidRangeInfoForGameInsert(ctx, rng);

        if (insertRangeInfo == null)
        {
            appContext.log("Selection is invalid for a game insert");
            return;
        }

        const gameInfoRangeInfo = this.getRangeInfoForGameInfo(insertRangeInfo);

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
            insertRangeInfo.ColumnCount);

        await ctx.sync();

        rngTarget.formulas = formulas;
        await ctx.sync();

        // if there are any existing global names for this game, they will get deleted -- 
        // by now, we are committed to this game going in this spot

        // now we have to format the game and assign global names
        await this.formatTeamNameRange(ctx, rng.worksheet.getRangeByIndexes(insertRangeInfo.FirstRow, insertRangeInfo.FirstColumn, 1, 2));
        await Ranges.createOrReplaceNamedRange(ctx, game.TopTeamCellName, rng.worksheet.getRangeByIndexes(insertRangeInfo.FirstRow, insertRangeInfo.FirstColumn, 1, 1));

        await this.formatTeamNameRange(ctx, rng.worksheet.getRangeByIndexes(insertRangeInfo.LastRow, insertRangeInfo.FirstColumn, 1, 2));
        await Ranges.createOrReplaceNamedRange(ctx, game.BottomTeamCellName, rng.worksheet.getRangeByIndexes(insertRangeInfo.LastRow, insertRangeInfo.FirstColumn, 1, 1));

        await this.formatGameInfoBodyText(ctx, rng.worksheet.getRangeByIndexes(gameInfoRangeInfo.FirstRow, insertRangeInfo.FirstColumn, 1, 1));
        await this.formatGameInfoTimeText(ctx, rng.worksheet.getRangeByIndexes(gameInfoRangeInfo.FirstRow + 2, insertRangeInfo.FirstColumn, 1, 1));
        await this.formatGameInfoAdvanceToText(ctx, rng.worksheet.getRangeByIndexes(gameInfoRangeInfo.FirstRow + 4, insertRangeInfo.FirstColumn, 1, 1));

        await this.formatConnectingLineRange(ctx, rng.worksheet.getRangeByIndexes(insertRangeInfo.FirstRow + 1, insertRangeInfo.FirstColumn, 1, 3));
        await this.formatConnectingLineRange(ctx, rng.worksheet.getRangeByIndexes(insertRangeInfo.FirstRow + insertRangeInfo.RowCount - 2, insertRangeInfo.FirstColumn, 1, 3));
        await this.formatConnectingLineRange(ctx, rng.worksheet.getRangeByIndexes(insertRangeInfo.FirstRow + 1, insertRangeInfo.FirstColumn + 2, insertRangeInfo.RowCount - 2, 1));

        await this.formatGameInfoGameNumber(ctx, rngTarget = rng.worksheet.getRangeByIndexes(gameInfoRangeInfo.FirstRow, gameInfoRangeInfo.FirstColumn + 1, 3, 1));
        await Ranges.createOrReplaceNamedRange(ctx, game.GameNumberCellName, rngTarget);

        // at this point, the game is insert and the names are assigned. we can bind the game object to the sheet
        await game.Bind(ctx);
    }
}