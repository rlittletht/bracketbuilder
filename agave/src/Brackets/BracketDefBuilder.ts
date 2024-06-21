
import { IAppContext } from "../AppContext/AppContext";
import { GameNum } from "../BracketEditor/GameNum";
import { BracketManager, _bracketManager } from "../Brackets/BracketManager";
import { HelpTopic } from "../Coaching/HelpInfo";
import { TrError } from "../Exceptions";
import { IFastTables } from "../Interop/FastTables";
import { JsCtx } from "../Interop/JsCtx";
import { Ranges } from "../Interop/Ranges";
import { EnsureSheetPlacement, Sheets } from "../Interop/Sheets";
import { Tables } from "../Interop/Tables";
import { SetupBook } from "../Setup";
import { StatusBox } from "../taskpane/components/StatusBox";
import { BracketDefinition, GameDefinition, s_brackets, TeamPlacement } from "./BracketDefinitions";
import { BracketInfoBuilder } from "./BracketInfoBuilder";
import { GameDataSources } from "./GameDataSources";
import { GridBuilder } from "./GridBuilder";

export interface BracketOption
{
    key: string;
    name: string;
}

export class BracketDefBuilder
{
    static SheetName: string = "BracketDefs";

    /*----------------------------------------------------------------------------
        %%Function: BracketDefBuilder.getArrayValuesFromBracketDefinition
    ----------------------------------------------------------------------------*/
    static getArrayValuesFromBracketDefinition(
        bracketDefinition: BracketDefinition): any[][]
    {
        let values: any[][] = [];

        bracketDefinition.games.forEach(
            (gameDef: GameDefinition, gameNum: number) =>
            {
                values.push([gameNum + 1, gameDef.winner, gameDef.loser, gameDef.topSource, gameDef.bottomSource, gameDef.topSeed ?? "", gameDef.bottomSeed ?? ""]);
            });

        return values;
    }

    static getTeamSeedNames(bracket: BracketDefinition): { team: string, seed: string }[]
    {
        const teams: { team: string, seed: string }[] = [];

        for (let game of bracket.games)
        {
            if (BracketManager.IsTeamSourceStatic(game.topSource))
                teams.push({ team: game.topSource, seed: game.topSeed ?? "" });
            if (BracketManager.IsTeamSourceStatic(game.bottomSource))
                teams.push({ team: game.bottomSource, seed: game.bottomSeed ?? "" });
        }

        return teams;
    }

    /*----------------------------------------------------------------------------
        %%Function: BracketDefBuilder.getTeamNames
    ----------------------------------------------------------------------------*/
    static getTeamNames(bracket: BracketDefinition): string[]
    {
        const teams: string[] = [];

        for (let game of bracket.games)
        {
            if (BracketManager.IsTeamSourceStatic(game.topSource))
                teams.push(game.topSource);
            if (BracketManager.IsTeamSourceStatic(game.bottomSource))
                teams.push(game.bottomSource);
        }

        return teams;
    }

