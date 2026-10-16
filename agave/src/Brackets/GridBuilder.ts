import { Sheets, EnsureSheetPlacement } from "../Interop/Sheets";
import { RangeInfo, Ranges } from "../Interop/Ranges";
import { OADate } from "../Interop/Dates";
import { GameFormatting } from "../BracketEditor/GameFormatting";
import { GlobalDataBuilder } from "./GlobalDataBuilder";
import { JsCtx } from "../Interop/JsCtx";
import { TnSetColumnWidth } from "../Interop/Intentions/TnSetColumnWidth";
import { TnSetRowHeight } from "../Interop/Intentions/TnSetRowHeight";
import { Intentions } from "../Interop/Intentions/Intentions";
import { IIntention } from "../Interop/Intentions/IIntention";
import { TnSetFormulas } from "../Interop/Intentions/TnSetFormula";
import { TnSetFontBold } from "../Interop/Intentions/TnSetFontBold";
import { TnSetFontInfo } from "../Interop/Intentions/TnSetFontInfo";
import { TnSetFontItalic } from "../Interop/Intentions/TnSetFontItalic";
import { TnSetNumberFormat } from "../Interop/Intentions/TnSetNumberFormat";
import { TnMergeRange } from "../Interop/Intentions/TnMergeRange";
import { TnSetHorizontalAlignment } from "../Interop/Intentions/TnSetHorizontalAlignment";

export class GridBuilder
{
    static SheetName: string = "Games";
    static maxDays: number = 18;
    static maxGameRowGroups: number = 300;

    /*----------------------------------------------------------------------------
        %%Function: GridBuilder.mergeAndFormatDay
    ----------------------------------------------------------------------------*/
    static tnsMergeAndFormatDayRequest(row: number, col: number): IIntention[]
    {
        const tns: IIntention[] = [];

        // don't merge the vertical line ranges into the day cells
        const range = new RangeInfo(row, 2, col, 2);
        tns.push(TnMergeRange.Create(range, true));

        const rangeJustDays = new RangeInfo(row, 2, col, 3);

        tns.push(TnSetHorizontalAlignment.Create(rangeJustDays, Excel.HorizontalAlignment.center));

//        rangeJustDays.format.borders.getItem('EdgeTop').style = Excel.BorderLineStyle.continuous;
//        rangeJustDays.format.borders.getItem('EdgeTop').weight = Excel.BorderWeight.thick;

//        rangeJustDays.format.borders.getItem('EdgeBottom').style = Excel.BorderLineStyle.continuous;
//        rangeJustDays.format.borders.getItem('EdgeBottom').weight = Excel.BorderWeight.thick;

        const rangeVerticalLine = new RangeInfo(row, 2, col + 2, 1);

        const rangeJustDay = new RangeInfo(row, 1, col, 1);
        tns.push(TnSetNumberFormat.Create(rangeJustDay, [["General"]]));

        const rangeJustDate = new RangeInfo(row + 1, 1, col, 1);
        tns.push(TnSetNumberFormat.Create(rangeJustDate, [["mmmm d"]]));

        tns.push(...GameFormatting.tnsFormatConnectingLineRangeRequest(rangeVerticalLine));
        return tns;
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
    static tnsAddDayGridStaticAndFormulas(sheet: string, firstRowIndex: number, firstColumnIndex: number, days: number): IIntention[]
    {
        const tns: IIntention[] = [];

        if (days <= 1)
            throw new Error("days must be > 1");

        const daysSpan: number = days * 3;

        const range = new RangeInfo(firstRowIndex, 2, firstColumnIndex, daysSpan);
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

        tns.push(TnSetFormulas.Create(range, ary, sheet));

        const rangeDates = new RangeInfo(firstRowIndex + 1, 1, firstColumnIndex, daysSpan - 1);
        tns.push(TnSetNumberFormat.Create(rangeDates, [["mmmm d"]], sheet));

        // now merge and format the cells
        col = firstColumnIndex;

        while (col < firstColumnIndex + daysSpan)
        {
            tns.push(...this.tnsMergeAndFormatDayRequest(firstRowIndex, col));
            col += 3;
        }
        return tns;
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

    static tnsFormatGridSheetDays(colStart: number, days: number, rowStart: number, rows: number): IIntention[]
    {
        const tns: IIntention[] = [];

        const columnRange = new RangeInfo(0, 1, colStart, 1);

        tns.push(TnSetColumnWidth.Create(columnRange, 113, days, 2));
        tns.push(TnSetColumnWidth.Create(columnRange.offset(0,1,1,1), 17.28, days, 2));
        tns.push(TnSetColumnWidth.Create(columnRange.offset(0, 1, 2, 1), 0.9, days, 2));

        const rowRange = new RangeInfo(rowStart, 1, 0, 1);
        tns.push(TnSetRowHeight.Create(rowRange, 15, rows, 1));
        tns.push(TnSetRowHeight.Create(rowRange.offset(1, 1, 0, 1), 1, rows, 1));

        return tns;
    }

    /*----------------------------------------------------------------------------
        %%Function: GridBuilder.buildGridSheet

        build the actual bracket grid sheet
    ----------------------------------------------------------------------------*/
    static async buildGridSheet(context: JsCtx)
    {
        const intentions: Intentions = new Intentions();
        const colFirstGridColumn: number = 3;
        let row = 0;

        let sheet: Excel.Worksheet = await Sheets.ensureSheetExists(context, GridBuilder.SheetName, null, EnsureSheetPlacement.First);
        const header = new RangeInfo(row, 3, colFirstGridColumn, 1);

        const headerFormulas: any[][] = [["=IF(LEN(TournamentTitle)>0,TournamentTitle,\"\")"], ["=IF(LEN(TournamentSubTitle)>0,TournamentSubTitle,\"\")"], ["=IF(LEN(TournamentLocation)>0,TournamentLocation,\"\")"]];

        intentions.Add(TnSetFormulas.Create(header, headerFormulas, GridBuilder.SheetName));

        intentions.Add(TnSetFontBold.Create(header, true, GridBuilder.SheetName));
        intentions.Add(TnSetFontInfo.Create(header, null, 26, GridBuilder.SheetName));

        row += 3;
        const address = new RangeInfo(row, 1, colFirstGridColumn, 1);
        intentions.Add(TnSetFormulas.Create(address, [["=TournamentAddress"]], GridBuilder.SheetName));
        intentions.Add(TnSetFontInfo.Create(address, null, 18, GridBuilder.SheetName));
        intentions.Add(TnSetFontItalic.Create(address, true, GridBuilder.SheetName));

        const building = new RangeInfo(0, 1, 0, 1);
        intentions.Add(TnSetFormulas.Create(building, [["BUILDING"]], GridBuilder.SheetName));

        intentions.Add(TnSetColumnWidth.Create(new RangeInfo(0, 1, 0, 1), 60));
        intentions.Add(TnSetColumnWidth.Create(new RangeInfo(0, 1, 1, 1), 256));
        intentions.Add(TnSetColumnWidth.Create(new RangeInfo(0, 1, 2, 1), 32));

        intentions.AddTns(this.tnsAddDayGridStaticAndFormulas(GridBuilder.SheetName, 4, 3, GridBuilder.maxDays));

        intentions.AddTns(await GlobalDataBuilder.tnsAddGlobalDataToSheet(context, GridBuilder.SheetName, 11));
//        await this.addTipsAndDirections(context, sheet);


        intentions.AddTns(this.tnsFormatGridSheetDays(colFirstGridColumn, GridBuilder.maxDays, 9, GridBuilder.maxGameRowGroups));

        await intentions.Execute(context);
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
