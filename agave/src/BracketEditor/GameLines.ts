import { RangeInfo, Ranges } from "../Interop/Ranges";
import { GameFormatting } from "./GameFormatting";
import { IBracketGame, IBracketGame as IBracketGame1, BracketGame } from "./BracketGame";
import { AppContext } from "../AppContext/AppContext";
import { BracketManager } from "../Brackets/BracketManager";
import { TrackingCache } from "../Interop/TrackingCache";
import { JsCtx } from "../Interop/JsCtx";
import { FastRangeAreas } from "../Interop/FastRangeAreas";
import { FastFormulaAreas } from "../Interop/FastFormulaAreas";
import { GridColumnType } from "./Grid";

export class GameLines
{
    /*----------------------------------------------------------------------------
        %%Function: GameLines.findMatchingGameConnections

        find the matching game connections:
        [topSource, bottomSource, winnerTarget]

        These can be used to determine adjustments to a games placement (or even
        an "i'm feeling lucky" placement), as well as whether home/away needs to
        be swapped.

        These ranges, if not null, represent the first cell that should be
        included in the connection line (or it might be the underline portion of
        the next game)
    ----------------------------------------------------------------------------*/
    static async findMatchingGameConnections(context: JsCtx, game: IBracketGame): Promise<[RangeInfo, RangeInfo, RangeInfo]>
    {
        let topSource: RangeInfo = null;
        let bottomSource: RangeInfo = null;
        let winnerTarget: RangeInfo = null;
        const bookmark: string = "findMatchingGameConnections";

        context.pushTrackingBookmark(bookmark);

        const top: string = game.BracketGameDefinition.topSource;

        if (!BracketGame.IsTeamSourceStatic(top))
        {
            let gameSource: BracketGame = new BracketGame();

            await gameSource.Load(context, null, game.BracketName, BracketManager.GameIdFromWinnerLoser(top).GameNum);
            topSource = new RangeInfo(gameSource.GameIdRange.FirstRow + 1, 1, gameSource.GameIdRange.FirstColumn + 2, 1);
        }

        const bottom: string = game.BracketGameDefinition.bottomSource;
        if (!BracketGame.IsTeamSourceStatic(bottom) && !game.IsChampionship)
        {
            let gameSource: BracketGame = new BracketGame();

            await gameSource.Load(context, null, game.BracketName, BracketManager.GameIdFromWinnerLoser(bottom).GameNum);
            topSource = new RangeInfo(gameSource.GameIdRange.FirstRow + 1, 1, gameSource.GameIdRange.FirstColumn + 2, 1);
        }

        const winner: string = game.BracketGameDefinition.winner;
        if (winner != "" && !game.IsChampionship)
        {
            let gameSource: BracketGame = new BracketGame();

            await gameSource.Load(context, null, game.BracketName, BracketManager.GameIdFromWinnerLoser(winner).GameNum);
            if (winner.substring(0) === "T")
            {
                winnerTarget = new RangeInfo(gameSource.TopTeamRange.FirstRow + 1, 1, gameSource.TopTeamRange.FirstColumn - 1, 1);
            }
            else
            {
                winnerTarget = new RangeInfo(gameSource.BottomTeamRange.FirstRow - 1, 1, gameSource.BottomTeamRange.FirstColumn - 1, 1);
            }
        }

        context.releaseCacheObjectsUntil(bookmark);
        await context.sync();

        return [topSource, bottomSource, winnerTarget];
    }

