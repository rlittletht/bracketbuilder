import { RangeInfo } from "../Interop/Ranges";
import { Grid } from "./Grid";

// This represents all the ranges for inserting a game.
// the feeder ranges are the entire range covering the lines
// (not including any cells belonging to games -- this means
// that if a game immediately abutts any of the other games,
// the feeder range will be null since there are no additional
// line cells)
export class GridGameInsert
{
    m_swapTopBottom: boolean;
    m_rangeGame: RangeInfo;
    m_rangeFeederTop: RangeInfo;
    m_rangeFeederBottom: RangeInfo;
    m_rangeWinnerFeeder: RangeInfo;
    m_failReason: string;
    m_isChampionshipGame: boolean = false;

    get Range(): RangeInfo
    {
        return this.m_rangeGame;
    }

    static createFailedGame(error: string): GridGameInsert
    {
        let gameInsert: GridGameInsert = new GridGameInsert();

        gameInsert.m_failReason = error;
        return gameInsert;
    }

    setFeedersFromSources(sourceTop: RangeInfo, sourceBottom: RangeInfo, winnerTarget: RangeInfo, column: number, fSwapTopBottom: boolean)
    {
        fSwapTopBottom;
//        if (fSwapTopBottom)
//        {
//            const temp = sourceTop;
//            sourceTop = sourceBottom;
            //sourceBottom = temp;
//        }

        if (sourceTop != null
            && sourceTop.FirstColumn < column - 1
            && sourceTop.fuzzyMatchRow(this.m_rangeGame.FirstRow + 1, 0))
        {
            this.m_rangeFeederTop = RangeInfo.createFromCorners(sourceTop, sourceTop.newSetColumn(column - 1));
        }

        if (sourceBottom != null
            && sourceBottom.FirstColumn < column - 1
            && sourceBottom.fuzzyMatchRow(this.m_rangeGame.LastRow - 1, 0))
        {
            this.m_rangeFeederBottom = RangeInfo.createFromCorners(sourceBottom, sourceBottom.newSetColumn(column - 1));
        }

        if (winnerTarget != null
            && winnerTarget.FirstColumn > column + 3
            && winnerTarget.fuzzyMatchRow(Grid.getRangeInfoForGameInfo(this.m_rangeGame).FirstRow + 1, 0))
        {
            this.m_rangeWinnerFeeder = RangeInfo.createFromCorners(winnerTarget.newSetColumn(column + 3), winnerTarget);
        }
    }
}