    static getSeedNames(bracket: BracketDefinition): string[]
    {
        const seeds: string[] = [];

        for (let game of bracket.games)
        {
            if ((game.topSeed ?? "") != "")
                seeds.push(game.topSeed);
            if ((game.bottomSeed ?? "") != "")
                seeds.push(game.bottomSeed);
        }

        return seeds;
    }
    /*----------------------------------------------------------------------------
        %%Function: BracketDefBuilder.getStaticAvailableBrackets

        return an array of bracket options for the static brackets we can create
    ----------------------------------------------------------------------------*/
    static getStaticAvailableBrackets(): BracketOption[]
    {
        let brackets: BracketOption[] = [];

        s_brackets.forEach(
            (bracket: BracketDefinition) =>
            {
                BracketDefBuilder.verifyBracketConsistency(bracket);

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
            throw new Error(`advance to game G${advanceNum.GameId.Value} has wrong source: sourceExpected(${sourceExpected}) != actual(${actualSource}))`);
    }

    static verifySourceAdvanceCorrect(games: GameDefinition[], advanceExpected: string, source: string)
    {
        const sourceId = BracketManager.GameIdFromWinnerLoser(source);
        const sourceNum = sourceId.GameNum;

        if (sourceNum.Value < 0 || sourceNum.Value >= games.length)
            throw new Error(`bad advance to game number ${sourceNum.Value} in bracket - out of bounds`);

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

    static verifyAndRecordSeed(mapSeeds: Map<string, number>, source: string, seed: string | undefined)
    {
        if (mapSeeds.size > 0)
        {
            if (BracketManager.IsTeamSourceStatic(source))
            {
                if ((seed ?? "") == "")
                    throw new Error(`team ${source} specified but no seed ${seed} defined`);
            }
        }

        if ((seed ?? "") != "")
        {
            if (mapSeeds.has(seed))
                throw new Error(`seed ${seed} specified more than once`);

            mapSeeds.set(seed, 1);

            if (!BracketManager.IsTeamSourceStatic(source))
                throw new Error(`seed ${seed} defined for non-static source ${source}`);
        }
    }

    /*----------------------------------------------------------------------------
        %%Function: BracketDefBuilder.verifyBracketConsistency

        Verify that the bracket is internally consistent
    ----------------------------------------------------------------------------*/
    static verifyBracketConsistency(def: BracketDefinition)
    {
        // if there are seeds, they have to be complete
        const mapSeeds = new Map<string, number>();

        for (let num = 0; num < def.games.length; num++)
        {
            const gameDef = def.games[num];
            const id = new GameNum(num).GameId;

            try
            {
                this.verifyAndRecordSeed(mapSeeds, gameDef.topSource, gameDef.topSeed);
                this.verifyAndRecordSeed(mapSeeds, gameDef.bottomSource, gameDef.bottomSeed);

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

        const teams = this.getTeamNames(def);

        if (teams.length != def.teamCount)
            throw new Error(`Number of defined teams ${teams.length} doesn't equal the team bracket size ${def.teamCount}`);

        const mapTeamPresent = new Map<string, number>();

        for (let team of teams)
        {
            const check = team.toUpperCase();

            if (mapTeamPresent.has(check))
                throw new Error(`Found team ${team} playing for the first time more than once in the bracket`);

            mapTeamPresent.set(check, 1);
        }

        if (mapSeeds.size > 0 && mapSeeds.size != teams.length)
            throw new Error(`incorrect number of seed names defined: ${mapSeeds.size} != ${teams.length}`);
    }

    /*----------------------------------------------------------------------------
        %%Function: BracketDefBuilder.getBracketDefinition
    ----------------------------------------------------------------------------*/
    static getStaticBracketDefinition(bracketTableName: string): BracketDefinition
    {
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

    static getStaticBrackets(): BracketDefinition[]
    {
        return s_brackets;
    }

    /*----------------------------------------------------------------------------
        %%Function: BracketDefBuilder.insertBracketDefinitionAtRow

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

        let rng: Excel.Range = sheet.getRangeByIndexes(row, 1, 1, 3);
        rng.values = [[bracketDefinition.name, "", `${bracketDefinition.teamCount} Team Double Elimination Bracket`]];

        rng = sheet.getRangeByIndexes(row, 3, 1, 2);
        rng.format.font.bold = true;

        await context.sync();

        // create an empty table for the bracket
        let table: Excel.Table = await Tables.ensureTableExists(
            context,
            sheet,
            fastTables,
            bracketDefinition.tableName,
            Ranges.addressFromCoordinates([rowFirstTable, 1], [rowFirstTable, 9]),
            ["Game", "Winner", "Loser", "Top", "Bottom", "CountTopCheck", "CountBottomCheck", "TopSeedName", "BottomSeedName"]);

        await Tables.appendArrayToTableSlow(
            context,
            bracketDefinition.tableName,
            this.getArrayValuesFromBracketDefinition(bracketDefinition),
            ["Game", "Winner", "Loser", "Top", "Bottom", "TopSeedName", "BottomSeedName"]);

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
                    `=INT((${Ranges.addressFromCoordinates([rowCheckLines, 1], null)} + 1) / 2)`,
                    `=COUNTA(${bracketDefinition.tableName}[[Top]:[Bottom]])-${Ranges.addressFromCoordinates([rowCheckLines + 2, 2], null)}-${Ranges.addressFromCoordinates([rowCheckLines + 3, 2], null)}`
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
        %%Function: BracketDefBuilder.buildBracketsSheet

        build the brackets structure sheet, populating with all of the brackets
        we know about
    ----------------------------------------------------------------------------*/
    static async buildBracketsSheet(context: JsCtx, fastTables: IFastTables, appContext: IAppContext)
    {
        try
        {
            let sheetBrackets: Excel.Worksheet = await Sheets.ensureSheetExists(context, BracketDefBuilder.SheetName);
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
        %%Function: BracketDefBuilder.buildSpecificBracketCore

        Build a specific bracket, including making the bracket grid, data sheet,
        etc.
    ----------------------------------------------------------------------------*/
    static async buildSpecificBracketCore(context: JsCtx, appContext: IAppContext, fastTables: IFastTables)
    {
        const bracketChoice: string = appContext.SelectedBracket;

        let bracketDefinition: BracketDefinition = _bracketManager.getBracket(bracketChoice);

        if (bracketDefinition == null)
        {
            // we don't have this bracket cached yet, add the static definition to the workbook
            const bracketsSheet: Excel.Worksheet = await Sheets.ensureSheetExists(context, BracketDefBuilder.SheetName, null, EnsureSheetPlacement.Last);

            let bracketTable: Excel.Table =
                await SetupBook.getBracketTableOrNull(context, bracketsSheet, bracketChoice);

            bracketDefinition = this.getStaticBracketDefinition(`${bracketChoice}Bracket`);

            if (bracketTable != null)
                throw new Error("should not have already had a table for this bracket -- the bracket manager should have already loaded it!");

            if (bracketDefinition == null)
            {
                appContext.Messages.error([`Don't know how to build bracket for choice: '${bracketChoice}'`]);
                return;
            }

            const rowFirst: number = await Sheets.findFirstEmptyRowAfterAllData(context, bracketsSheet, 35);

            await this.insertBracketDefinitionAtRow(context, bracketsSheet, fastTables, rowFirst + 2, bracketDefinition);

            // now we can load this in the bracket manager
            _bracketManager.setDirty(true);
            await _bracketManager.populateBracketsIfNecessary(context, bracketChoice);
        }

        await GridBuilder.buildGridSheet(context);
        await BracketInfoBuilder.buildBracketInfoSheet(context, bracketChoice, bracketDefinition);
        await GameDataSources.buildGameDataSourcesSheet(context, fastTables, bracketDefinition);
    }
}
