
import { BracketDefinition, GameDefinition } from "./BracketDefinitions";
import { Sheets } from "../Interop/Sheets";
import { Ranges } from "../Interop/Ranges";
import { OADate } from "../Interop/Dates";
import { IFastTables } from "../Interop/FastTables";
import { Tables } from "../Interop/Tables";

export class BracketSources
{
    /*----------------------------------------------------------------------------
        %%Function: BracketDataBuilder.buildBracketDataSheet

        Build the bracket sources sheet. This is the durable source of data for
        the bracket grid. On creation it has the default values for populating
        volatile data in the sheet (including field info, time, team names,
        and home/away swap info)

        There are two tables on this sheet:

        1) Each game has field/time/homeAwaySwap info
        2) Each team number has a team name associated

        When games are inserted onto the grid, they get formulas pointing into
        this sheet. If someone subsequently edits the grid, that will overwrite
        the formula. If the game is penned later, then the any statically
        typed text will get pushed back into this sheet (so a later insert of the
        game will get the updated info)

        This also removes the need for a pen.

        NOTE: The BracketData sheet (which summarizes all the results and game
        info) will pull data from the bracket grid -- this way we always get the
        most up-to-date info, even if it hasn't been pushed back to this bracket
        source sheet.
    ----------------------------------------------------------------------------*/
    static async buildBracketSourcesSheet(ctx: any, fastTables: IFastTables, bracketDefinition: BracketDefinition)
    {
        let sheet: Excel.Worksheet = await Sheets.ensureSheetExists(ctx, "BracketSources");

        let formulasGameInfo: any[][] = [];
        const gameInfoHeader: any[] = ["GameNum", "Field", "Time", "SwapTopBottom"];

        // we get a line for each game
        for (let i: number = 0; i < bracketDefinition.games.length; i++)
        {
            formulasGameInfo.push([i, "Field #1", OADate.OATimeFromMinutes(18 * 60), false]);
        }

        let range: Excel.Range = sheet.getRangeByIndexes(0, 0, formulasGameInfo.length, 4);
        range.formulas = formulasGameInfo;
        await ctx.sync();

        range = sheet.getRangeByIndexes(0, 2, formulasGameInfo.length, 1);
        range.numberFormat = [["h:mm AM/PM"]];
        await ctx.sync();

        await Tables.ensureTableExists(
            ctx,
            sheet,
            fastTables,
            "BracketSourceData",
            Ranges.addressFromCoordinates([0, 0], [formulasGameInfo.length - 1, 3]),
            gameInfoHeader);

        let formulasTeamNames: any[][] = [];
        const teamNameHeader: any[] = ["TeamNum", "TeamName"];

        for (let i: number = 0; i < bracketDefinition.teamCount; i++)
        {
            formulasTeamNames.push([`Team ${i + 1}`, `Team ${i + 1}`]);
        }

        range = sheet.getRangeByIndexes(formulasGameInfo.length + 3, 0, formulasTeamNames.length, 2);
        range.formulas = formulasTeamNames;
        await ctx.sync();

        await Tables.ensureTableExists(
            ctx,
            sheet,
            fastTables,
            "TeamNames",
            Ranges.addressFromCoordinates([formulasGameInfo.length + 3, 0], [formulasGameInfo.length + 3 + formulasTeamNames.length - 1, 1]),
            teamNameHeader);
    }
}