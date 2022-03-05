
import { Sheets } from "../Interop/Sheets";
import { BracketDefinition, GameDefinition, s_brackets } from "./bracketDefinitions";
import { Tables } from "../Interop/Tables";
import { IFastTables } from "../Interop/FastTables";
import { Ranges } from "../Interop/Ranges";
import { IAppContext } from "../AppContext";

export class BracketStructureBuilder
{
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
        %%Function: BracketStructureBuilder.insertBracketDefinitionAtRow

        insert the bracket definition into the given sheet at the given row.
        this will insert the validation formulas as well
    ----------------------------------------------------------------------------*/
    static async insertBracketDefinitionAtRow(
        ctx: any,
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
        await ctx.sync();

        // create an empty table for the bracket
        let table: Excel.Table = await Tables.ensureTableExists(
            ctx,
            sheet,
            fastTables,
            bracketDefinition.tableName,
            Ranges.addressFromCoordinates([rowFirstTable, 1], [rowFirstTable, 7]),
            ["Game", "Winner", "Loser", "Top", "Bottom", "CountTopCheck", "CountBottomCheck"]);

        await Tables.appendArrayToTable(
            fastTables,
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
        await ctx.sync();

        // and now fill in the formulas for the checks
        rng = sheet.getRangeByIndexes(rowCheckLines, 0, 4, 1);
        rng.values = [["Total Games"], ["Team Check"], ["LoseCheck"], ["WinCheck"]];

        await ctx.sync();

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
        await ctx.sync();

        return rowCheckLines + 6;
    }

    /*----------------------------------------------------------------------------
        %%Function: BracketStructureBuilder.buildBracketsSheet

        build the brackets structure sheet, populating with all of the brackets
        we know about
    ----------------------------------------------------------------------------*/
    static async buildBracketsSheet(ctx: any, fastTables: IFastTables, appContext: IAppContext)
    {
        try
        {
            let sheetBrackets: Excel.Worksheet = await Sheets.ensureSheetExists(ctx, "BracketStructure");
            let row: number = 1;

            for (const bracketNum in s_brackets)
            {
                row = await this.insertBracketDefinitionAtRow(ctx, sheetBrackets, fastTables, row, s_brackets[bracketNum]);
            }
            appContext.invalidateHeroList(ctx);
        }
        catch (error)
        {
            appContext.log("ERROR: ".concat(error.message));
        }
    }
}
