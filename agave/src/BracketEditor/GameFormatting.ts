import { FastRangeAreas } from "../Interop/FastRangeAreas";
import { IIntention } from "../Interop/Intentions/IIntention";
import { TnClearRange } from "../Interop/Intentions/TnClearRange";
import { TnSetFillColor } from "../Interop/Intentions/TnSetFillColor";
import { JsCtx } from "../Interop/JsCtx";
import { RangeInfo } from "../Interop/Ranges";
import { s_staticConfig } from "../StaticConfig";
import { GridColumnType, GridRowType, Grid } from "./Grid";
import { TnSetFontInfo } from "../Interop/Intentions/TnSetFontInfo";
import { TnSetVerticalAlignment } from "../Interop/Intentions/TnSetVerticalAlignment";
import { TnSetHorizontalAlignment } from "../Interop/Intentions/TnSetHorizontalAlignment";
import { TnSetFontColor } from "../Interop/Intentions/TnSetFontColor";
import { TnSetFontItalic } from "../Interop/Intentions/TnSetFontItalic";
import { TnSetFontBold } from "../Interop/Intentions/TnSetFontBold";
import { TnSetNumberFormat } from "../Interop/Intentions/TnSetNumberFormat";
import { TnMergeRange } from "../Interop/Intentions/TnMergeRange";
import { GridItem } from "./GridItem";
import { _ThemeFormattingRules } from "./StructureEditor/FormattingRules/ThemeRules";
import { ThemeItem } from "./StructureEditor/FormattingRules/Themes/ThemeItem";
import { _ElementFormattingRules } from "./StructureEditor/FormattingRules/ElementFormattingRules";
import { ElementItem } from "./StructureEditor/FormattingRules/Elements/ElementItem";
import { FontRule } from "./StructureEditor/FormattingRules/RuleTypes/FontRule";
import { ElementDefinition } from "./StructureEditor/FormattingRules/Elements/ElementDefinition";

export class GameFormatting
{
    static s_lineText = "line";

    static s_vLinePrefix = `v${GameFormatting.s_lineText}`;
    static s_vLineText = `${GameFormatting.s_vLinePrefix}t`; // a line in a text row
    static s_vLineLine = `${GameFormatting.s_vLinePrefix}l`; // a line in a horizontal line row

    static s_hLinePrefix = `h${GameFormatting.s_lineText}`;
    static s_hLineTeam = `${GameFormatting.s_hLinePrefix}t`; // a line in the TeamName column
    static s_hLineScore = `${GameFormatting.s_hLinePrefix}s`; // a line in the Score column
    static s_hLineLine = `${GameFormatting.s_vLinePrefix}l`; // a line in the vertical line column -- same as vertical line in a line row

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
        if (fmla == null || (fmla?.length ?? 0) < 5)
            return false;

