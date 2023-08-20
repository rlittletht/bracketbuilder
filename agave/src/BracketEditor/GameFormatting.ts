import { JsCtx } from "../Interop/JsCtx";
import { FastRangeAreas } from "../Interop/FastRangeAreas";
import { RangeInfo } from "../Interop/Ranges";
import { s_staticConfig } from "../StaticConfig";

export class GameFormatting
{
    static s_lineText = "Line";

    static s_vLinePrefix = `v${GameFormatting.s_lineText}`;
    static s_vLineText = `${GameFormatting.s_vLinePrefix}T`; // a line in a text row
    static s_vLineLine = `${GameFormatting.s_vLinePrefix}L`; // a line in a horizontal line row

    static s_hLinePrefix = `h${GameFormatting.s_lineText}`;
    static s_hLineTeam =  `${GameFormatting.s_hLinePrefix}T`; // a line in the TeamName column
    static s_hLineScore = `${GameFormatting.s_hLinePrefix}S`; // a line in the Score column
    static s_hLineLine =  `${GameFormatting.s_vLinePrefix}L`; // a line in the vertical line column -- same as vertical line in a line row


    /*----------------------------------------------------------------------------
        %%Function: GameFormatting.isLineFormula

        Does the given formula string correspond to any of our line cells?
    ----------------------------------------------------------------------------*/
    static isLineFormula(fmla: string): boolean
    {
        if (fmla == null || fmla.length < 5)
            return false;

        return fmla.toUpperCase().startsWith(GameFormatting.s_lineText, 1);
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
    static removeAllGameFormatting(range: Excel.Range)
    {
        if (range == null)
            return;

        range.clear();
    }
}