import { RangeInfo } from "../Interop/Ranges";
import { GameFormatting } from "./GameFormatting";
import { IBracketGame, IBracketGame as IBracketGame1, BracketGame } from "./BracketGame";

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
    static async findMatchingGameConnections(ctx: any, game: IBracketGame): Promise<[RangeInfo, RangeInfo, RangeInfo]> {
        let topSource: RangeInfo = null;
        let bottomSource: RangeInfo = null;
        let winnerTarget: RangeInfo = null;

        const top: string = game.BracketGameDefinition.topSource;

        if (!BracketGame.IsTeamSourceStatic(top)) {
            let gameSource: BracketGame = new BracketGame();

            await gameSource.Load(ctx, game.BracketName, Number(top.substring(1)));
            topSource = new RangeInfo(gameSource.GameNumberRange.FirstRow + 1, 1, gameSource.GameNumberRange.FirstColumn + 2, 1);
        }

        const bottom: string = game.BracketGameDefinition.bottomSource;
        if (!BracketGame.IsTeamSourceStatic(bottom)) {
            let gameSource: BracketGame = new BracketGame();

            await gameSource.Load(ctx, game.BracketName, Number(bottom.substring(1)));
            topSource = new RangeInfo(gameSource.GameNumberRange.FirstRow + 1, 1, gameSource.GameNumberRange.FirstColumn + 2, 1);
        }

        const winner: string = game.BracketGameDefinition.winner;
        if (winner != "") {
            let gameSource: BracketGame = new BracketGame();

            await gameSource.Load(ctx, game.BracketName, Number(winner.substring(1)));
            if (winner.substring(0) === "T") {
                winnerTarget = new RangeInfo(gameSource.TopTeamRange.FirstRow + 1, 1, gameSource.TopTeamRange.FirstColumn - 1, 1);
            }
            else {
                winnerTarget = new RangeInfo(gameSource.BottomTeamRange.FirstRow - 1, 1, gameSource.BottomTeamRange.FirstColumn - 1, 1);
            }
        }

        return [topSource, bottomSource, winnerTarget];
    }

    /*----------------------------------------------------------------------------
        %%Function: GameLines.getInAndOutLinesForGame

        Simiar tofindMatchingGameConnections, but this function finds the already
        existing lines feeding into and out of this game
    ----------------------------------------------------------------------------*/
    static async getInAndOutLinesForGame(ctx: any, game: IBracketGame1): Promise<[RangeInfo, RangeInfo, RangeInfo]> {
        let feederTop: RangeInfo = null;
        let feederBottom: RangeInfo = null;
        let feederWinner: RangeInfo = null;

        console.log("giaolfg.1");
        await game.Bind(ctx);
        console.log("giaolfg.2");
        if (!game.IsLinkedToBracket)
        {
            console.log("giaolfg.3");
            return [feederTop, feederBottom, feederWinner];
        }

        console.log("giaolfg.4");
        let sheet: Excel.Worksheet = ctx.workbook.worksheets.getActiveWorksheet();
        ctx.trackedObjects.add(sheet);
        let feederLine: RangeInfo;

        console.log("giaolfg.5");
        feederTop = await this.getFeedingLineRangeInfo(ctx, sheet, game.TopTeamRange.offset(1, 1, 0, 1));
        console.log("giaolfg.6");
        feederBottom = await this.getFeedingLineRangeInfo(ctx, sheet, game.BottomTeamRange.offset(-1, 1, 0, 1));
        console.log("giaolfg.7");
        feederWinner = await this.getOutgoingLineRange(ctx, sheet, game.GameNumberRange.offset(1, 1, 1, 1));
        console.log("giaolfg.8");

        console.log("giaolfg.9");
        ctx.trackedObjects.remove(sheet);
        console.log("giaolfg.10");
        return [feederTop, feederBottom, feederWinner];
    }


    /*----------------------------------------------------------------------------
        %%Function: GameLines.getFeedingLineRangeInfo

        Given a range for the line on a game (under the top team or over the
        bottom team), return a range for any feeding line

        return null if there is no feeder line
    ----------------------------------------------------------------------------*/
    static async getFeedingLineRangeInfo(
        ctx: any,
        sheet: Excel.Worksheet,
        rangeGameLine: RangeInfo): Promise<RangeInfo> {
        let curColumn: number = rangeGameLine.FirstColumn - 1;
        let outColumn: number = -1;

        while (curColumn > 0) {
            let range: Excel.Range = sheet.getRangeByIndexes(rangeGameLine.FirstRow, curColumn, 1, 1);
            ctx.trackedObjects.add(range);

            range.format.load("fill");
            range.load("width");
            await ctx.sync();

            if (range.format.fill.color !== "black" && range.format.fill.color !== "#000000")
            {
                ctx.trackedObjects.remove(range);
                break;
            }

            // we don't want to include this cell quite yet -- only if the
            // next cell beyond is also filled...
            if (!(await GameFormatting.isCellInLineColumn(ctx, range))) {
                outColumn = curColumn;
                ctx.trackedObjects.remove(range);
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
        ctx: any,
        sheet: Excel.Worksheet,
        rangeGameLine: RangeInfo): Promise<RangeInfo> {
        let range: Excel.Range;
        let curColumn: number = rangeGameLine.FirstColumn + 1;
        let outColumn: number = -1;

        let fLastWasLineColumn: boolean = true;

        while (curColumn < 10000) // just an arbitrarily large number
        {
            range = sheet.getRangeByIndexes(rangeGameLine.FirstRow, curColumn, 1, 1);
            ctx.trackedObjects.add(range);

            range.format.load("fill");
            await ctx.sync();

            if (range.format.fill.color !== "black" && range.format.fill.color !== "#000000")
            {
                ctx.trackedObjects.remove(range);
                break;
            }

            if (fLastWasLineColumn) {
                // everything up to and including the line column is part of the outgoing
                // line range
                outColumn = curColumn - 1;
                fLastWasLineColumn = false;
            }

            if ((await GameFormatting.isCellInLineColumn(ctx, range)))
                fLastWasLineColumn = true;

            curColumn++;
            ctx.trackedObjects.remove(range);
        }

        if (outColumn == -1 || outColumn <= rangeGameLine.FirstColumn + 1)
            return null;

        return new RangeInfo(rangeGameLine.FirstRow, 1, rangeGameLine.FirstColumn + 1, outColumn - rangeGameLine.FirstColumn);
    }

}