    /*----------------------------------------------------------------------------
        %%Function: GameLines.getInAndOutLinesForGameNoCache

        Simiar tofindMatchingGameConnections, but this function finds the already
        existing lines feeding into and out of this game

        This is the uncached version (not used by anyone currently)
    ----------------------------------------------------------------------------*/
    static async getInAndOutLinesForGameNoCache(context: JsCtx, game: IBracketGame1): Promise<[RangeInfo, RangeInfo, RangeInfo]>
    {
        let feederTop: RangeInfo = null;
        let feederBottom: RangeInfo = null;
        let feederWinner: RangeInfo = null;

        AppContext.checkpoint("giaolfg.1");
        await game.Bind(context, null);
        AppContext.checkpoint("giaolfg.2");
        if (!game.IsLinkedToBracket)
        {
            AppContext.checkpoint("giaolfg.3");
            return [feederTop, feederBottom, feederWinner];
        }

        AppContext.checkpoint("giaolfg.4");
        let sheet: Excel.Worksheet = context.Ctx.workbook.worksheets.getActiveWorksheet();
        context.Ctx.trackedObjects.add(sheet);
        let feederLine: RangeInfo;

        AppContext.checkpoint("giaolfg.5");
        feederTop = await GameLines.getFeedingLineRangeInfoNoCache(context, sheet, game.TopTeamRange.offset(1, 1, 0, 1), true);
        AppContext.checkpoint("giaolfg.6");

        if (!game.IsChampionship)
        {
            feederBottom = await GameLines.getFeedingLineRangeInfoNoCache(context, sheet, game.BottomTeamRange.offset(-1, 1, 0, 1), false);
            AppContext.checkpoint("giaolfg.7");
            feederWinner = await GameLines.getOutgoingLineRangeNoCache(context, sheet, game.GameIdRange.offset(1, 1, 1, 1));
            AppContext.checkpoint("giaolfg.8");
        }

        context.Ctx.trackedObjects.remove(sheet);
        AppContext.checkpoint("giaolfg.10");
        return [feederTop, feederBottom, feederWinner];
    }

    /*----------------------------------------------------------------------------
        %%Function: GameLines.getInAndOutLinesForGame

        Simiar tofindMatchingGameConnections, but this function finds the already
        existing lines feeding into and out of this game
    ----------------------------------------------------------------------------*/
    static async getInAndOutLinesForGame(context: JsCtx, fastFormulaAreas: FastFormulaAreas, game: IBracketGame1): Promise<[RangeInfo, RangeInfo, RangeInfo]>
    {
        let feederTop: RangeInfo = null;
        let feederBottom: RangeInfo = null;
        let feederWinner: RangeInfo = null;

        AppContext.checkpoint("giaolfg.1");
        await game.Bind(context, null);
        AppContext.checkpoint("giaolfg.2");
        if (!game.IsLinkedToBracket)
        {
            AppContext.checkpoint("giaolfg.3");
            return [feederTop, feederBottom, feederWinner];
        }

        AppContext.checkpoint("giaolfg.4");
        let feederLine: RangeInfo;

        AppContext.checkpoint("giaolfg.5");
        feederTop = GameLines.getFeedingLineRangeInfo(fastFormulaAreas, game.TopTeamRange.offset(1, 1, 0, 1), true);
        AppContext.checkpoint("giaolfg.6");

        if (!game.IsChampionship)
        {
            feederBottom = GameLines.getFeedingLineRangeInfo(fastFormulaAreas, game.BottomTeamRange.offset(-1, 1, 0, 1), false);
            AppContext.checkpoint("giaolfg.7");
            feederWinner = GameLines.getOutgoingLineRange(fastFormulaAreas, game.GameIdRange.offset(1, 1, 1, 1));
            AppContext.checkpoint("giaolfg.8");
        }

        AppContext.checkpoint("giaolfg.10");
        return [feederTop, feederBottom, feederWinner];
    }

    /*----------------------------------------------------------------------------
        %%Function: GameLines.isCellEmptyNoCache
    ----------------------------------------------------------------------------*/
    static async isCellEmptyNoCache(context: JsCtx, sheet: Excel.Worksheet, rangeCheck: RangeInfo): Promise<boolean>
    {
        let range: Excel.Range = Ranges.rangeFromRangeInfo(sheet, rangeCheck);
        range.load("values");
        await context.sync();

        if (range.values[0][0] != "")
            return false;

        return true;
    }

