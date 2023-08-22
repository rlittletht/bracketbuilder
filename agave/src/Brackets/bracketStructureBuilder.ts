
import { Sheets, EnsureSheetPlacement } from "../Interop/Sheets";
import { BracketDefinition, GameDefinition, s_brackets, BracketManager, _bracketManager, TeamPlacement } from "./BracketDefinitions";
import { Tables } from "../Interop/Tables";
import { IFastTables } from "../Interop/FastTables";
import { Ranges } from "../Interop/Ranges";
import { IAppContext } from "../AppContext/AppContext";
import { SetupBook } from "../Setup";
import { BracketDataBuilder } from "./BracketDataBuilder";
import { GlobalDataBuilder } from "./GlobalDataBuilder";
import { GridBuilder } from "./GridBuilder";
import { BracketSources } from "./BracketSources";
import { JsCtx } from "../Interop/JsCtx";
import { StatusBox } from "../taskpane/components/StatusBox";
import { HelpTopic } from "../HelpInfo";
import { TrError} from "../Exceptions";
import { GameNum } from "../BracketEditor/GameNum";

export interface BracketOption
{
    key: string;
    name: string;
}

export class BracketStructureBuilder
{
    static SheetName: string = "BracketDefs";

    /*----------------------------------------------------------------------------
        %%Function: BracketStructureBuilder.getArrayValuesFromBracketDefinition
    ----------------------------------------------------------------------------*/
    static getArrayValuesFromBracketDefinition(
        bracketDefinition: BracketDefinition): any[][]
    {
        let values: any[][] = [];

        bracketDefinition.games.forEach(
            (gameDef: GameDefinition, gameNum: number) =>
            {
                values.push([gameNum + 1, gameDef.winner, gameDef.loser, gameDef.topSource, gameDef.bottomSource]);
            });

        return values;
    }

    /*----------------------------------------------------------------------------
        %%Function: BracketStructureBuilder.getStaticAvailableBrackets

        return an array of bracket options for the static brackets we can create
    ----------------------------------------------------------------------------*/
    static getStaticAvailableBrackets(): BracketOption[]
    {
        let brackets: BracketOption[] = [];

        s_brackets.forEach(
            (bracket: BracketDefinition) =>
            {
                brackets.push(
                    {
                        key: bracket.tableName.substr(0, bracket.tableName.length - 7),
                        name: bracket.name
                    });
            });

        return brackets;
    }

    static verifyAdvanceSourceCorrect(games: GameDefinition[], sourceExpected: string, advance: string)
    {
        const advanceNum = BracketManager.GameIdFromWinnerLoser(advance).GameNum;
        const placement = BracketManager.GetTeamPlacementFromAdvance(advance);

        if (advanceNum.Value < 0 || advanceNum.Value >= games.length)
            throw new Error(`bad advance to game number {$advanceNum.Value} in bracket - out of bounds`);

        const targetGame = games[advanceNum.Value];
        const actualSource = (placement == TeamPlacement.Top) ? targetGame.topSource : targetGame.bottomSource;

        if (actualSource != sourceExpected)
            throw new Error(`sourceExpected(${sourceExpected}) != actual(${actualSource}))`);
    }

    static verifySourceAdvanceCorrect(games: GameDefinition[], advanceExpected: string, source: string)
    {
        const sourceId = BracketManager.GameIdFromWinnerLoser(source);
        const sourceNum = sourceId.GameNum;

        if (sourceNum.Value < 0 || sourceNum.Value >= games.length)
            throw new Error(`bad advance to game number {sourceNum.Value} in bracket - out of bounds`);

        const sourceGame = games[sourceNum.Value];

        // we don't really need the result, but we want to make sure it converts properly...
        const result = BracketManager.GetGameResultTypeFromSource(source);
        const advanceId = BracketManager.GameIdFromWinnerLoser(advanceExpected);

        // one of the results (winner or loser) has to go to the expected
        if (sourceGame.winner != advanceExpected
            && sourceGame.loser != advanceExpected)
        {
            throw new Error(`source information for game (${advanceExpected}) doesn't match winner or loser in G${sourceId.Value} -- corrupt bracket`);
        }
    }

