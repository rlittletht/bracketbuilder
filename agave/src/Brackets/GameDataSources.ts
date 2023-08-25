
import { BracketDefinition } from "./BracketDefinitions";
import { Sheets, EnsureSheetPlacement } from "../Interop/Sheets";
import { Ranges, RangeInfo } from "../Interop/Ranges";
import { OADate } from "../Interop/Dates";
import { IFastTables } from "../Interop/FastTables";
import { Tables } from "../Interop/Tables";
import { GridBuilder } from "./GridBuilder";
import { GameNum } from "../BracketEditor/GameNum";
import { GlobalDataBuilder } from "./GlobalDataBuilder";
import { UndoGameDataItem } from "../BracketEditor/Undo";
import { JsCtx } from "../Interop/JsCtx";
import { IIntention } from "../Interop/Intentions/IIntention";
import { TnSetValues } from "../Interop/Intentions/TnSetValue";
import { FastFormulaAreas, FastFormulaAreasItems } from "../Interop/FastFormulaAreas";
import { RangeCaches, RangeCacheItemType } from "../Interop/RangeCaches";

export interface TeamNameMap
{
    teamNumber: number;
    name: string;
    priority: number;
}

export class GameDataSources
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
        %%Function: GameDataSources.updateGameInfo

        update the given game information in the GameDataSources table
    ----------------------------------------------------------------------------*/
    static async updateGameInfo(
        context: JsCtx,
        gameNum: GameNum,
        field: any,
        time: any,
        swapHomeAway: any): Promise<IIntention[]>
    {
        const tns = [];

        // find the team names table
        let table: Excel.Table = await GameDataSources.getGameInfoTable(context);

        let range: Excel.Range = table.getDataBodyRange();
        range.load("values, rowCount, rowIndex, columnIndex, columnCount, worksheet");
        await context.sync("UGI values ranges");

        let newValues: any[][] = [];
        for (let i = 0; i < range.rowCount; i++)
        {
            if (range.values[i][0] == gameNum.GameId.Value)
            {
                newValues.push(
                    [
                        gameNum.GameId.Value,
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

        tns.push(TnSetValues.Create(RangeInfo.createFromRange(range), newValues, range.worksheet.name));
//        range.values = newValues;
//        await context.sync();
        return tns;
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
        let table: Excel.Table = await GameDataSources.getGameInfoTable(context);

        let range: Excel.Range = table.getDataBodyRange();
        range.load("values, rowCount");
        await context.sync("UGINS values, rows");

        let newValues: any[][] = [];
        for (let i = 0; i < range.rowCount; i++)
        {
            if (range.values[i][0] == gameNum.GameId.Value)
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
                        gameNum.GameId.Value,
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
        await context.sync("UGINS newVals");
        return undoGameDataItem;
    }

    static tnsUpdateGameInfoIfNotSet(
        context: JsCtx,
        gameNum: GameNum,
        field: any,
        time: any,
        alwaysOverwriteIfGiven: boolean): { undoItem: UndoGameDataItem, tns: IIntention[] }
    {
        let undoGameDataItem: UndoGameDataItem = new UndoGameDataItem(gameNum, undefined, undefined, undefined, undefined);
        const rangeCache = RangeCaches.getCacheByType(RangeCacheItemType.FieldsAndTimesBody);

        if (rangeCache == null)
            throw new Error("caches not setup for tnsUpdateGameInfoIfNotSet");

        const gameInfoAreas = FastFormulaAreas.getFastFormulaAreaCacheForType(context, rangeCache.formulaCacheType);

        if (gameInfoAreas == null)
            throw new Error("caches not setup for tnsUpdateGameInfoIfNotSet");

        const values = gameInfoAreas.getValuesForRangeInfo(rangeCache.rangeInfo);

        let newValues: any[][] = [];
        for (let i = 0; i < values.length; i++)
        {
            if (values[i][0] == gameNum.GameId.Value)
            {
                let newField: string;
                let newTime: number;

                if ((alwaysOverwriteIfGiven || values[i][1] == GlobalDataBuilder.DefaultField)
                    && field[0] != "=")
                {
                    newField = field;
                    undoGameDataItem.fieldNew = field;
                    undoGameDataItem.fieldOriginal = values[i][1];
                }
                else
                {
                    newField = values[i][1];
                }

                if ((alwaysOverwriteIfGiven || values[i][2] == GlobalDataBuilder.DefaultStartTime)
                    && typeof time === "number")
                {
                    newTime = time;
                    undoGameDataItem.startTimeNew = time;
                    undoGameDataItem.startTimeOriginal = values[i][2];
                }
                else
                {
                    newTime = values[i][2];
                }

                newValues.push(
                    [
                        gameNum.GameId.Value,
                        newField,
                        newTime,
                        values[i][3]
                    ]);
                // don't try to be clever and break here -- we still have to push all the
                // other non-matching values
            }
            else
            {
                newValues.push([values[i][0], values[i][1], values[i][2], values[i][3]])
            }
        }

        return { undoItem: undoGameDataItem, tns: [TnSetValues.Create(rangeCache.rangeInfo, newValues, rangeCache.sheetName)] };
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.updateGameDataSourcesTeamNames

        Update the given team names in the bracket sources team names. Its an
        array of maps (and array of [][])
    ----------------------------------------------------------------------------*/
    static async updateGameDataSourcesTeamNames(context: JsCtx, teamNames: TeamNameMap[])
    {
        // find the team names table
        let table: Excel.Table = await GameDataSources.getTeamNameTable(context);

        let range: Excel.Range = table.getDataBodyRange();
        range.load("values, rowCount");
        await context.sync("UBS values, rows");

        // now update the values
        for (let nameMap of teamNames)
        {
            if (nameMap.name == null || nameMap.name == "")
                continue;

            let comp: number = nameMap.teamNumber;

            for (let i = 0; i < range.rowCount; i++)
            {
                if (range.values[i][0] == comp)
                {
                    range.values[i][1] = nameMap.name;
                }
            }
        }

        // we can't update changes in-place, so create a new array
        let newValues: any[][] = [];
        for (let i = 0; i < range.rowCount; i++)
        {
            // if there isn't a priority column defined, then don't push it
            if (range.values[i][2] !== undefined)
                newValues.push([range.values[i][0], range.values[i][1], range.values[i][2]]);
            else
                newValues.push([range.values[i][0], range.values[i][1]]);
        }

        range.values = newValues; // this is what will get picked up

        await context.sync("UBS newvals");
    }

    /*----------------------------------------------------------------------------
        %%Function: GameDataSources.buildGameDataSourcesSheet

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
    static async buildGameDataSourcesSheet(context: JsCtx, fastTables: IFastTables, bracketDefinition: BracketDefinition)
    {
        let sheet: Excel.Worksheet = await Sheets.ensureSheetExists(context, GameDataSources.SheetName, GridBuilder.SheetName, EnsureSheetPlacement.AfterGiven);

        let formulasGameInfo: any[][] = [];
        const gameInfoHeader: any[] = ["GameID", "Field", "Time", "SwapTopBottom"];

        // we get a line for each game
        for (let i: number = 0; i < bracketDefinition.games.length; i++)
        {
            const gameNum: GameNum = new GameNum(i);

            formulasGameInfo.push(
                [
                    gameNum.GameId.Value,
                    GlobalDataBuilder.DefaultField,
                    OADate.OATimeFromMinutes(GlobalDataBuilder.DefaultStartTime),
                    false
                ]);
        }

        let range: Excel.Range = sheet.getRangeByIndexes(0, 0, formulasGameInfo.length, 4);
        range.formulas = formulasGameInfo;
        await context.sync("BBS formulas");

        range = sheet.getRangeByIndexes(0, 2, formulasGameInfo.length, 1);
        range.numberFormat = [["h:mm AM/PM"]];
        await context.sync("BBS new num format");

        await Tables.ensureTableExists(
            context,
            sheet,
            fastTables,
            "BracketSourceData",
            Ranges.addressFromCoordinates([0, 0], [formulasGameInfo.length - 1, 3]),
            gameInfoHeader);

        let formulasTeamNames: any[][] = [];
        const teamNameHeader: any[] = ["Number", "Name", "Priority"];

        for (let i: number = 0; i < bracketDefinition.teamCount; i++)
        {
            formulasTeamNames.push([`${i + 1}`, `Team ${i + 1}`, 0]);
        }

        range = sheet.getRangeByIndexes(formulasGameInfo.length + 3, 0, formulasTeamNames.length, 3);
        range.formulas = formulasTeamNames;

        const rangeFirstColumn = sheet.getRanges("A:A");
        rangeFirstColumn.format.horizontalAlignment = Excel.HorizontalAlignment.left;
        rangeFirstColumn.format.columnWidth = 70;

        const rangeSecondColumn = sheet.getRanges("B:B");
        rangeSecondColumn.format.columnWidth = 128;

        await context.sync("BBS set colwidth");

        await Tables.ensureTableExists(
            context,
            sheet,
            fastTables,
            "TeamNames",
            Ranges.addressFromCoordinates([formulasGameInfo.length + 3, 0], [formulasGameInfo.length + 3 + formulasTeamNames.length - 1, 2]),
            teamNameHeader);
    }
}