    /*----------------------------------------------------------------------------
        %%Function: GameLines.isCellEmpty
    ----------------------------------------------------------------------------*/
    static isCellEmpty(fastFormulaAreas: FastFormulaAreas, rangeCheck: RangeInfo): boolean
    {
        const contentCheck = fastFormulaAreas.getValuesForRangeInfo(rangeCheck);

        if (contentCheck[0][0] != "")
            return false;

        return true;
    }


    /*----------------------------------------------------------------------------
        %%Function: GameLines.getFeedingLineRangeInfoNoCache

        version that doesn't use the cache
    ----------------------------------------------------------------------------*/
    static async getFeedingLineRangeInfoNoCache(
        context: JsCtx,
        sheet: Excel.Worksheet,
        rangeGameLine: RangeInfo,
        topTeam: boolean): Promise<RangeInfo>
    {
        let curColumn: number = rangeGameLine.FirstColumn - 1;
        let outColumn: number = -1;

        while (curColumn > 0)
        {
            let range: Excel.Range = sheet.getRangeByIndexes(rangeGameLine.FirstRow, curColumn, 1, 1);
            context.Ctx.trackedObjects.add(range);

            range.format.load("fill");
            range.load("width");
            await context.sync();

            if ((range.format.fill.color !== "black" && range.format.fill.color !== "#000000")
                || !await GameLines.isCellEmptyNoCache(context, sheet, new RangeInfo(rangeGameLine.FirstRow + (topTeam ? -1 : 1), 1, curColumn, 1)))
            {
                context.Ctx.trackedObjects.remove(range);
                break;
            }

            // we don't want to include this cell quite yet -- only if the
            // next cell beyond is also filled...
            if (!(await GameFormatting.isCellInLineColumn(context, range)))
            {
                outColumn = curColumn;
                context.Ctx.trackedObjects.remove(range);
            }

            curColumn--;
        }

        if (outColumn == -1)
            return null;

        return new RangeInfo(rangeGameLine.FirstRow, 1, outColumn, rangeGameLine.FirstColumn - outColumn);
    }

    /*----------------------------------------------------------------------------
        %%Function: GameLines.getFeedingLineRangeInfo

        Given a range for the line on a game (under the top team or over the
        bottom team), return a range for any feeding line

        return null if there is no feeder line
    ----------------------------------------------------------------------------*/
    static getFeedingLineRangeInfo(
        fastFormulaAreas: FastFormulaAreas,
        rangeGameLine: RangeInfo,
        topTeam: boolean): RangeInfo
    {
        let curColumn: number = rangeGameLine.FirstColumn - 1;
        let outColumn: number = -1;

        while (curColumn > 0)
        {
            const lineCheck = fastFormulaAreas.getFormulasForRangeInfo(new RangeInfo(rangeGameLine.FirstRow, 1, curColumn, 1));
            const contentCheck = fastFormulaAreas.getFormulasForRangeInfo(new RangeInfo(rangeGameLine.FirstRow + (topTeam ? -1 : 1), 1, curColumn, 1));

            // check to see if we are at the next game (either we don't have a line anymore, or we have content in the team cell)
            if (!GameFormatting.isLineFormula(lineCheck[0][0]
                || (contentCheck[0][0]?.length ?? 0) > 0))
            {
                break;
            }

            // we don't want to include this cell quite yet -- only if the
            // next cell beyond is also filled...
            if (!GameFormatting.isLineColumnTypeMatch(lineCheck[0][0], GridColumnType.Line))
                outColumn = curColumn;

            curColumn--;
        }

        if (outColumn == -1)
            return null;

        return new RangeInfo(rangeGameLine.FirstRow, 1, outColumn, rangeGameLine.FirstColumn - outColumn);
    }

