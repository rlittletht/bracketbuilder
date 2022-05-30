import { Sheets, EnsureSheetPlacement } from "../Interop/Sheets";
import { Ranges } from "../Interop/Ranges";
import { OADate } from "../Interop/Dates";
import { GameFormatting } from "../BracketEditor/GameFormatting";

export class GridBuilder
{
    static SheetName: string = "Games";
    static maxDays: number = 18;

    /*----------------------------------------------------------------------------
        %%Function: GridBuilder.mergeAndFormatDay
    ----------------------------------------------------------------------------*/
    static mergeAndFormatDay(sheet: Excel.Worksheet, row: number, col: number)
    {
        // don't merge the vertical line ranges into the day cells
        const range: Excel.Range = sheet.getRangeByIndexes(row, col, 2, 2);
        range.merge(true);

        const rangeJustDays = sheet.getRangeByIndexes(row, col, 2, 3);

        rangeJustDays.format.horizontalAlignment = Excel.HorizontalAlignment.center;

        rangeJustDays.format.borders.getItem('EdgeTop').style = Excel.BorderLineStyle.continuous;
        rangeJustDays.format.borders.getItem('EdgeTop').weight = Excel.BorderWeight.medium;

        rangeJustDays.format.borders.getItem('EdgeBottom').style = Excel.BorderLineStyle.continuous;
        rangeJustDays.format.borders.getItem('EdgeBottom').weight = Excel.BorderWeight.thick;

        const rangeVerticalLine = sheet.getRangeByIndexes(row, col + 2, 2, 1);

        // this is going to take care of our ctx.sync()...
        GameFormatting.formatConnectingLineRangeSync(rangeVerticalLine);
    }


    /*----------------------------------------------------------------------------
        %%Function: GridBuilder.addDayGridFormulas

        each day is 3 columns (the team, the score, and the vertical line)
    ----------------------------------------------------------------------------*/
    static async addDayGridFormulas(sheet: Excel.Worksheet, rowStart: number, colStart: number, days: number)
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

        rng = sheet.getRangeByIndexes(rowStart + 1, colStart, 1, daysSpan);
        rng.numberFormat = [["d-mmm"]];

        // now merge and format the cells
        col = colStart;
        // and add a left border just for our first day
        const rangeJustDays = sheet.getRangeByIndexes(rowStart, colStart, 2, 1);

        rangeJustDays.format.borders.getItem('EdgeLeft').style = Excel.BorderLineStyle.continuous;
        rangeJustDays.format.borders.getItem('EdgeLeft').weight = Excel.BorderWeight.thick;

