
import { Sheets, EnsureSheetPlacement } from "../Interop/Sheets";
import { BracketDefinition, GameDefinition, s_brackets, _bracketManager } from "./BracketDefinitions";
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

    /*----------------------------------------------------------------------------
        %%Function: BracketStructureBuilder.getBracketDefinition
    ----------------------------------------------------------------------------*/
    static getBracketDefinition(bracketTableName: string): BracketDefinition
    {
        if (_bracketManager.IsCached(bracketTableName))
            return _bracketManager.Bracket;

        let returnVal: BracketDefinition = null;

        s_brackets.forEach(
            (bracket: BracketDefinition) =>
            {
                if (bracket.tableName === bracketTableName)
                    returnVal = bracket;
            });

        return returnVal;
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