        return fmla.toLowerCase().startsWith(GameFormatting.s_lineText, 1);
    }

    /*----------------------------------------------------------------------------
        %%Function: isLineColumnTypeMatch
        %%Qualified: GameFormatting.isLineColumnTypeMatch
    ----------------------------------------------------------------------------*/
    static isLineColumnTypeMatch(fmla: string | any, colType: GridColumnType): boolean
    {
        if (fmla == null || (fmla?.length ?? 0) < 5)
            return false;

        return fmla.toLowerCase() == GameFormatting.s_mapGridColumnType.get(colType);
    }

    /*----------------------------------------------------------------------------
        %%Function: isLineRowTypeMatch
        %%Qualified: GameFormatting.isLineRowTypeMatch
    ----------------------------------------------------------------------------*/
    static isLineRowTypeMatch(fmla: string | any, rowType: GridRowType): boolean
    {
        if (fmla == null || (fmla?.length ?? 0) < 5)
            return false;

        return fmla.toLowerCase() == GameFormatting.s_mapGridColumnType.get(rowType);
    }

    /*----------------------------------------------------------------------------
        %%Function: tnsFormatGridGame
        %%Qualified: GameFormatting.tnsFormatGridGame
    ----------------------------------------------------------------------------*/
    static tnsFormatGridGame(item: GridItem): IIntention[]
    {
        const tns: IIntention[] = [];

        if (item.isLineRange)
            return tns;

        const topTeamRange = item.TopTeamRange;
        tns.push(...this.tnsFormatTeamNameRangeRequest(topTeamRange));

        if (item.IsChampionshipGame)
            tns.push(...this.tnsFormatChampionshipText(topTeamRange.offset(2, 1, 0, 1)));
        else
        {
            const fCompressedGame = item.GameNumberRange.FirstRow - item.Range.FirstRow - 1 < 0;

            const bottomTeamRange = item.BottomTeamRange;
            tns.push(...this.tnsFormatTeamNameRangeRequest(bottomTeamRange));

            tns.push(...this.tnsFormatGameInfoBodyTextRequest(item.GameNumberRange, Excel.VerticalAlignment.center));

            tns.push(...GameFormatting.tnsFormatGameInfoBodyTextRequest(item.GameNumberRange.offset(0, 1, -1, 1), Excel.VerticalAlignment.center));
            tns.push(...GameFormatting.tnsFormatGameInfoTimeTextRequest(item.GameNumberRange.offset(2, 1, -1, 1)));

            if (!fCompressedGame)
                tns.push(...this.tnsFormatGameInfoAdvanceToTextRequest(topTeamRange.offset(2, 1, 0, 1), Excel.VerticalAlignment.top));
            tns.push(...this.tnsFormatGameInfoAdvanceToTextRequest(bottomTeamRange.offset(-2, 1, 0, 1), Excel.VerticalAlignment.bottom));
        }

        return tns;
    }

    /*----------------------------------------------------------------------------
        %%Function: tnsFormatTourneyHeadings
        %%Qualified: GameFormatting.tnsFormatTourneyHeadings
    ----------------------------------------------------------------------------*/
    static tnsFormatTourneyHeadings(grid: Grid): IIntention[]
    {
        const headings = new RangeInfo(0, 3, grid.FirstGridPattern.FirstColumn, 1);

        const tns: IIntention[] = [];

        tns.push(..._ElementFormattingRules().getElementDefinition(ElementItem.TourneyHeading).getTns(headings));

        const subHeadings = headings.offset(3, 1, 0, 1);

        tns.push(..._ElementFormattingRules().getElementDefinition(ElementItem.TourneySubHeading).getTns(subHeadings));

        return tns;
    }


    /*----------------------------------------------------------------------------
        %%Function: tnsFormatDates
        %%Qualified: GameFormatting.tnsFormatDates
    ----------------------------------------------------------------------------*/
    static tnsFormatDates(grid: Grid): IIntention[]
    {
        // our day names are 1 row above our dates
        const datesRange = new RangeInfo(grid.RowForDates - 1, 2, grid.FirstGridPattern.FirstColumn, 56);

        return _ElementFormattingRules().getElementDefinition(ElementItem.Dates).getTns(datesRange);
    }

    /*----------------------------------------------------------------------------
        %%Function: GameFormatting.formatTeamNameRange
    ----------------------------------------------------------------------------*/
    static tnsFormatTeamNameRangeRequest(teamNameRange: RangeInfo): IIntention[]
    {
        if (teamNameRange == null)
            return [];

        return _ElementFormattingRules().getElementDefinition(ElementItem.GameTitle).getTns(teamNameRange);
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
            TnSetFillColor.Create(range, "black"),
            TnSetFontColor.Create(range, "black"),
            TnSetNumberFormat.Create(range, [[";;;"]])
        ];
    }

    /*----------------------------------------------------------------------------
        %%Function: tnsFormatGameInfoBodyTextRequest
        %%Qualified: GameFormatting.tnsFormatGameInfoBodyTextRequest
    ----------------------------------------------------------------------------*/
    static tnsFormatGameInfoBodyTextRequest(rangeInfo: RangeInfo, verticalAlignment: Excel.VerticalAlignment): IIntention[]
    {
        const tns: IIntention[] =
            _ElementFormattingRules()
                .getElementDefinition(ElementItem.GameBody)
                .getTns(rangeInfo);

        tns.push(TnSetVerticalAlignment.Create(rangeInfo, verticalAlignment));

        return tns;
    }

    /*----------------------------------------------------------------------------
        %%Function: tnsFormatChampionshipText
        %%Qualified: GameFormatting.tnsFormatChampionshipText
    ----------------------------------------------------------------------------*/
    static tnsFormatChampionshipText(rangeInfo: RangeInfo): IIntention[]
    {
        return _ElementFormattingRules()
            .getElementDefinition(ElementItem.Champion)
            .getTns(rangeInfo);
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
        %%Function: tnsFormatGameInfoTimeTextRequest
        %%Qualified: GameFormatting.tnsFormatGameInfoTimeTextRequest
    ----------------------------------------------------------------------------*/
    static tnsFormatGameInfoTimeTextRequest(rangeInfo: RangeInfo): IIntention[]
    {
        const tns: IIntention[] =
            _ElementFormattingRules()
                .getElementDefinition(ElementItem.GameBody)
                .getTns(rangeInfo);

        tns.push(TnSetVerticalAlignment.Create(rangeInfo, Excel.VerticalAlignment.top));
        tns.push(TnSetNumberFormat.Create(rangeInfo, [["h:mm AM/PM"]]));

        return tns;
    }

    /*----------------------------------------------------------------------------
        %%Function: GameFormatting.tnsFormatGameInfoAdvanceToTextRequest
    ----------------------------------------------------------------------------*/
    static tnsFormatGameInfoAdvanceToTextRequest(range: RangeInfo, align: Excel.VerticalAlignment): IIntention[]
    {
        const tns: IIntention[] =
            _ElementFormattingRules()
                .getElementDefinition(ElementItem.AdvanceTo)
                .getTns(range);

        tns.push(TnSetVerticalAlignment.Create(range, align));
        return tns;
    }

    /*----------------------------------------------------------------------------
        %%Function: GameFormatting.tnsFormatGameInfoGameNumberRequest
    ----------------------------------------------------------------------------*/
    static tnsFormatGameInfoGameNumberRequest(range: RangeInfo): IIntention[]
    {
        const tns: IIntention[] =
            _ElementFormattingRules()
                .getElementDefinition(ElementItem.GameNumber)
                .getTns(range);

        tns.push(TnMergeRange.Create(range, false));
        return tns;
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
        return format.rowHeight <= 3;
    }

    static isCellInLineRowFaster(areas: FastRangeAreas, range: RangeInfo): boolean
    {
        const format: Excel.RangeFormat = areas.getFormatForRangeInfo(range);

        return this.isRangeFormatInLineRow(format);
    }

    static isRangeFormatInLineColumn(format: Excel.RangeFormat): boolean
    {
        return format.columnWidth < 7;
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
        return format.columnWidth > 30;
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
        return format.columnWidth <= 30 && format.columnWidth >= 5;
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