        while (col < colStart + daysSpan)
        {
            this.mergeAndFormatDay(sheet, rowStart, col);
            col += 3;
        }
    }

    /*----------------------------------------------------------------------------
        %%Function: GridBuilder.formatColumns
    ----------------------------------------------------------------------------*/
    static formatColumns(
        sheet: Excel.Worksheet,
        columns: string[],
        width: number)
    {
        let ranges = sheet.getRanges(columns.join(","));
        ranges.format.columnWidth = width;
    }

    /*----------------------------------------------------------------------------
        %%Function: GridBuilder.formatRepeatingColumns
    ----------------------------------------------------------------------------*/
    static formatRepeatingColumns(
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

        this.formatColumns(sheet, rangeAddresses, width);
    }

    /*----------------------------------------------------------------------------
        %%Function: GridBuilder.formatRows
    ----------------------------------------------------------------------------*/
    static formatRows(
        sheet: Excel.Worksheet,
        columns: string[],
        height: number)
    {
        let ranges = sheet.getRanges(columns.join(","));
        ranges.format.rowHeight = height;
    }

    /*----------------------------------------------------------------------------
        %%Function: GridBuilder.formatRepeatingRows
    ----------------------------------------------------------------------------*/
    static formatRepeatingRows(
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

        this.formatRows(sheet, rangeAddresses, height);
    }

    /*----------------------------------------------------------------------------
        %%Function: GridBuilder.formatGridSheetDays
    ----------------------------------------------------------------------------*/
    static formatGridSheetDays(sheet: Excel.Worksheet, colStart: number, days: number)
    {
        this.formatRepeatingColumns(sheet, colStart, 3, 0, 104, days);
        this.formatRepeatingColumns(sheet, colStart, 3, 1, 17.28, days);
        this.formatRepeatingColumns(sheet, colStart, 3, 2, 0.9, days);

        this.formatRepeatingRows(sheet, 9, 2, 0, 15, 300);
        this.formatRepeatingRows(sheet, 9, 2, 1, 1, 300);
    }

    /*----------------------------------------------------------------------------
        %%Function: GridBuilder.buildGridSheet

        build the actual bracket grid sheet
    ----------------------------------------------------------------------------*/
    static async buildGridSheet(ctx: any)
    {
        const colFirstGridColumn: number = 6;

        let sheet: Excel.Worksheet = await Sheets.ensureSheetExists(ctx, GridBuilder.SheetName, null, EnsureSheetPlacement.First);
        let rngHeader: Excel.Range = sheet.getRangeByIndexes(0, colFirstGridColumn, 3, 1);

        rngHeader.formulas = [["=TournamentTitle"], ["=TournamentSubTitle"], ["=TournamentLocation"]]
        rngHeader.format.font.bold = true;
        rngHeader.format.font.size = 26;

        let rngAddress: Excel.Range = sheet.getRangeByIndexes(3, colFirstGridColumn, 1, 1);
        rngAddress.formulas = [["=TournamentAddress"]];
        rngAddress.format.font.italic = true;
        rngAddress.format.font.size = 18;

        let rngBuilding: Excel.Range = sheet.getRangeByIndexes(0, 0, 1, 1);
        rngBuilding.values = [["BUILDING"]];

        this.formatGridSheetDays(sheet, 6, GridBuilder.maxDays);
        this.formatColumns(sheet, ["A:A"], 60);
        this.formatColumns(sheet, ["B:B", "E:E"], 0.9);
        this.formatColumns(sheet, ["C:C"], 104);
        this.formatColumns(sheet, ["D:D"], 17.28);
        this.formatColumns(sheet, ["F:F"], 48);
        this.addDayGridFormulas(sheet, 4, 6, GridBuilder.maxDays);

//        await this.addTipsAndDirections(ctx, sheet);

        sheet.showGridlines = false;
        sheet.activate();
        await ctx.sync();
    }


    static async addTipsAndDirections(ctx: any, sheet: Excel.Worksheet)
    {
        const tips: any[][] =
        [
            ["Hide these columns when you are done building your"],
            ["bracket and are ready to publish. Here are some helpful"],
            ["tips on using BracketBuilder to build your tournament"],
            ["bracket."],
            [""],
            [""],
            [""],
            ["1. The cell at the top (A1) is the \"BUILDING\" cell."],
            [""],
            ["When \"BUILDING\" is in the cell, then every game"],
            [""],
            ["will show the source for the game (W1 or L3, for"],
            [""],
            ["example). Otherwise, it will be blank until the"],
            [""],
            ["bracket starts filling in to that game. Play with"],
            [""],
            ["it."],
            [""],
            [""],
            [""],
            ["2. To change the start date for the tournament,"],
            [""],
            ["ONLY CHANGE the date in G6 to be the first day."],
            [""],
            ["All of the other days will automatically adjust."],
            [""],
            [""],
            [""],
            ["3. To \"automagically\" insert a game, select a cell"],
            [""],
            ["anywhere in the column for the day you want. Its"],
            [""],
            ["better to select a cell at the top of the column, or"],
            [""],
            ["away from other games. Then click the " + " next to"],
            [""],
            ["the game you want to insert."],
            [""],
            [""],
            [""],
            ["4. To manually place a game where you want it, "],
            [""],
            ["select the range where you want the game to be"],
            [""],
            ["and click the " + ".  The game will try to fit there."],
            [""],
            [""],
            [""],
            ["5. If the game looks wrong or is needs \"repaired\","],
            [""],
            ["select a cell inside the game and click the wrench"],
            [""],
            ["icon."],
            [""],
            [""],
            [""],
            ["6. DO NOT merge cells or delete columns or"],
            [""],
            ["rows unless you are sure you aren't going to"],
            [""],
            ["break the pattern."],
            [""],
            [""],
            [""],
            ["7. This grid is carefully constructed to allow lines to"],
            [""],
            ["connect games and create visual affects. You can change"],
            [""],
            ["things like row height and column widths, but don't"],
            [""],
            ["change the pattern."],
            [""],
            ["* Rows are in pairs: a full height for text, and a 1 pixel"],
            [""],
            ["row for lines."],
            [""],
            ["* Columns are in threes:  A wide column for team names,"],
            [""],
            ["a narrow column for game score, and a 1 pixel column"],
            [""],
            ["for lines."]
        ];

        let rng: Excel.Range = sheet.getRangeByIndexes(6, 0, tips.length, 1);
        rng.values = tips;
        rng.format.font.size = 9;
        rng.format.font.name = "Segoe UI";
        await ctx.sync();
    }
}
