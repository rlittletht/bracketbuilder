import { Sheets, EnsureSheetPlacement } from "../Interop/Sheets";
import { Ranges } from "../Interop/Ranges";
import { OADate } from "../Interop/Dates";

export class GridBuilder
{
    /*----------------------------------------------------------------------------
        %%Function: GridBuilder.mergeAndFormatDay
    ----------------------------------------------------------------------------*/
    static async mergeAndFormatDay(ctx: any, sheet: Excel.Worksheet, row: number, col: number)
    {
        let range: Excel.Range = sheet.getRangeByIndexes(row, col, 2, 3);

        await ctx.sync();
        range.merge(true);
        await ctx.sync();

        range.format.horizontalAlignment = Excel.HorizontalAlignment.center;

        range.format.borders.getItem('EdgeTop').style = Excel.BorderLineStyle.continuous;
        range.format.borders.getItem('EdgeTop').weight = Excel.BorderWeight.medium;

        range.format.borders.getItem('EdgeBottom').style = Excel.BorderLineStyle.continuous;
        range.format.borders.getItem('EdgeBottom').weight = Excel.BorderWeight.thick;

        range.format.borders.getItem('EdgeLeft').style = Excel.BorderLineStyle.continuous;
        range.format.borders.getItem('EdgeLeft').weight = Excel.BorderWeight.medium;

        range.format.borders.getItem('EdgeRight').style = Excel.BorderLineStyle.continuous;
        range.format.borders.getItem('EdgeRight').weight = Excel.BorderWeight.medium;

        await ctx.sync();
    }


    /*----------------------------------------------------------------------------
        %%Function: GridBuilder.addDayGridFormulas

        each day is 3 columns (the team, the score, and the vertical line)
    ----------------------------------------------------------------------------*/
    static async addDayGridFormulas(ctx: any, sheet: Excel.Worksheet, rowStart: number, colStart: number, days: number)
    {
        if (days <= 1)
            throw "days must be > 1";

        const daysSpan: number = days * 3;

        let rng: Excel.Range = sheet.getRangeByIndexes(rowStart, colStart, 2, daysSpan);
        let ary: any[][] = [];

        let col: number = colStart;

        let aryFirstRow: any[] = [];
        let arySecondRow: any[] = [];

        // first, we have a static day
        aryFirstRow.push(`=TEXT(${Ranges.addressFromCoordinates([rowStart + 1, col], null)}, "DDDD")`);
        aryFirstRow.push(null);
        aryFirstRow.push(null);
        arySecondRow.push(OADate.ToOADate(new Date(Date.parse("8/21/2021"))) - (7 / 24));
        arySecondRow.push(null);
        arySecondRow.push(null);

        // now loop through the rest of the days for the number given
        while (--days > 0)
        {
            col += 3;
            aryFirstRow.push(`=TEXT(${Ranges.addressFromCoordinates([rowStart + 1, col], null)}, "DDDD")`);
            aryFirstRow.push(null);
            aryFirstRow.push(null);
            arySecondRow.push(`=${Ranges.addressFromCoordinates([rowStart + 1, col - 3], null)} + 1`);
            arySecondRow.push(null);
            arySecondRow.push(null);
        }

        ary.push(aryFirstRow);
        ary.push(arySecondRow);

        rng.formulas = ary;
        await ctx.sync();

        rng = sheet.getRangeByIndexes(rowStart + 1, colStart, 1, daysSpan);
        rng.numberFormat = [["d-mmm"]];
        await ctx.sync();

        // now merge and format the cells
        col = colStart;
        while (col < colStart + daysSpan)
        {
            await this.mergeAndFormatDay(ctx, sheet, rowStart, col);
            col += 3;
        }
    }

    /*----------------------------------------------------------------------------
        %%Function: GridBuilder.formatColumns
    ----------------------------------------------------------------------------*/
    static async formatColumns(
        ctx: any,
        sheet: Excel.Worksheet,
        columns: string[],
        width: number)
    {
        let ranges = sheet.getRanges(columns.join(","));
        await ctx.sync();

        ranges.format.columnWidth = width;
        await ctx.sync();
    }