    /*----------------------------------------------------------------------------
        %%Function: BracketStructureBuilder.verifyBracketConsistency

        Verify that the bracket is internally consistent
    ----------------------------------------------------------------------------*/
    static verifyBracketConsistency(def: BracketDefinition)
    {
        for (let num = 0; num < def.games.length; num++)
        {
            const gameDef = def.games[num];
            const id = new GameNum(num).GameId;

            try
            {
                let isChampionship = false;

                if (gameDef.winner && gameDef.winner != "")
                {
                    this.verifyAdvanceSourceCorrect(def.games, `W${new GameNum(num).GameId.Value}`, gameDef.winner);
                }
                else
                {
                    if (gameDef.loser && gameDef.loser != "")
                        throw new Error("game can't have no winner advance but have a loser advance");

                    isChampionship = true;
                }

                if (gameDef.loser && gameDef.loser != "")
                    this.verifyAdvanceSourceCorrect(def.games, `L${new GameNum(num).GameId.Value}`, gameDef.loser);

                if (!BracketManager.IsTeamSourceStatic(gameDef.topSource))
                    this.verifySourceAdvanceCorrect(def.games, `T${new GameNum(num).GameId.Value}`, gameDef.topSource);

                if (!isChampionship && !BracketManager.IsTeamSourceStatic(gameDef.bottomSource))
                    this.verifySourceAdvanceCorrect(def.games, `B${new GameNum(num).GameId.Value}`, gameDef.bottomSource);
            }
            catch (e)
            {
                const newError = new Error(`G${id.Value}: ${e.message}`);

                newError.stack = e.stack;
                throw newError;
            }
        }
    }

    /*----------------------------------------------------------------------------
        %%Function: BracketStructureBuilder.getBracketDefinition
    ----------------------------------------------------------------------------*/
    static getBracketDefinition(bracketTableName: string): BracketDefinition
    {
        if (_bracketManager.IsCached(bracketTableName))
            return _bracketManager.Bracket;

        let match: BracketDefinition = null;

        s_brackets.forEach(
            (bracket: BracketDefinition) =>
            {
                if (bracket.tableName === bracketTableName)
                    match = bracket;
            });

        this.verifyBracketConsistency(match);

        return match;
    }


    /*----------------------------------------------------------------------------
        %%Function: BracketStructureBuilder.insertBracketDefinitionAtRow

        insert the bracket definition into the given sheet at the given row.
        this will insert the validation formulas as well
    ----------------------------------------------------------------------------*/
    static async insertBracketDefinitionAtRow(
        context: JsCtx,
        sheet: Excel.Worksheet,
        fastTables: IFastTables,
        row: number,
        bracketDefinition: BracketDefinition): Promise<number>
    {
        const rowFirstTable: number = row + 1;
        const rowFirstTableData: number = rowFirstTable + 1;
        const rowLastTableData: number = rowFirstTableData + bracketDefinition.games.length - 1;
        const rowCheckLines: number = rowLastTableData + 2;

        let rng: Excel.Range = sheet.getCell(row, 1);
        rng.values = [[bracketDefinition.name]];
        await context.sync();

        // create an empty table for the bracket
        let table: Excel.Table = await Tables.ensureTableExists(
            context,
            sheet,
            fastTables,
            bracketDefinition.tableName,
            Ranges.addressFromCoordinates([rowFirstTable, 1], [rowFirstTable, 7]),
            ["Game", "Winner", "Loser", "Top", "Bottom", "CountTopCheck", "CountBottomCheck"]);

        await Tables.appendArrayToTableSlow(
            context,
            bracketDefinition.tableName,
            this.getArrayValuesFromBracketDefinition(bracketDefinition),
            ["Game", "Winner", "Loser", "Top", "Bottom"]);

        rng = sheet.getRangeByIndexes(rowFirstTableData, 6, 1, 2);
        rng.formulas =
            <any[][]>
            [
                [
                    `=COUNTIF(${bracketDefinition.tableName}[[Winner]:[Loser]], "T" & [@Game])`,
                    `=COUNTIF(${bracketDefinition.tableName}[[Winner]:[Loser]], "B" & [@Game])`
                ]
            ];
        await context.sync();

        // and now fill in the formulas for the checks
        rng = sheet.getRangeByIndexes(rowCheckLines, 0, 4, 1);
        rng.values = [["Total Games"], ["Team Check"], ["LoseCheck"], ["WinCheck"]];

        await context.sync();

        rng = sheet.getRangeByIndexes(rowCheckLines, 1, 4, 2);
        rng.formulas =
            <any[][]>
        [
            [
                `=MAX(${Ranges.addressFromCoordinates([rowFirstTableData, 1], [rowLastTableData, 1])})`,
                ""
            ],
            [
                `=(${Ranges.addressFromCoordinates([rowCheckLines, 1], null)} + 1) / 2`,
                `=COUNTIF(${bracketDefinition.tableName}[[Top]:[Bottom]],"Team*")`
            ],
            [
                `=${Ranges.addressFromCoordinates([rowCheckLines + 1, 1], null)}`,
                `=COUNTIF(${bracketDefinition.tableName}[[Top]:[Bottom]],"L*")`
            ],
            [
                `=${Ranges.addressFromCoordinates([rowCheckLines, 1], null)} - 1`,
                `=COUNTIF(${bracketDefinition.tableName}[[Top]:[Bottom]],"W*")`
            ]
            ];
        await context.sync();

        return rowCheckLines + 6;
    }

