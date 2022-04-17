
import { IBracketGame, BracketGame } from "./BracketGame";
import { BracketDefinition, GameDefinition } from "../Brackets/BracketDefinitions";
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
        %%Function: StructureEditor.findAndRemoveGameClick

        find the given game in the bracket grid and remove it.
    ----------------------------------------------------------------------------*/
    static async findAndRemoveGameClick(appContext: IAppContext, game: IBracketGame)
    {
        await Excel.run(async (context) =>
            { StructureEditor.findAndRemoveGame(appContext, context, game) } );
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
        %%Function: StructureEditor.findMatchingGameConnections

        find the matching game connections:
        [topSource, bottomSource, winnerTarget]

        These can be used to determine adjustments to a games placement (or even
        an "i'm feeling lucky" placement), as well as whether home/away needs to
        be swapped.

        These ranges, if not null, represent the first cell that should be
        included in the connection line (or it might be the underline portion of
        the next game)
    ----------------------------------------------------------------------------*/
    static async findMatchingGameConnections(ctx: any, game: IBracketGame): Promise<[RangeInfo, RangeInfo, RangeInfo]>
    {
        let topSource: RangeInfo = null;
        let bottomSource: RangeInfo = null;
        let winnerTarget: RangeInfo = null;

        const top: string = game.BracketGameDefinition.topSource;

        if (!BracketGame.IsTeamSourceStatic(top))
        {
            let gameSource: BracketGame = new BracketGame();

            await gameSource.Load(ctx, game.BracketName, Number(top.substring(1)));
            topSource = new RangeInfo(gameSource.GameNumberRange.FirstRow + 1, 1, gameSource.GameNumberRange.FirstColumn + 2, 1);
        }

        const bottom: string = game.BracketGameDefinition.bottomSource;
        if (!BracketGame.IsTeamSourceStatic(bottom))
        {
            let gameSource: BracketGame = new BracketGame();

            await gameSource.Load(ctx, game.BracketName, Number(bottom.substring(1)));
            topSource = new RangeInfo(gameSource.GameNumberRange.FirstRow + 1, 1, gameSource.GameNumberRange.FirstColumn + 2, 1);
        }

        const winner: string = game.BracketGameDefinition.winner;
        if (winner != "")
        {
            let gameSource: BracketGame = new BracketGame();

            await gameSource.Load(ctx, game.BracketName, Number(winner.substring(1)));
            if (winner.substring(0) === "T")
            {
                winnerTarget = new RangeInfo(gameSource.TopTeamRange.FirstRow + 1, 1, gameSource.TopTeamRange.FirstColumn - 1, 1);
            }
            else
            {
                winnerTarget = new RangeInfo(gameSource.BottomTeamRange.FirstRow - 1, 1, gameSource.BottomTeamRange.FirstColumn - 1, 1);
            }
        }

        return [topSource, bottomSource, winnerTarget];
    }
    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.insertGameAtSelection

        this will insert the text and set the global cell names for all the parts
        of the game. 
    ----------------------------------------------------------------------------*/
    static async insertGameAtSelection(appContext: IAppContext, ctx: any, game: IBracketGame)
    {
        // first, see if this game is already on the bracket, and if so, delete it
        await game.Bind(ctx);

        if (game.IsLinkedToBracket)
            await this.findAndRemoveGame(appContext, ctx, game);

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


    static removeAllGameFormatting(ctx: any, range: Excel.Range)
    {
        ctx;
        if (range == null)
            return;

        range.clear();
        //range.format.font.name = "Calibri";
        //range.format.font.size = 11;
        //range.format.font.bold = false;
        //range.format.horizontalAlignment = Excel.HorizontalAlignment.left;
        //range.format.verticalAlignment = Excel.VerticalAlignment.top;
        //range.format.fill.clear();
        //await ctx.sync();
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.getFeedingLineRangeInfo

        Given a range for the line on a game (under the top team or over the
        bottom team), return a range for any feeding line

        return null if there is no feeder line
    ----------------------------------------------------------------------------*/
    static async getFeedingLineRangeInfo(
        ctx: any,
        sheet: Excel.Worksheet,
        rangeGameLine: RangeInfo): Promise<RangeInfo>
    {
        let range: Excel.Range;
        let curColumn: number = rangeGameLine.FirstColumn - 1;
        let outColumn: number = -1;

        while (curColumn > 0)
        {
            range = sheet.getRangeByIndexes(rangeGameLine.FirstRow, curColumn, 1, 1);
            range.format.load("fill");
            range.load("width");
            await ctx.sync();

            if (range.format.fill.color !== "black")
                break;

            // we don't want to include this cell quite yet -- only if the
            // next cell beyond is also filled...
            if (!(await this.isCellInLineColumn(ctx, range)))
            {
                outColumn = curColumn;
            }

            curColumn--;
        }

        if (outColumn == -1)
            return null;

        return new RangeInfo(rangeGameLine.FirstRow, 1, outColumn, rangeGameLine.FirstColumn - outColumn);
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.getOutgoingLineRange

        Build a rangeInfo for the outgoing line for the given rangeInfo that
        represents the verticalLine cell on the outgoing line.

        The returned range will not include the underline underneath (or over)
        the team name. So, we will only consider a cell that is NOT followed by
        only 3 filled cells (must have more that 4 filled cells).

        this means that if the outgoing line does not actually join with a game,
        then 3 filled cells will be left around
    ----------------------------------------------------------------------------*/
    static async getOutgoingLineRange(
        ctx: any,
        sheet: Excel.Worksheet,
        rangeGameLine: RangeInfo): Promise<RangeInfo>
    {
        let range: Excel.Range;
        let curColumn: number = rangeGameLine.FirstColumn + 1;
        let outColumn: number = -1;

        let fLastWasLineColumn: boolean = true;

        while (curColumn < 10000) // just an arbitrarily large number
        {
            range = sheet.getRangeByIndexes(rangeGameLine.FirstRow, curColumn, 1, 1);
            range.format.load("fill");
            await ctx.sync();

            if (range.format.fill.color !== "black")
                break;

            if (fLastWasLineColumn)
            {
                // everything up to and including the line column is part of the outgoing
                // line range
                outColumn = curColumn;
            }

            if ((await this.isCellInLineColumn(ctx, range)))
                fLastWasLineColumn = true;

            curColumn++;
        }

        if (outColumn == -1 || outColumn <= rangeGameLine.FirstColumn + 1)
            return null;

        return new RangeInfo(rangeGameLine.FirstRow, 1, outColumn, outColumn - rangeGameLine.FirstColumn + 1);
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.obliterateGameFromSheet

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
    static async obliterateGameFromSheet(ctx: any, appContext: IAppContext, rangeInfo: RangeInfo)
    {
        appContext;
        let sheet: Excel.Worksheet = ctx.workbook.worksheets.getActiveWorksheet();
        ctx.trackedObjects.add(sheet);

        // now go looking for connecting lines
        let feederLine: RangeInfo;

        feederLine = await this.getFeedingLineRangeInfo(ctx, sheet, new RangeInfo(rangeInfo.FirstRow + 1, 1, rangeInfo.FirstColumn, 1));
        await this.removeAllGameFormatting(ctx, Ranges.rangeFromRangeInfo(sheet, feederLine));

        feederLine = await this.getFeedingLineRangeInfo(ctx, sheet, new RangeInfo(rangeInfo.LastRow - 1, 1, rangeInfo.FirstColumn, 1));
        await this.removeAllGameFormatting(ctx, Ranges.rangeFromRangeInfo(sheet, feederLine));

        let range: Excel.Range = Ranges.rangeFromRangeInfo(sheet, rangeInfo);
        ctx.trackedObjects.add(range);
        range.clear();

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

            await this.removeAllGameFormatting(ctx, mergedRange);

            mergedRange.load("address");
            mergedRange.load("rowIndex");
            mergedRange.load("columnIndex");

            await ctx.sync();

            // the middle row is the outgoing row
            let rangeLine: Excel.Range =
                sheet.getRangeByIndexes(mergedRange.rowIndex + 1, mergedRange.columnIndex + 1, 1, 1);

            rangeLine.load("rowIndex");
            rangeLine.load("columnIndex");

            if (await this.isCellInLineColumn(ctx, rangeLine))
            {
                feederLine = await this.getOutgoingLineRange(ctx,
                    sheet,
                    new RangeInfo(rangeLine.rowIndex, 1, rangeLine.columnIndex, 1));

                await this.removeAllGameFormatting(ctx, Ranges.rangeFromRangeInfo(sheet, feederLine));
            }
            mergedRange.unmerge();
            await ctx.sync();

            ctx.trackedObjects.remove(range);
            ctx.trackedObjects.remove(mergedRange);
            ctx.trackedObjects.remove(sheet);
        }
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.findAndRemoveGame
    ----------------------------------------------------------------------------*/
    static async findAndRemoveGame(appContext: IAppContext, ctx: any, game: IBracketGame)
    {
        await game.Bind(ctx);

        if (!game.IsLinkedToBracket)
        {
            appContext.log(`Cannot find game ${game.GameNum} in the bracket`);
            return;
        }

        // we're linked to a game, so we can go straight to it and obliterate it
        await this.obliterateGameFromSheet(ctx, appContext, game.FullGameRange);

        // obliterate can't deal with the named ranges (there's no way to map
        // range back to named item), but we know the names, so we can delete them
        await Ranges.ensureGlobalNameDeleted(ctx, game.TopTeamCellName);
        await Ranges.ensureGlobalNameDeleted(ctx, game.BottomTeamCellName);
        await Ranges.ensureGlobalNameDeleted(ctx, game.GameNumberCellName);

        await game.Bind(ctx);
    }

}