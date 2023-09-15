import { FastRangeAreas } from "../Interop/FastRangeAreas";
import { IIntention } from "../Interop/Intentions/IIntention";
import { TnClearRange } from "../Interop/Intentions/TnClearRange";
import { TnSetFillAndFontColor } from "../Interop/Intentions/TnSetFillAndFontColor";
import { JsCtx } from "../Interop/JsCtx";
import { RangeInfo } from "../Interop/Ranges";
import { s_staticConfig } from "../StaticConfig";
import { GridColumnType, GridRowType } from "./Grid";
import { TnSetFontInfo } from "../Interop/Intentions/TnSetFontInfo";
import { TnSetVerticalAlignment } from "../Interop/Intentions/TnSetVerticalAlignment";
import { TnSetHorizontalAlignment } from "../Interop/Intentions/TnSetHorizontalAlignment";
import { TnSetFontColor } from "../Interop/Intentions/TnSetFontColor";
import { TnSetFontItalic } from "../Interop/Intentions/TnSetFontItalic";
import { TnSetFontBold } from "../Interop/Intentions/TnSetFontBold";
import { TnSetNumberFormat } from "../Interop/Intentions/TnSetNumberFormat";
import { TnMergeRange } from "../Interop/Intentions/TnMergeRange";

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

    static tnsFormatTeamNameRangeRequest(teamNameRange: RangeInfo): IIntention[]
    {
        if (teamNameRange == null)
            return [];

        return [
            TnSetFontInfo.Create(teamNameRange, s_staticConfig.blackFont, s_staticConfig.blackSize),
            TnSetHorizontalAlignment.Create(teamNameRange, Excel.HorizontalAlignment.center),
            TnSetVerticalAlignment.Create(teamNameRange, Excel.VerticalAlignment.center),
        ];
    }

    /*----------------------------------------------------------------------------
        %%Function: GameFormatting.formatConnectingLineRange
    ----------------------------------------------------------------------------*/
    static formatConnectingLineRangeRequest(lineRange: Excel.Range)
    {
        lineRange.format.fill.color = "black";
        lineRange.format.font.color = "white";
        lineRange.numberFormat = [[";;;"]];
    }

    /*----------------------------------------------------------------------------
        %%Function: GameFormatting.tnsFormatConnectingLineRangeRequest

        Return tns for formatConnectLineRange
    ----------------------------------------------------------------------------*/
    static tnsFormatConnectingLineRangeRequest(range: RangeInfo)
    {
        if (range == null)
            return [];

        return [
            TnSetFillAndFontColor.Create(range, "black", "black"),
            TnSetNumberFormat.Create(range, [[";;;"]])];
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

    static tnsFormatGameInfoBodyTextRequest(rangeInfo: RangeInfo): IIntention[]
    {
        return [
            TnSetFontInfo.Create(rangeInfo, s_staticConfig.bodyFont, s_staticConfig.bodySize),
            TnSetHorizontalAlignment.Create(rangeInfo, Excel.HorizontalAlignment.center),
            TnSetVerticalAlignment.Create(rangeInfo, Excel.VerticalAlignment.bottom)
        ];
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

    static tnsFormatChampionshipText(rangeInfo: RangeInfo): IIntention[]
    {
        return [
            TnSetFontInfo.Create(rangeInfo, s_staticConfig.bodyFont, s_staticConfig.championSize),
            TnSetFontBold.Create(rangeInfo, true),
            TnSetFontItalic.Create(rangeInfo, true),
            TnSetFontColor.Create(rangeInfo, "#ff0000"),
            TnSetHorizontalAlignment.Create(rangeInfo, Excel.HorizontalAlignment.center),
            TnSetVerticalAlignment.Create(rangeInfo, Excel.VerticalAlignment.bottom)
        ];
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

    static tnsFormatGameInfoTimeTextRequest(rangeInfo: RangeInfo): IIntention[]
    {
        return [
            TnSetFontInfo.Create(rangeInfo, s_staticConfig.bodyFont, s_staticConfig.bodySize),
            TnSetHorizontalAlignment.Create(rangeInfo, Excel.HorizontalAlignment.center),
            TnSetVerticalAlignment.Create(rangeInfo, Excel.VerticalAlignment.top),
            TnSetNumberFormat.Create(rangeInfo, [["h:mm AM/PM"]])
        ];
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

    static tnsFormatGameInfoAdvanceToTextRequest(range: RangeInfo, align: Excel.VerticalAlignment): IIntention[]
    {
        return [
            TnSetFontInfo.Create(range, s_staticConfig.bodyFont, s_staticConfig.advanceSize),
            TnSetFontBold.Create(range, true),
            TnSetFontItalic.Create(range, true),
            TnSetHorizontalAlignment.Create(range, Excel.HorizontalAlignment.center),
            TnSetVerticalAlignment.Create(range, align),
            TnSetFontColor.Create(range, "#ff0000")
        ];
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

    static tnsFormatGameInfoGameNumberRequest(range: RangeInfo): IIntention[]
    {
        return [
            TnSetFontInfo.Create(range, s_staticConfig.bodyFont, s_staticConfig.gameNumSize),
            TnSetFontBold.Create(range, true),
            TnSetHorizontalAlignment.Create(range, Excel.HorizontalAlignment.right),
            TnSetVerticalAlignment.Create(range, Excel.VerticalAlignment.center),
            TnMergeRange.Create(range, false)
        ];
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