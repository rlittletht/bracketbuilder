
import { Sheets } from "../Interop/Sheets";
import { BracketDefinition } from "./bracketDefinitions";
import { GameDefinition } from "./bracketDefinitions";
import { s_brackets } from "./bracketDefinitions";
import { Tables } from "../Interop/Tables";
import { IFastTables } from "../Interop/FastTables";
import { Ranges } from "../Interop/Ranges";
import { ILogging } from "../Logging";

export class BracketStructureBuilder
{
    static getArrayValuesFromBracketDefinition(
        game: BracketDefinition): any[][]
    {
        let values: any[][] = [];

        game.definitions.forEach(
            (gameDef: GameDefinition, gameNum: number) =>
            {
                values.push([gameNum + 1, gameDef.winner, gameDef.loser, gameDef.topSource, gameDef.bottomSource]);
            });

        return values;
    }

    static async buildBracketTableAtRow(
        ctx: any,
        sheet: Excel.Worksheet,
        fastTables: IFastTables,
        row: number,
        game: BracketDefinition): Promise<number>
    {
        const rowFirstTable: number = row + 1;
        const rowFirstTableData: number = rowFirstTable + 1;
        const rowLastTableData: number = rowFirstTableData + game.definitions.length - 1;
        const rowCheckLines: number = rowLastTableData + 2;

        let rng: Excel.Range = sheet.getCell(row, 1);
        rng.values = [[game.name]];
        await ctx.sync();

        // create an empty table for the bracket
        let table: Excel.Table = await Tables.ensureTableExists(
            ctx,
            sheet,
            fastTables,
            game.tableName,
            Ranges.addressFromCoordinates([rowFirstTable, 1], [rowFirstTable, 7]),
            ["Game", "Winner", "Loser", "Top", "Bottom", "CountTopCheck", "CountBottomCheck"]);

        await Tables.appendArrayToTable(
            fastTables,
            game.tableName,
            this.getArrayValuesFromBracketDefinition(game),
            ["Game", "Winner", "Loser", "Top", "Bottom"]);

        rng = sheet.getRangeByIndexes(rowFirstTableData, 6, 1, 2);
        rng.formulas =
            <any[][]>
            [
                [
                    `=COUNTIF(${game.tableName}[[Winner]:[Loser]], "T" & [@Game])`,
                    `=COUNTIF(${game.tableName}[[Winner]:[Loser]], "B" & [@Game])`
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
                `=COUNTIF(${game.tableName}[[Top]:[Bottom]],"Team*")`
            ],
            [
                `=${Ranges.addressFromCoordinates([rowCheckLines + 1, 1], null)}`,
                `=COUNTIF(${game.tableName}[[Top]:[Bottom]],"L*")`
            ],
            [
                `=${Ranges.addressFromCoordinates([rowCheckLines, 1], null)} - 1`,
                `=COUNTIF(${game.tableName}[[Top]:[Bottom]],"W*")`
            ]
            ];
        await ctx.sync();

        return rowCheckLines + 6;
    }

    static async buildBracketsSheet(ctx: any, fastTables: IFastTables, logging: ILogging)
    {
        try
        {
            let sheetBrackets: Excel.Worksheet = await Sheets.ensureSheetExists(ctx, "BracketStructure");
            let row: number = 1;

            for (const bracketNum in s_brackets)
            {
                row = await this.buildBracketTableAtRow(ctx, sheetBrackets, fastTables, row, s_brackets[bracketNum]);
            }
        }
        catch (error)
        {
            logging.log("ERROR: ".concat(error.message));
        }
    }
}
