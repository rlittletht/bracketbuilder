import { FastRangeAreas } from "../Interop/FastRangeAreas";
import { IIntention } from "../Interop/Intentions/IIntention";
import { TnClearRange } from "../Interop/Intentions/TnClearRange";
import { JsCtx } from "../Interop/JsCtx";
import { RangeInfo } from "../Interop/Ranges";
import { s_staticConfig } from "../StaticConfig";
import { GridColumnType, GridRowType } from "./Grid";

export class GameFormatting
{
    static s_lineText = "line";

    static s_vLinePrefix = `v${GameFormatting.s_lineText}`;
    static s_vLineText = `${GameFormatting.s_vLinePrefix}t`; // a line in a text row
    static s_vLineLine = `${GameFormatting.s_vLinePrefix}l`; // a line in a horizontal line row

    static s_hLinePrefix = `h${GameFormatting.s_lineText}`;
    static s_hLineTeam =  `${GameFormatting.s_hLinePrefix}t`; // a line in the TeamName column
    static s_hLineScore = `${GameFormatting.s_hLinePrefix}s`; // a line in the Score column
    static s_hLineLine =  `${GameFormatting.s_vLinePrefix}l`; // a line in the vertical line column -- same as vertical line in a line row

    static s_mapGridRowType = new Map<GridRowType, string>(
        [
            [GridRowType.Text, GameFormatting.s_vLineText],
            [GridRowType.Line, GameFormatting.s_vLineLine],
        ]);

    static s_mapGridColumnType = new Map<GridColumnType, string>(
        [
            [GridColumnType.Team, GameFormatting.s_hLineTeam],
            [GridColumnType.Score, GameFormatting.s_hLineScore],
            [GridColumnType.Line, GameFormatting.s_vLineLine], // vLineLine and hLineLine are the same (intersectionality)
        ]);

    /*----------------------------------------------------------------------------
        %%Function: GameFormatting.isLineFormula

        Does the given formula string correspond to any of our line cells?

        These functions have to be very careful about operating on non-strings
    ----------------------------------------------------------------------------*/
    static isLineFormula(fmla: string | any): boolean
    {
        if (fmla == null || (fmla?.length ?? 0)< 5)
            return false;

        return fmla.toLowerCase().startsWith(GameFormatting.s_lineText, 1);
    }

    static isLineColumnTypeMatch(fmla: string | any, colType: GridColumnType): boolean
    {
        if (fmla == null || (fmla?.length ?? 0) < 5)
            return false;

        return fmla.toLowerCase() == GameFormatting.s_mapGridColumnType.get(colType);
    }

    static isLineRowTypeMatch(fmla: string | any, rowType: GridRowType): boolean
    {
        if (fmla == null || (fmla?.length ?? 0) < 5)
            return false;

        return fmla.toLowerCase() == GameFormatting.s_mapGridColumnType.get(rowType);
    }


    /*----------------------------------------------------------------------------
        %%Function: GameFormatting.formatTeamNameRange
    ----------------------------------------------------------------------------*/
    static formatTeamNameRangeRequest(teamNameRange: Excel.Range)
    {
        teamNameRange.format.font.name = s_staticConfig.blackFont;
        teamNameRange.format.font.size = s_staticConfig.blackSize;
        teamNameRange.format.horizontalAlignment = Excel.HorizontalAlignment.center;
        teamNameRange.format.verticalAlignment = Excel.VerticalAlignment.center;
    }

    /*----------------------------------------------------------------------------
        %%Function: GameFormatting.formatConnectingLineRange
    ----------------------------------------------------------------------------*/
    static formatConnectingLineRangeRequest(lineRange: Excel.Range)
    {
        lineRange.format.fill.color = "black";
        lineRange.format.font.color = "white";
    }

    /*----------------------------------------------------------------------------
        %%Function: GameFormatting.formatGameInfoBodyText
    ----------------------------------------------------------------------------*/
    static formatGameInfoBodyTextRequest(range: Excel.Range)
    {
        range.format.font.name = s_staticConfig.bodyFont;
        range.format.font.size = s_staticConfig.bodySize;
        range.format.horizontalAlignment = Excel.HorizontalAlignment.center;
        range.format.verticalAlignment = Excel.VerticalAlignment.bottom;
    }

    static formatChampionshipText(range: Excel.Range)
    {
        range.format.font.name = s_staticConfig.bodyFont;
        range.format.font.size = s_staticConfig.championSize;
        range.format.font.bold = true;
        range.format.font.italic = true;
        range.format.font.color = "#ff0000";
        range.format.horizontalAlignment = Excel.HorizontalAlignment.center;
        range.format.verticalAlignment = Excel.VerticalAlignment.bottom;
    }

    /*----------------------------------------------------------------------------
        %%Function: GameFormatting.formatGameInfoTimeText
    ----------------------------------------------------------------------------*/
    static formatGameInfoTimeTextRequest(range: Excel.Range)
    {
        range.format.font.name = s_staticConfig.bodyFont
        range.format.font.size = s_staticConfig.bodySize;
        range.format.horizontalAlignment = Excel.HorizontalAlignment.center;
        range.format.verticalAlignment = Excel.VerticalAlignment.top;
        range.numberFormat = [["h:mm AM/PM"]];
    }

