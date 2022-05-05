
import { BracketDefinition, GameDefinition } from "./BracketDefinitions";
import { Sheets } from "../Interop/Sheets";
import { Ranges } from "../Interop/Ranges";
import { OADate } from "../Interop/Dates";
import { IFastTables } from "../Interop/FastTables";
import { Tables } from "../Interop/Tables";

export interface TeamNameMap
{
    teamNum: string;
    name: string;
}

export class BracketSources
{
    static async getTeamNameTable(ctx: any): Promise<Excel.Table>
    {
        return await Tables.getTableOrNull(ctx, null, "TeamNames");
    }

    static async getGameInfoTable(ctx: any): Promise<Excel.Table>
    {
        return await Tables.getTableOrNull(ctx, null, "BracketSourceData");
    }

    /*----------------------------------------------------------------------------
        %%Function: BracketSources.updateGameInfo

        update the given game information in the bracketsourcedata table
    ----------------------------------------------------------------------------*/
    static async updateGameInfo(ctx: any, gameNum: number, field: any, time: any, swapHomeAway: boolean)
    {
        // find the team names table
        let table: Excel.Table = await BracketSources.getGameInfoTable(ctx);

        let range: Excel.Range = table.getDataBodyRange();
        range.load("values, rowCount");
        await ctx.sync();

        let newValues: any[][] = [];
        for (let i = 0; i < range.rowCount; i++)
        {
            if (range.values[i][0] == gameNum)
            {
                newValues.push(
                    [
                        gameNum, field[0] == "=" ? range.values[i][1] : field,
                        typeof time !== "number" ? range.values[i][2] : time, swapHomeAway
                    ]);
            }
            else
            {
                newValues.push([range.values[i][0], range.values[i][1], range.values[i][2], range.values[i][3]])
            }
        }

        range.values = newValues;
        await ctx.sync();
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.updateBracketSourcesTeamNames

        Update the given team names in the bracket sources team names. Its an
        array of maps (and array of [][])
    ----------------------------------------------------------------------------*/
    static async updateBracketSourcesTeamNames(ctx: any, teamNames: TeamNameMap[])
    {
        // find the team names table
        let table: Excel.Table = await BracketSources.getTeamNameTable(ctx);

        let range: Excel.Range = table.getDataBodyRange();
        range.load("values, rowCount");
        await ctx.sync();

        // now update the values
        for (let nameMap of teamNames)
        {
            if (nameMap.name == null || nameMap.name == "")
                continue;

            let comp: string = nameMap.teamNum.toUpperCase();

            for (let i = 0; i < range.rowCount; i++)
            {
                if (range.values[i][0].toUpperCase() == comp)
                {
                    range.values[i][1] = nameMap.name;
                }
            }
        }

        // we can't update changes in-place, so create a new array
        let newValues: any[][] = [];
        for (let i = 0; i < range.rowCount; i++)
        {
            newValues.push([range.values[i][0], range.values[i][1]]);
        }

        range.values = newValues; // this is what will get picked up

        await ctx.sync();
    }

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