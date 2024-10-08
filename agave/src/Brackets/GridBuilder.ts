import { Sheets, EnsureSheetPlacement } from "../Interop/Sheets";
import { Ranges } from "../Interop/Ranges";
import { OADate } from "../Interop/Dates";
import { GameFormatting } from "../BracketEditor/GameFormatting";
import { GlobalDataBuilder } from "./GlobalDataBuilder";
import { JsCtx } from "../Interop/JsCtx";

export class GridBuilder
{
    static SheetName: string = "Games";
    static maxDays: number = 18;

    /*----------------------------------------------------------------------------
        %%Function: GridBuilder.mergeAndFormatDay
    ----------------------------------------------------------------------------*/
    static mergeAndFormatDayRequest(sheet: Excel.Worksheet, row: number, col: number)
    {
        // don't merge the vertical line ranges into the day cells
        const range: Excel.Range = sheet.getRangeByIndexes(row, col, 2, 2);
        range.merge(true);

        const rangeJustDays = sheet.getRangeByIndexes(row, col, 2, 3);

        rangeJustDays.format.horizontalAlignment = Excel.HorizontalAlignment.center;

        rangeJustDays.format.borders.getItem('EdgeTop').style = Excel.BorderLineStyle.continuous;
        rangeJustDays.format.borders.getItem('EdgeTop').weight = Excel.BorderWeight.thick;

        rangeJustDays.format.borders.getItem('EdgeBottom').style = Excel.BorderLineStyle.continuous;
        rangeJustDays.format.borders.getItem('EdgeBottom').weight = Excel.BorderWeight.thick;

        const rangeVerticalLine = sheet.getRangeByIndexes(row, col + 2, 2, 1);

        const rangeJustDay = sheet.getRangeByIndexes(row, col, 1, 1);
        rangeJustDay.numberFormat = [["General"]];

        const rangeJustDate = sheet.getRangeByIndexes(row + 1, col, 1, 1);
        rangeJustDate.numberFormat = [["mmmm d"]];

        GameFormatting.formatConnectingLineRangeRequest(rangeVerticalLine);
    }

    /*----------------------------------------------------------------------------
        %%Function: GridBuilder.pushSingleDayGridFormulas

        push a single day grid set of formulas
    ----------------------------------------------------------------------------*/
    static pushSingleDayGridFormulas(aryFirstRow: any[], arySecondRow: any[], rowIndex: number, col: number)
    {
        aryFirstRow.push(`=TEXT(${Ranges.addressFromCoordinates([rowIndex + 1, col], null)}, "DDDD")`);
        aryFirstRow.push(null);
        aryFirstRow.push(null);
        arySecondRow.push(`=${Ranges.addressFromCoordinates([rowIndex + 1, col - 3], null)} + 1`);
        arySecondRow.push(null);
        arySecondRow.push(null);
    }

    static pushDayGridFormulas(aryFirstRow: any[], arySecondRow: any[], rowIndex: number, colStart: number, days: number)
    {
        // now loop through the rest of the days for the number given
        while (days-- > 0)
        {
            this.pushSingleDayGridFormulas(aryFirstRow, arySecondRow, rowIndex, colStart);
            colStart += 3;
        }
    }

