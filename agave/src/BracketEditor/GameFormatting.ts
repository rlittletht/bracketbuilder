import { JsCtx } from "../Interop/JsCtx";
import { FastRangeAreas } from "../Interop/FastRangeAreas";
import { RangeInfo } from "../Interop/Ranges";

export class GameFormatting
{
    /*----------------------------------------------------------------------------
        %%Function: GameFormatting.formatTeamNameRange
    ----------------------------------------------------------------------------*/
    static formatTeamNameRangeRequest(teamNameRange: Excel.Range)
    {
        teamNameRange.format.font.name = "Arial Black";
        teamNameRange.format.font.size = 9;
        teamNameRange.format.horizontalAlignment = Excel.HorizontalAlignment.center;
        teamNameRange.format.verticalAlignment = Excel.VerticalAlignment.center;
    }

    /*----------------------------------------------------------------------------
        %%Function: GameFormatting.formatConnectingLineRange
    ----------------------------------------------------------------------------*/
    static formatConnectingLineRangeRequest(lineRange: Excel.Range)
    {
        lineRange.format.fill.color = "black";
    }

    static formatConnectingLineRangeSync(lineRange: Excel.Range)
    {
        lineRange.format.fill.color = "black";
    }

    /*----------------------------------------------------------------------------
        %%Function: GameFormatting.formatGameInfoBodyText
    ----------------------------------------------------------------------------*/
    static formatGameInfoBodyTextRequest(range: Excel.Range)
    {
        range.format.font.name = "Calibri";
        range.format.font.size = 9;
        range.format.horizontalAlignment = Excel.HorizontalAlignment.center;
        range.format.verticalAlignment = Excel.VerticalAlignment.bottom;
    }

    static formatChampionshipText(range: Excel.Range)
    {
        range.format.font.name = "Calibri";
        range.format.font.size = 12;
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
        range.format.font.name = "Calibri";
        range.format.font.size = 9;
        range.format.horizontalAlignment = Excel.HorizontalAlignment.center;
        range.format.verticalAlignment = Excel.VerticalAlignment.top;
        range.numberFormat = [["h:mm AM/PM"]];
    }

    /*----------------------------------------------------------------------------
        %%Function: GameFormatting.formatGameInfoAdvanceToText
    ----------------------------------------------------------------------------*/
    static formatGameInfoAdvanceToTextRequest(range: Excel.Range, align: Excel.VerticalAlignment)
    {
        range.format.font.name = "Calibri";
        range.format.font.size = 8;
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
        range.format.font.name = "Calibri";
        range.format.font.size = 8;
        range.format.font.bold = true;
        range.format.horizontalAlignment = Excel.HorizontalAlignment.right;
        range.format.verticalAlignment = Excel.VerticalAlignment.center;
        range.merge(false);
    }


    /*----------------------------------------------------------------------------
        %%Function: GameFormatting.formatRangeNormal
    ----------------------------------------------------------------------------*/
    static formatRangeNormalRequest(range: Excel.Range)
    {
        range.format.fill.clear();
        range.format.font.name = "Calibri";
        range.format.font.size = 11;
        range.format.horizontalAlignment = Excel.HorizontalAlignment.left;
        range.format.verticalAlignment = Excel.VerticalAlignment.top;
    }

    static isRangeFormatInLineRow(format: Excel.RangeFormat): boolean
    {
        return format.rowHeight <= 1;
    }

    /*----------------------------------------------------------------------------
        %%Function: GameFormatting.isCellInLineRow
    ----------------------------------------------------------------------------*/
    static async isCellInLineRow(context: JsCtx, range: Excel.Range): Promise<boolean>
    {
        range.load("format");
        await context.sync();

        return this.isRangeFormatInLineRow(range.format);
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