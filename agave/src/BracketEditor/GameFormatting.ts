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

    /*----------------------------------------------------------------------------
        %%Function: GameFormatting.isCellInLineRow
    ----------------------------------------------------------------------------*/
    static async isCellInLineRow(context: JsCtx, range: Excel.Range): Promise<boolean>
    {
        range.load("height");
        range.load("address");
        await context.sync();

        return range.height <= 1;
    }

    static isCellInLineRowFaster(areas: FastRangeAreas, range: RangeInfo): boolean
    {
        const format: Excel.RangeFormat = areas.getFormatForRangeInfo(range);

        return format.rowHeight <= 1;
    }

    /*----------------------------------------------------------------------------
        %%Function: GameFormatting.isCellInLineColumn
    ----------------------------------------------------------------------------*/
    static async isCellInLineColumn(context: JsCtx, range: Excel.Range): Promise<boolean>
    {
        range.load("width");
        await context.sync();

        return range.width < 5;
    }

    static isCellInLineColumnFaster(areas: FastRangeAreas, range: RangeInfo): boolean
    {
        const format: Excel.RangeFormat = areas.getFormatForRangeInfo(range);

        return format.columnWidth < 5;
    }

    /*----------------------------------------------------------------------------
        %%Function: GameFormatting.isCellInGameTitleColumn
    ----------------------------------------------------------------------------*/
    static async isCellInGameTitleColumn(context: JsCtx, range: Excel.Range): Promise<boolean>
    {
        range.load("width");
        await context.sync();

        return range.width > 20;
    }

    static isCellInGameTitleColumnFaster(areas: FastRangeAreas, range: RangeInfo): boolean
    {
        const format: Excel.RangeFormat = areas.getFormatForRangeInfo(range);

        return format.columnWidth > 20;
    }

    /*----------------------------------------------------------------------------
        %%Function: GameFormatting.isCellInGameScoreColumn
    ----------------------------------------------------------------------------*/
    static async isCellInGameScoreColumn(context: JsCtx, range: Excel.Range): Promise<boolean>
    {
        range.load("width");
        await context.sync();

        return range.width <= 20;
    }

    static isCellInGameScoreColumnFaster(areas: FastRangeAreas, range: RangeInfo): boolean
    {
        const format: Excel.RangeFormat = areas.getFormatForRangeInfo(range);

        return format.columnWidth <= 20 && format.columnWidth >= 5;
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