    /*----------------------------------------------------------------------------
        %%Function: GridBuilder.addDayGridStaticAndFormulas

        each day is 3 columns (the team, the score, and the vertical line)
    ----------------------------------------------------------------------------*/
    static async addDayGridStaticAndFormulas(sheet: Excel.Worksheet, firstRowIndex: number, firstColumnIndex: number, days: number)
    {
        if (days <= 1)
            throw new Error("days must be > 1");

        const daysSpan: number = days * 3;

        let rng: Excel.Range = sheet.getRangeByIndexes(firstRowIndex, firstColumnIndex, 2, daysSpan);
        let ary: any[][] = [];

        let col: number = firstColumnIndex;

        let aryFirstRow: any[] = [];
        let arySecondRow: any[] = [];

        // first, we have a static day
        aryFirstRow.push(`=TEXT(${Ranges.addressFromCoordinates([firstRowIndex + 1, col], null)}, "DDDD")`);
        aryFirstRow.push(null);
        aryFirstRow.push(null);
        arySecondRow.push(OADate.ToOADate(new Date(Date.parse("6/15/2024"))) - (7 / 24));
        arySecondRow.push(null);
        arySecondRow.push(null);

        this.pushDayGridFormulas(aryFirstRow, arySecondRow, firstRowIndex, col + 3, days - 1);

        ary.push(aryFirstRow);
        ary.push(arySecondRow);

        rng.formulas = ary;

        rng = sheet.getRangeByIndexes(firstRowIndex + 1, firstColumnIndex, 1, daysSpan - 1);
        rng.numberFormat = [["mmmm d"]];

        // now merge and format the cells
        col = firstColumnIndex;
        // and add a left border just for our first day
        const rangeJustDays = sheet.getRangeByIndexes(firstRowIndex, firstColumnIndex, 2, 1);

        rangeJustDays.format.borders.getItem('EdgeLeft').style = Excel.BorderLineStyle.continuous;
        rangeJustDays.format.borders.getItem('EdgeLeft').weight = Excel.BorderWeight.thick;

        while (col < firstColumnIndex + daysSpan)
        {
            this.mergeAndFormatDayRequest(sheet, firstRowIndex, col);
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
        this.formatRepeatingColumns(sheet, colStart, 3, 0, 113, days);
        this.formatRepeatingColumns(sheet, colStart, 3, 1, 17.28, days);
        this.formatRepeatingColumns(sheet, colStart, 3, 2, 0.9, days);

        this.formatRepeatingRows(sheet, 9, 2, 0, 15, 300);
        this.formatRepeatingRows(sheet, 9, 2, 1, 1, 300);
    }

    /*----------------------------------------------------------------------------
        %%Function: GridBuilder.buildGridSheet

        build the actual bracket grid sheet
    ----------------------------------------------------------------------------*/
    static async buildGridSheet(context: JsCtx)
    {
        const colFirstGridColumn: number = 3;

        let sheet: Excel.Worksheet = await Sheets.ensureSheetExists(context, GridBuilder.SheetName, null, EnsureSheetPlacement.First);
        let rngHeader: Excel.Range = sheet.getRangeByIndexes(0, colFirstGridColumn, 3, 1);

        rngHeader.formulas = [["=IF(LEN(TournamentTitle)>0,TournamentTitle,\"\")"], ["=IF(LEN(TournamentSubTitle)>0,TournamentSubTitle,\"\")"], ["=IF(LEN(TournamentLocation)>0,TournamentLocation,\"\")"]];
        rngHeader.format.font.bold = true;
        rngHeader.format.font.size = 26;

        let rngAddress: Excel.Range = sheet.getRangeByIndexes(3, colFirstGridColumn, 1, 1);
        rngAddress.formulas = [["=TournamentAddress"]];
        rngAddress.format.font.italic = true;
        rngAddress.format.font.size = 18;

        let rngBuilding: Excel.Range = sheet.getRangeByIndexes(0, 0, 1, 1);
        rngBuilding.values = [["BUILDING"]];

        this.formatGridSheetDays(sheet, 3, GridBuilder.maxDays);
        this.formatColumns(sheet, ["A:A"], 60);
        this.formatColumns(sheet, ["B:B"], 256);
        this.formatColumns(sheet, ["C:C"], 32);
        this.addDayGridStaticAndFormulas(sheet, 4, 3, GridBuilder.maxDays);

        await GlobalDataBuilder.addGlobalDataToSheet(context, sheet, 11);
//        await this.addTipsAndDirections(context, sheet);

        sheet.showGridlines = false;
        sheet.activate();
        await context.sync();
    }


    static async addTipsAndDirections(context: JsCtx, sheet: Excel.Worksheet)
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
        await context.sync();
    }
}
