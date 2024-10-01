
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
import { FastFormulaAreas, FastFormulaAreasItems } from "../Interop/FastFormulaAreas/FastFormulaAreas";
import { RangeCaches, RangeCacheItemType } from "../Interop/RangeCaches";
import { BracketManager } from "./BracketManager";
import { BracketDefBuilder } from "./BracketDefBuilder";
import { TestResult } from "../Support/TestResult";
import { TestRunner } from "../Support/TestRunner";
import { IAppContext } from "../AppContext/AppContext";
import { StreamWriter } from "../Support/StreamWriter";
import { s_staticConfig } from "../StaticConfig";
import { IBracketDefinitionData } from "./IBracketDefinitionData";

export interface TeamNameMap
{
    teamId: string;
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

    static compareNumberedItems(left: string, right: string): number
    {
        if (left == right)
            return 0;

        // see if there's a trailing number, split into two parts
        const ichLastSpaceLeft = left.lastIndexOf(" ");
        const ichLastSpaceRight = right.lastIndexOf(" ");

        if (ichLastSpaceLeft == -1 || ichLastSpaceRight == -1)
            return left < right ? -1 : 1;

        const leftPart2 = left.substring(ichLastSpaceLeft + 1);
        const rightPart2 = right.substring(ichLastSpaceRight + 1);

        const leftNum = +leftPart2;
        const rightNum = +rightPart2;

        if (isNaN(leftNum) || isNaN(rightNum))
            return left < right ? -1 : 1;

        const leftPart1 = left.substring(0, ichLastSpaceLeft);
        const rightPart1 = right.substring(0, ichLastSpaceRight);

        if (leftPart1 != rightPart1)
            return leftPart1 < rightPart1 ? -1 : 1;

        return leftNum - rightNum;
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

        const { range: dataRange, values: dataValues } = RangeCaches.getDataRangeAndValuesFromRangeCacheType(context, RangeCacheItemType.FieldsAndTimesBody);

        if (dataRange)
        {
            for (let row = 0; row < dataRange.RowCount; row++)
            {
                if (dataValues[row][0] == gameNum.GameId.Value)
                {
                    tns.push(
                        TnSetValues.Create(
                            dataRange.offset(row, 1, 0, 4),
                            [
                                [
                                    gameNum.GameId.Value,
                                    field[0] == "=" ? dataValues[row][1] : field,
                                    typeof time !== "number" ? dataValues[row][2] : time,
                                    typeof swapHomeAway !== "boolean" ? dataValues[row][3] : swapHomeAway
                                ]
                            ],
                            GameDataSources.SheetName));
                }
            }

            return tns;
        }

        if (s_staticConfig.throwOnCacheMisses)
        {
            debugger;
            throw new Error("cache miss on updateGameInfo");
        }

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
                newValues.push(null);
            }
        }

        // now create tns for just the range we really want to set

        const tns: IIntention[] = [];

        for (let row = rangeCache.rangeInfo.FirstRow; row <= rangeCache.rangeInfo.LastRow; row++)
        {
            const iValue = row - rangeCache.rangeInfo.FirstRow;

            if (newValues[iValue] !== null)
            {
                const valueRange = rangeCache.rangeInfo.offset(iValue, 1, 0, rangeCache.rangeInfo.ColumnCount);
                tns.push(TnSetValues.Create(valueRange, [newValues[iValue]], rangeCache.sheetName));
            }
        }

        return { undoItem: undoGameDataItem, tns: tns };
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.updateGameDataSourcesTeamNames

        Update the given team names in the bracket sources team names. Its an
        array of maps (and array of [][])
    ----------------------------------------------------------------------------*/
    static async updateGameDataSourcesTeamNames(context: JsCtx, teamNames: TeamNameMap[]): Promise<IIntention[]>
    {
        const tns = [];

        const rangeTeamNames = RangeCaches.getCacheByType(RangeCacheItemType.TeamNamesBody);

        if (rangeTeamNames)
        {
            const areas = FastFormulaAreas.getFastFormulaAreaCacheForType(context, rangeTeamNames.formulaCacheType);
            if (areas)
            {
                const dataRange = rangeTeamNames.rangeInfo;
                const dataValues = areas.getValuesForRangeInfo(dataRange);

                for (let nameMap of teamNames)
                {
                    if (nameMap.name == null || nameMap.name == "")
                        continue;

                    const comp = nameMap.teamId.toUpperCase();

                    for (let row = 0; row < dataRange.RowCount; row++)
                    {
                        if (dataValues[row][0].toUpperCase() == comp)
                        {
                            tns.push(TnSetValues.Create(
                                dataRange.offset(row, 1, 0, 2),
                                [
                                    [
                                        dataValues[row][0],
                                        nameMap.name
                                    ]
                                ],
                                GameDataSources.SheetName));
                        }
                    }
                }

                return tns;
            }
        }

        if (s_staticConfig.throwOnCacheMisses)
        {
            debugger;
            throw new Error("cache miss on updateGameDataSourcesTeamNames");
        }

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

            let comp: string = nameMap.teamId.toUpperCase();

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
            // if there isn't a priority column defined, then don't push it
            if (range.values[i][2] !== undefined)
                newValues.push([range.values[i][0], range.values[i][1], range.values[i][2]]);
            else
                newValues.push([range.values[i][0], range.values[i][1]]);
        }

        tns.push(TnSetValues.Create(RangeInfo.createFromRange(range), newValues, range.worksheet.name));
        return tns;
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
    static async buildGameDataSourcesSheet(context: JsCtx, fastTables: IFastTables, bracketDefinition: IBracketDefinitionData)
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
        const teamNameHeader: any[] = ["ID", "Name", "Priority", "Seed"];

        const teamNameMap = new Map<string, TeamNameMap>();
        const teamNames = BracketDefBuilder.getTeamSeedNames(bracketDefinition);

        teamNames.sort(
            (left: { team: string, seed: string }, right: { team: string, seed: string }) =>
            {
                return GameDataSources.compareNumberedItems(left.team, right.team);
            });
        
        for (let i: number = 0; i < teamNames.length; i++)
        {
            formulasTeamNames.push([`${teamNames[i].team}`, `Team ${i + 1}`, 0, `${teamNames[i].seed}`]);
        }

        range = sheet.getRangeByIndexes(formulasGameInfo.length + 3, 0, formulasTeamNames.length, 4);
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
            Ranges.addressFromCoordinates([formulasGameInfo.length + 3, 0], [formulasGameInfo.length + 3 + formulasTeamNames.length - 1, 3]),
            teamNameHeader);
    }
}

