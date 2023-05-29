
import { BracketDefinition, GameDefinition } from "./BracketDefinitions";
import { Sheets, EnsureSheetPlacement } from "../Interop/Sheets";
import { Ranges } from "../Interop/Ranges";
import { OADate } from "../Interop/Dates";
import { IFastTables } from "../Interop/FastTables";
import { Tables } from "../Interop/Tables";
import { GridBuilder } from "./GridBuilder";
import { GameNum } from "../BracketEditor/GameNum";
import { GlobalDataBuilder } from "./GlobalDataBuilder";
import { UndoGameDataItem } from "../BracketEditor/Undo";
import { JsCtx } from "../Interop/JsCtx";

export interface TeamNameMap
{
    teamNum: string;
    name: string;
    priority: number;
}

export class BracketSources
{
    static SheetName: string = "TeamsAndFields";

    static async getTeamNameTable(context: JsCtx): Promise<Excel.Table>
    {
        return await Tables.getTableOrNull(context, null, "TeamNames");
    }

    static async getGameInfoTable(context: JsCtx): Promise<Excel.Table>
    {
        return await Tables.getTableOrNull(context, null, "BracketSourceData");
    }

    /*----------------------------------------------------------------------------
        %%Function: BracketSources.updateGameInfo

        update the given game information in the bracketsourcedata table
    ----------------------------------------------------------------------------*/
    static async updateGameInfo(
        context: JsCtx,
        gameNum: GameNum,
        field: any,
        time: any,
        swapHomeAway: any)
    {
        // find the team names table
        let table: Excel.Table = await BracketSources.getGameInfoTable(context);

        let range: Excel.Range = table.getDataBodyRange();
        range.load("values, rowCount");
        await context.sync();

        let newValues: any[][] = [];
        for (let i = 0; i < range.rowCount; i++)
        {
            if (range.values[i][0] == gameNum.Value)
            {
                newValues.push(
                    [
                        gameNum.Value,
                        field[0] == "=" ? range.values[i][1] : field,
                        typeof time !== "number" ? range.values[i][2] : time,
                        typeof swapHomeAway !== "boolean" ? range.values[i][3] : swapHomeAway
                    ]);
            }
            else
            {
                newValues.push([range.values[i][0], range.values[i][1], range.values[i][2], range.values[i][3]])
            }
        }

        range.values = newValues;
        await context.sync();
    }

    static async updateGameInfoIfNotSet(
        context: JsCtx,
        gameNum: GameNum,
        field: any,
        time: any,
        alwaysOverwriteIfGiven: boolean): Promise<UndoGameDataItem>
    {
        let undoGameDataItem: UndoGameDataItem = new UndoGameDataItem(gameNum, undefined, undefined, undefined, undefined);

        // find the team names table
        let table: Excel.Table = await BracketSources.getGameInfoTable(context);

        let range: Excel.Range = table.getDataBodyRange();
        range.load("values, rowCount");
        await context.sync();

        let newValues: any[][] = [];
        for (let i = 0; i < range.rowCount; i++)
        {
            if (range.values[i][0] == gameNum.Value)
            {
                let newField: string;
                let newTime: number;

                if ((alwaysOverwriteIfGiven || range.values[i][1] == GlobalDataBuilder.DefaultField)
                    && field[0] != "=")
                {
                    newField = field;
                    undoGameDataItem.fieldNew = field;
                    undoGameDataItem.fieldOriginal = range.values[i][1];
                }
                else
                {
                    newField = range.values[i][1];
                }

                if ((alwaysOverwriteIfGiven || range.values[i][2] == GlobalDataBuilder.DefaultStartTime)
                    && typeof time === "number")
                {
                    newTime = time;
                    undoGameDataItem.startTimeNew = time;
                    undoGameDataItem.startTimeOriginal = range.values[i][2];
                }
                else
                {
                    newTime = range.values[i][2];
                }

                newValues.push(
                    [
                        gameNum.Value,
                        newField,
                        newTime,
                        range.values[i][3]
                    ]);
                // don't try to be clever and break here -- we still have to push all the
                // other non-matching values
            }
            else
            {
                newValues.push([range.values[i][0], range.values[i][1], range.values[i][2], range.values[i][3]])
            }
        }

        range.values = newValues;
        await context.sync();
        return undoGameDataItem;
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.updateBracketSourcesTeamNames

        Update the given team names in the bracket sources team names. Its an
        array of maps (and array of [][])
    ----------------------------------------------------------------------------*/
    static async updateBracketSourcesTeamNames(context: JsCtx, teamNames: TeamNameMap[])
    {
        // find the team names table
        let table: Excel.Table = await BracketSources.getTeamNameTable(context);

        let range: Excel.Range = table.getDataBodyRange();
        range.load("values, rowCount");
        await context.sync();

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
            newValues.push([range.values[i][0], range.values[i][1], range.values[i][2]]);
        }

        range.values = newValues; // this is what will get picked up

        await context.sync();
    }

    /*----------------------------------------------------------------------------
        %%Function: BracketSources.buildBracketSourcesSheet

        Build the bracket sources sheet. This is the durable source of data for
        the bracket grid. On creation it has the default values for populating
        volatile data in the sheet (including field info, time, team names,
        and home/away swap info)

        There are two tables on this sheet:

        1) Each game has field/time/homeAwaySwap info
        2) Each team number has a team name associated and a 'priority'

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
    static async buildBracketSourcesSheet(context: JsCtx, fastTables: IFastTables, bracketDefinition: BracketDefinition)
    {
        let sheet: Excel.Worksheet = await Sheets.ensureSheetExists(context, BracketSources.SheetName, GridBuilder.SheetName, EnsureSheetPlacement.AfterGiven);

        let formulasGameInfo: any[][] = [];
        const gameInfoHeader: any[] = ["GameNum", "Field", "Time", "SwapTopBottom"];

        // we get a line for each game
        for (let i: number = 0; i < bracketDefinition.games.length; i++)
        {
            formulasGameInfo.push(
                [
                    i,
                    GlobalDataBuilder.DefaultField,
                    OADate.OATimeFromMinutes(GlobalDataBuilder.DefaultStartTime),
                    false
                ]);
        }

        let range: Excel.Range = sheet.getRangeByIndexes(0, 0, formulasGameInfo.length, 4);
        range.formulas = formulasGameInfo;
        await context.sync();

        range = sheet.getRangeByIndexes(0, 2, formulasGameInfo.length, 1);
        range.numberFormat = [["h:mm AM/PM"]];
        await context.sync();

        await Tables.ensureTableExists(
            context,
            sheet,
            fastTables,
            "BracketSourceData",
            Ranges.addressFromCoordinates([0, 0], [formulasGameInfo.length - 1, 3]),
            gameInfoHeader);

        let formulasTeamNames: any[][] = [];
        const teamNameHeader: any[] = ["TeamNum", "TeamName", "Priority"];

        for (let i: number = 0; i < bracketDefinition.teamCount; i++)
        {
            formulasTeamNames.push([`Team ${i + 1}`, `Team ${i + 1}`, 1]);
        }

        range = sheet.getRangeByIndexes(formulasGameInfo.length + 3, 0, formulasTeamNames.length, 3);
        range.formulas = formulasTeamNames;
        await context.sync();

        await Tables.ensureTableExists(
            context,
            sheet,
            fastTables,
            "TeamNames",
            Ranges.addressFromCoordinates([formulasGameInfo.length + 3, 0], [formulasGameInfo.length + 3 + formulasTeamNames.length - 1, 2]),
            teamNameHeader);
    }
}