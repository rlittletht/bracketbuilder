import { RangeInfo, Ranges } from "../Interop/Ranges";
import { GameFormatting } from "./GameFormatting";
import { IBracketGame, IBracketGame as IBracketGame1, BracketGame } from "./BracketGame";
import { AppContext } from "../AppContext";
import { BracketManager } from "../Brackets/BracketDefinitions";
import { TrackingCache } from "../Interop/TrackingCache";
import { JsCtx } from "../Interop/JsCtx";

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
        const cache: TrackingCache = new TrackingCache();

        const top: string = game.BracketGameDefinition.topSource;

        if (!BracketGame.IsTeamSourceStatic(top))
        {
            let gameSource: BracketGame = new BracketGame();

            await gameSource.Load(context, null, cache, game.BracketName, BracketManager.GameIdFromWinnerLoser(top).GameNum);
            topSource = new RangeInfo(gameSource.GameIdRange.FirstRow + 1, 1, gameSource.GameIdRange.FirstColumn + 2, 1);
        }

        const bottom: string = game.BracketGameDefinition.bottomSource;
        if (!BracketGame.IsTeamSourceStatic(bottom) && !game.IsChampionship)
        {
            let gameSource: BracketGame = new BracketGame();

            await gameSource.Load(context, null, cache, game.BracketName, BracketManager.GameIdFromWinnerLoser(bottom).GameNum);
            topSource = new RangeInfo(gameSource.GameIdRange.FirstRow + 1, 1, gameSource.GameIdRange.FirstColumn + 2, 1);
        }

        const winner: string = game.BracketGameDefinition.winner;
        if (winner != "" && !game.IsChampionship)
        {
            let gameSource: BracketGame = new BracketGame();

            await gameSource.Load(context, null, cache, game.BracketName, BracketManager.GameIdFromWinnerLoser(winner).GameNum);
            if (winner.substring(0) === "T")
            {
                winnerTarget = new RangeInfo(gameSource.TopTeamRange.FirstRow + 1, 1, gameSource.TopTeamRange.FirstColumn - 1, 1);
            }
            else
            {
                winnerTarget = new RangeInfo(gameSource.BottomTeamRange.FirstRow - 1, 1, gameSource.BottomTeamRange.FirstColumn - 1, 1);
            }
        }

        cache.ReleaseAll(context);
        await context.sync();

        return [topSource, bottomSource, winnerTarget];
    }

    /*----------------------------------------------------------------------------
        %%Function: GameLines.getInAndOutLinesForGame

        Simiar tofindMatchingGameConnections, but this function finds the already
        existing lines feeding into and out of this game
    ----------------------------------------------------------------------------*/
    static async getInAndOutLinesForGame(context: JsCtx, cache: TrackingCache, game: IBracketGame1): Promise<[RangeInfo, RangeInfo, RangeInfo]> {
        let feederTop: RangeInfo = null;
        let feederBottom: RangeInfo = null;
        let feederWinner: RangeInfo = null;

        AppContext.checkpoint("giaolfg.1");
        await game.Bind(context, null, cache);
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
        feederTop = await this.getFeedingLineRangeInfo(context, sheet, game.TopTeamRange.offset(1, 1, 0, 1), true);
        AppContext.checkpoint("giaolfg.6");

        if (!game.IsChampionship)
        {
            feederBottom = await this.getFeedingLineRangeInfo(context, sheet, game.BottomTeamRange.offset(-1, 1, 0, 1), false);
            AppContext.checkpoint("giaolfg.7");
            feederWinner = await this.getOutgoingLineRange(context, sheet, game.GameIdRange.offset(1, 1, 1, 1));
            AppContext.checkpoint("giaolfg.8");
        }

        context.Ctx.trackedObjects.remove(sheet);
        AppContext.checkpoint("giaolfg.10");
        return [feederTop, feederBottom, feederWinner];
    }

    static async isCellEmpty(context: JsCtx, sheet: Excel.Worksheet, rangeCheck: RangeInfo): Promise<boolean>
    {
        let range: Excel.Range = Ranges.rangeFromRangeInfo(sheet, rangeCheck);
        range.load("values");
        await context.sync();

        if (range.values[0][0] != "")
            return false;

        return true;
    }


    /*----------------------------------------------------------------------------
        %%Function: GameLines.getFeedingLineRangeInfo

        Given a range for the line on a game (under the top team or over the
        bottom team), return a range for any feeding line

        return null if there is no feeder line
    ----------------------------------------------------------------------------*/
    static async getFeedingLineRangeInfo(
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
                || !await this.isCellEmpty(context, sheet, new RangeInfo(rangeGameLine.FirstRow + (topTeam ? -1 : 1), 1, curColumn, 1)))
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
        %%Function: GameLines.getOutgoingLineRange

        Build a rangeInfo for the outgoing line for the given rangeInfo that
        represents the verticalLine cell on the outgoing line.

        The returned range will not include the underline underneath (or over)
        the team name. So, we will only consider a cell that is NOT followed by
        only 3 filled cells (must have more that 4 filled cells).

        this means that if the outgoing line does not actually join with a game,
        then 3 filled cells will be left around
    ----------------------------------------------------------------------------*/
    static async getOutgoingLineRange(
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
            if (!await this.isCellEmpty(context, sheet, new RangeInfo(rangeGameLine.FirstRow - 1, 1, curColumn, 1))
                || !await this.isCellEmpty(context, sheet, new RangeInfo(rangeGameLine.FirstRow + 1, 1, curColumn, 1)))
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