export class GameDataSourcesTests
{
    static test_noNumberedItem_Equal(result: TestResult)
    {
        const expected = 0;
        const left = "item1";
        const right = "item1";

        result.assertIsEqual(expected, GameDataSources.compareNumberedItems(left, right));
    }

    static test_noNumberedItem_Greater(result: TestResult)
    {
        const expected = 1;
        const left = "item2";
        const right = "item1";

        result.assertIsEqual(expected, GameDataSources.compareNumberedItems(left, right));
    }

    static test_noNumberedItem_Less(result: TestResult)
    {
        const expected = -1;
        const left = "item1";
        const right = "item2";

        result.assertIsEqual(expected, GameDataSources.compareNumberedItems(left, right));
    }

    static test_noNumberedItem_WithNotNumberedPart2_Greater(result: TestResult)
    {
        const expected = 1;
        const left = "item3";
        const right = "item2 p1";

        result.assertIsEqual(expected, GameDataSources.compareNumberedItems(left, right));
    }

    static test_noNumberedItem_WithNotNumberedPart2_Less(result: TestResult)
    {
        const expected = -1;
        const left = "item1";
        const right = "item1 p1";

        result.assertIsEqual(expected, GameDataSources.compareNumberedItems(left, right));
    }

    static test_noNumberedItem_withNumberedItem_Less(result: TestResult)
    {
        const expected = -1;
        const left = "item11";
        const right = "item2 1";

        result.assertIsEqual(expected, GameDataSources.compareNumberedItems(left, right));
    }

    static test_noNumberedItem_withNumberedItem_Greater(result: TestResult)
    {
        const expected = 1;
        const left = "item2";
        const right = "item1 1";

        result.assertIsEqual(expected, GameDataSources.compareNumberedItems(left, right));
    }

    static test_numberedItem_withNoNumberedItem_Less(result: TestResult)
    {
        const expected = -1;
        const left = "item1 1";
        const right = "item2";

        result.assertIsEqual(expected, GameDataSources.compareNumberedItems(left, right));
    }

    static test_numberedItem_withNoNumberedItem_Greater(result: TestResult)
    {
        const expected = 1;
        const left = "item2 1";
        const right = "item1";

        result.assertIsEqual(expected, GameDataSources.compareNumberedItems(left, right));
    }

    static test_numberedItems_LessAscii(result: TestResult)
    {
        const expected = -1;
        const left = "item 1";
        const right = "item 2";

        result.assertIsEqual(expected, GameDataSources.compareNumberedItems(left, right));
    }

    static test_numberedItems_LessAscii_BiggerDiff(result: TestResult)
    {
        const expected = -9;
        const left = "item 1";
        const right = "item 10";

        result.assertIsEqual(expected, GameDataSources.compareNumberedItems(left, right));
    }

    static test_numberedItems_GreaterAscii(result: TestResult)
    {
        const expected = 1;
        const left = "item 2";
        const right = "item 1";

        result.assertIsEqual(expected, GameDataSources.compareNumberedItems(left, right));
    }

    static test_numberedItems_LessNonAscii(result: TestResult)
    {
        const expected = -8;
        const left = "item 2";
        const right = "item 10";

        result.assertIsEqual(expected, GameDataSources.compareNumberedItems(left, right));
    }

    static test_numberedItems_GreaterNonAscii(result: TestResult)
    {
        const expected = 8;
        const left = "item 10";
        const right = "item 2";

        result.assertIsEqual(expected, GameDataSources.compareNumberedItems(left, right));
    }

    static test_numberedItems_LessBase_GreaterNumber(result: TestResult)
    {
        const expected = -1;
        const left = "item1 10";
        const right = "item2 2";

        result.assertIsEqual(expected, GameDataSources.compareNumberedItems(left, right));
    }

    static test_numberedItems_GreaterBase_GreaterNumber(result: TestResult)
    {
        const expected = 1;
        const left = "item2 10";
        const right = "item1 2";

        result.assertIsEqual(expected, GameDataSources.compareNumberedItems(left, right));
    }

    static test_numberedItems_LessBase_LessNumber(result: TestResult)
    {
        const expected = -1;
        const left = "item1 1";
        const right = "item2 2";

        result.assertIsEqual(expected, GameDataSources.compareNumberedItems(left, right));
    }

    static test_numberedItems_GreaterBase_LessNumber(result: TestResult)
    {
        const expected = 1;
        const left = "item2 1";
        const right = "item1 2";

        result.assertIsEqual(expected, GameDataSources.compareNumberedItems(left, right));
    }

    static test_numberedItems_Equal(result: TestResult)
    {
        const expected = 0;
        const left = "item 1";
        const right = "item 1";

        result.assertIsEqual(expected, GameDataSources.compareNumberedItems(left, right));
    }

    static runAllTests(appContext: IAppContext, outStream: StreamWriter)
    {
        TestRunner.runAllTests(this, TestResult, appContext, outStream);
    }
}