    /*----------------------------------------------------------------------------
        %%Function: GridBuilder.formatRepeatingColumns
    ----------------------------------------------------------------------------*/
    static async formatRepeatingColumns(
        ctx: any,
        sheet: Excel.Worksheet,
        colStart: number,
        colSkip: number,
        colOffset: number,
        width: number,
        cols: number)
    {
        let rangeAddresses: string[] = [];
        let col: number = colStart + colOffset;

        while (col < colStart + cols * colSkip + colOffset)
        {
            rangeAddresses.push(`${Ranges.getColName(col)}:${Ranges.getColName(col)}`);
            col += colSkip;
        }

        await this.formatColumns(ctx, sheet, rangeAddresses, width);
    }

    /*----------------------------------------------------------------------------
        %%Function: GridBuilder.formatRows
    ----------------------------------------------------------------------------*/
    static async formatRows(
        ctx: any,
        sheet: Excel.Worksheet,
        columns: string[],
        height: number)
    {
        let ranges = sheet.getRanges(columns.join(","));
        await ctx.sync();

        ranges.format.rowHeight = height;
        await ctx.sync();
    }

    /*----------------------------------------------------------------------------
        %%Function: GridBuilder.formatRepeatingRows
    ----------------------------------------------------------------------------*/
    static async formatRepeatingRows(
        ctx: any,
        sheet: Excel.Worksheet,
        rowStart: number,
        rowSkip: number,
        rowOffset: number,
        height: number,
        rowGroups: number)
    {
        let rangeAddresses: string[] = [];
        let row: number = rowStart + rowOffset;

        while (row < rowStart + rowGroups * rowSkip + rowOffset)
        {
            rangeAddresses.push(`${row + 1}:${row + 1}`);
            row += rowSkip;
        }

        await this.formatRows(ctx, sheet, rangeAddresses, height);
    }

    /*----------------------------------------------------------------------------
        %%Function: GridBuilder.formatGridSheetDays
    ----------------------------------------------------------------------------*/
    static async formatGridSheetDays(ctx: any, sheet: Excel.Worksheet, colStart: number, days: number)
    {
        await this.formatRepeatingColumns(ctx, sheet, colStart, 3, 0, 104, days);
        await this.formatRepeatingColumns(ctx, sheet, colStart, 3, 1, 17.28, days);
        await this.formatRepeatingColumns(ctx, sheet, colStart, 3, 2, 0.9, days);

        await this.formatRepeatingRows(ctx, sheet, 9, 2, 0, 15, 300);
        await this.formatRepeatingRows(ctx, sheet, 9, 2, 1, 1, 300);
    }

    /*----------------------------------------------------------------------------
        %%Function: GridBuilder.buildGridSheet

        build the actual bracket grid sheet
    ----------------------------------------------------------------------------*/
    static async buildGridSheet(ctx: any)
    {
        const colFirstGridColumn: number = 6;

        let sheet: Excel.Worksheet = await Sheets.ensureSheetExists(ctx, "Games", null, EnsureSheetPlacement.First);
        let rng: Excel.Range = sheet.getRangeByIndexes(0, colFirstGridColumn, 3, 1);

        rng.formulas = [["=TournamentTitle"], ["=TournamentSubTitle"], ["=TournamentLocation"]]
        rng.format.font.bold = true;
        rng.format.font.size = 26;
        await ctx.sync();

        rng = sheet.getRangeByIndexes(3, colFirstGridColumn, 1, 1);
        rng.formulas = [["=TournamentAddress"]];
        rng.format.font.italic = true;
        rng.format.font.size = 18;
        await ctx.sync();

        await this.formatGridSheetDays(ctx, sheet, 6, 18);
        await this.formatColumns(ctx, sheet, ["A:A"], 60);
        await this.formatColumns(ctx, sheet, ["B:B", "E:E"], 0.9);
        await this.formatColumns(ctx, sheet, ["C:C"], 104);
        await this.formatColumns(ctx, sheet, ["D:D"], 17.28);
        await this.formatColumns(ctx, sheet, ["F:F"], 48);
        await this.addDayGridFormulas(ctx, sheet, 4, 6, 18);

        sheet.showGridlines = false;
        sheet.activate();
        await ctx.sync();
    }
}