    /*----------------------------------------------------------------------------
        %%Function: GameFormatting.formatGameInfoAdvanceToText
    ----------------------------------------------------------------------------*/
    static formatGameInfoAdvanceToTextRequest(range: Excel.Range, align: Excel.VerticalAlignment)
    {
        range.format.font.name = s_staticConfig.bodyFont;
        range.format.font.size = s_staticConfig.advanceSize;
        range.format.font.bold = true;
        range.format.font.italic = true;
        range.format.horizontalAlignment = Excel.HorizontalAlignment.center;
        range.format.verticalAlignment = align;
        range.format.font.color = "#ff0000";
    }

    /*----------------------------------------------------------------------------
        %%Function: GameFormatting.formatGameInfoGameNumber
    ----------------------------------------------------------------------------*/
    static formatGameInfoGameNumberRequest(range: Excel.Range)
    {
        range.format.font.name = s_staticConfig.bodyFont;
        range.format.font.size = s_staticConfig.gameNumSize;
        range.format.font.bold = true;
        range.format.horizontalAlignment = Excel.HorizontalAlignment.right;
        range.format.verticalAlignment = Excel.VerticalAlignment.center;
        range.merge(false);
    }

    /*----------------------------------------------------------------------------
        %%Function: GameFormatting.formatRangeForPriority
    ----------------------------------------------------------------------------*/
    static formatRangeForPriority(range: Excel.Range, priority: number)
    {
        if (priority == -2)
            range.format.fill.color = "#FFFF00";
        else if (priority == 0)
            range.format.fill.color = "#C6E0B4";
        else if (priority == 1)
            range.format.fill.color = "#F8CBAD";
        else
            range.format.fill.clear();
    }

    /*----------------------------------------------------------------------------
        %%Function: GameFormatting.formatRangeNormal
    ----------------------------------------------------------------------------*/
    static formatRangeNormalRequest(range: Excel.Range)
    {
        range.format.fill.clear();
        range.format.font.name = s_staticConfig.bodyFont;
        range.format.font.size = 11;
        range.format.horizontalAlignment = Excel.HorizontalAlignment.left;
        range.format.verticalAlignment = Excel.VerticalAlignment.top;
    }

    static isRangeFormatInLineRow(format: Excel.RangeFormat): boolean
    {
        return format.rowHeight <= 1;
    }

    static isCellInLineRowFaster(areas: FastRangeAreas, range: RangeInfo): boolean
    {
        const format: Excel.RangeFormat = areas.getFormatForRangeInfo(range);

        return this.isRangeFormatInLineRow(format);
    }

    static isRangeFormatInLineColumn(format: Excel.RangeFormat): boolean
    {
        return format.columnWidth < 5;

    }
    /*----------------------------------------------------------------------------
        %%Function: GameFormatting.isCellInLineColumn
    ----------------------------------------------------------------------------*/
    static async isCellInLineColumn(context: JsCtx, range: Excel.Range): Promise<boolean>
    {
        range.load("format");
        await context.sync();

        return this.isRangeFormatInLineColumn(range.format);
    }

    static isCellInLineColumnFaster(areas: FastRangeAreas, range: RangeInfo): boolean
    {
        const format: Excel.RangeFormat = areas.getFormatForRangeInfo(range);

        return this.isRangeFormatInLineColumn(format);
    }

    static isRangeFormatInGameTitleColumn(format: Excel.RangeFormat): boolean
    {
        return format.columnWidth > 20;
    }

    /*----------------------------------------------------------------------------
        %%Function: GameFormatting.isCellInGameTitleColumn
    ----------------------------------------------------------------------------*/
    static async isCellInGameTitleColumn(context: JsCtx, range: Excel.Range): Promise<boolean>
    {
        range.load("format");
        await context.sync();

        return this.isRangeFormatInGameTitleColumn(range.format);
    }

    static isCellInGameTitleColumnFaster(areas: FastRangeAreas, range: RangeInfo): boolean
    {
        const format: Excel.RangeFormat = areas.getFormatForRangeInfo(range);

        return this.isRangeFormatInGameTitleColumn(format);
    }

    static isRangeFormatInGameScoreColumn(format: Excel.RangeFormat): boolean
    {
        return format.columnWidth <= 20 && format.columnWidth >= 5;
    }

    /*----------------------------------------------------------------------------
        %%Function: GameFormatting.isCellInGameScoreColumn
    ----------------------------------------------------------------------------*/
    static async isCellInGameScoreColumn(context: JsCtx, range: Excel.Range): Promise<boolean>
    {
        range.load("format");
        await context.sync();

        return this.isRangeFormatInGameScoreColumn(range.format);
    }

    static isCellInGameScoreColumnFaster(areas: FastRangeAreas, range: RangeInfo): boolean
    {
        const format: Excel.RangeFormat = areas.getFormatForRangeInfo(range);

        return this.isRangeFormatInGameScoreColumn(format);
    }

    /*----------------------------------------------------------------------------
        %%Function: GameFormatting.removeAllGameFormatting
    ----------------------------------------------------------------------------*/
    static removeAllGameFormattingNoTn(range: Excel.Range)
    {
        if (range == null)
            return;

        range.clear();
    }

    /*----------------------------------------------------------------------------
        %%Function: GameFormatting.tnsRemoveAllGameFormatting

        return intentions to remove all game formatting for the range
    ----------------------------------------------------------------------------*/
    static tnsRemoveAllGameFormatting(range: RangeInfo): IIntention[]
    {
        if (range == null)
            return [];

        return [TnClearRange.Create(range)];
    }
}