    /*----------------------------------------------------------------------------
        %%Function: BracketStructureBuilder.buildBracketsSheet

        build the brackets structure sheet, populating with all of the brackets
        we know about
    ----------------------------------------------------------------------------*/
    static async buildBracketsSheet(context: JsCtx, fastTables: IFastTables, appContext: IAppContext)
    {
        try
        {
            let sheetBrackets: Excel.Worksheet = await Sheets.ensureSheetExists(context, BracketStructureBuilder.SheetName);
            let row: number = 1;

            for (const bracketNum in s_brackets)
            {
                row = await this.insertBracketDefinitionAtRow(context, sheetBrackets, fastTables, row, s_brackets[bracketNum]);
            }
        }
        catch (error)
        {
            if (error instanceof TrError)
                appContext.Messages.error(error._Messages, { topic: error._HelpInfo });
            else
                appContext.Messages.error(StatusBox.linesFromError(error), { topic: HelpTopic.FAQ_Exceptions });
        }
    }


    /*----------------------------------------------------------------------------
        %%Function: BracketStructureBuilder.buildSpecificBracketCore

        Build a specific bracket, including making the bracket grid, data sheet,
        etc.
    ----------------------------------------------------------------------------*/
    static async buildSpecificBracketCore(context: JsCtx, appContext: IAppContext, fastTables: IFastTables)
    {
        const bracketChoice: string = appContext.getSelectedBracket();
        const bracketsSheet: Excel.Worksheet = await Sheets.ensureSheetExists(context, BracketStructureBuilder.SheetName, null, EnsureSheetPlacement.Last);

        let bracketTable: Excel.Table =
            await SetupBook.getBracketTableOrNull(context, bracketsSheet, bracketChoice);

        const bracketDefinition: BracketDefinition = this.getBracketDefinition(`${bracketChoice}Bracket`);

        if (bracketTable == null)
        {
            if (bracketDefinition == null)
            {
                appContext.Messages.error([`Don't know how to build bracket for choice: '${bracketChoice}'`]);
                return;
            }

            const rowFirst: number = await Sheets.findFirstEmptyRowAfterAllData(context, bracketsSheet, 35);

            await this.insertBracketDefinitionAtRow(context, bracketsSheet, fastTables, rowFirst + 2, bracketDefinition);
        }

        await GridBuilder.buildGridSheet(context);
        await BracketDataBuilder.buildBracketDataSheet(context, bracketChoice, bracketDefinition);
        await BracketSources.buildBracketSourcesSheet(context, fastTables, bracketDefinition);
    }
}