    /*----------------------------------------------------------------------------
        %%Function: GameLines.getOutgoingLineRangeNoCache

        version that doesn't use the cache
    ----------------------------------------------------------------------------*/
    static async getOutgoingLineRangeNoCache(
        context: JsCtx,
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
            context.Ctx.trackedObjects.add(range);

            range.format.load("fill");
            await context.sync();

            // an unfilled range marks the end of a title range, which means that the
            // 3 previous filled cells should be discounted
            if ((range.format.fill.color !== "black" && range.format.fill.color !== "#000000"))
            {
                context.Ctx.trackedObjects.remove(range);
                break;
            }

            if (fLastWasLineColumn)
            {
                // everything up to and including the line column is part of the outgoing
                // line range
                outColumn = curColumn - 1;
                fLastWasLineColumn = false;
            }

            if ((await GameFormatting.isCellInLineColumn(context, range)))
                fLastWasLineColumn = true;

            context.Ctx.trackedObjects.remove(range);

            // if there is text above or below us, this means we are in the first cell
            // of a title range. which means this cell should be discounted
            if (!await GameLines.isCellEmptyNoCache(context, sheet, new RangeInfo(rangeGameLine.FirstRow - 1, 1, curColumn, 1))
                || !await GameLines.isCellEmptyNoCache(context, sheet, new RangeInfo(rangeGameLine.FirstRow + 1, 1, curColumn, 1)))
            {
                break;
            }

            curColumn++;
        }

        if (outColumn == -1 || outColumn <= rangeGameLine.FirstColumn + 1)
            return null;

        return new RangeInfo(rangeGameLine.FirstRow, 1, rangeGameLine.FirstColumn + 1, outColumn - rangeGameLine.FirstColumn);
    }

    /*----------------------------------------------------------------------------
        %%Function: GameLines.getOutgoingLineRange

        
        Build a rangeInfo for the outgoing line for the given rangeInfo that
        represents the verticalLine cell on the outgoing line.

        The returned range will not include the underline underneath (or over)
        the team name. So, we will only consider a cell that is NOT followed by
        only 3 filled cells (must have more that 4 filled cells).

        this means that if the outgoing line does not actually join with a game,
        then 3 filled cells will be left around
    ----------------------------------------------------------------------------*/
    static getOutgoingLineRange(
        fastFormulaAreas: FastFormulaAreas,
        rangeGameLine: RangeInfo): RangeInfo
    {
        let curColumn: number = rangeGameLine.FirstColumn + 1;
        let outColumn: number = -1;

        let fLastWasLineColumn: boolean = true;

        while (curColumn < 10000) // just an arbitrarily large number
        {
            const range: RangeInfo = new RangeInfo(rangeGameLine.FirstRow, 1, curColumn, 1);
            const lineCheck = fastFormulaAreas.getFormulasForRangeInfo(range);
//            const format: Excel.RangeFormat = fastRangeAreas.getFormatForRangeInfo(range);

            // an unfilled range marks the end of a title range, which means that the
            // 3 previous filled cells should be discounted
            if (!GameFormatting.isLineFormula(lineCheck[0][0]))
                break;

            if (fLastWasLineColumn)
            {
                // everything up to and including the line column is part of the outgoing
                // line range
                outColumn = curColumn - 1;
                fLastWasLineColumn = false;
            }

            if (GameFormatting.isLineColumnTypeMatch(lineCheck[0][0], GridColumnType.Line))
                fLastWasLineColumn = true;

            // if there is text above or below us, this means we are in the first cell
            // of a title range. which means this cell should be discounted
            if (!GameLines.isCellEmpty(fastFormulaAreas, new RangeInfo(rangeGameLine.FirstRow - 1, 1, curColumn, 1))
                || !GameLines.isCellEmpty(fastFormulaAreas, new RangeInfo(rangeGameLine.FirstRow + 1, 1, curColumn, 1)))
            {
                break;
            }

            curColumn++;
        }

        if (outColumn == -1 || outColumn <= rangeGameLine.FirstColumn + 1)
            return null;

        return new RangeInfo(rangeGameLine.FirstRow, 1, rangeGameLine.FirstColumn + 1, outColumn - rangeGameLine.FirstColumn);
    }
}