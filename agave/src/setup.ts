
import { BracketStructureBuilder } from "./Brackets/bracketStructureBuilder";
import { FastTables } from "./Interop/FastTables";
import { ILogging } from "./Logging";

export enum SetupState
{
    Broken,
    NoBracketData,
    NoBracketChoice,
    Ready
};

let fastTables: FastTables = new FastTables();

export class SetupBook
{
    static async getWorkbookSetupState(ctx: any): Promise<SetupState>
    {
        // any bracket workbook has to have a BracketStructure sheet
        const bracketStructureSheet: Excel.Worksheet = ctx.workbook.worksheets.getItemOrNullObject("BracketStructure");
        await ctx.sync();

        if (bracketStructureSheet.isNullObject)
            return SetupState.NoBracketData;

        // see if there's a bracket choice cell. it will be names "BracketChoice"
        const bracketChoiceNameObject: Excel.NamedItem = ctx.workbook.names.getItemOrNullObject("BracketChoice");

        await ctx.sync();
        let bracketState: SetupState = SetupState.Broken;

        if (!bracketChoiceNameObject.isNullObject)
        {
            // make sure we have a bracket table for the choice
            bracketChoiceNameObject.load();
            await ctx.sync();
            const bracketChoiceRange: Excel.Range = bracketChoiceNameObject.getRange();
            await ctx.sync();
            bracketChoiceRange.load();
            await ctx.sync();
            const bracketChoice: string = bracketChoiceRange.values[0][0];
            await ctx.sync();

            if (bracketChoice[0] !== "T")
                return SetupState.Broken;

            const bracketTable: Excel.Table =
                bracketStructureSheet.tables.getItemOrNullObject(bracketChoice.concat("Bracket"));

            await ctx.sync();
            if (bracketTable.isNullObject)
                return SetupState.Broken;

            return SetupState.Ready;
        }

        // we don't have a bracket choice. figure out what brackets we have data for
        var brackets: string[];

        for (let bracketTable of bracketStructureSheet.tables.items)
        {
            brackets.push(bracketTable.name);
        }

        if (brackets.length > 0)
            return SetupState.NoBracketChoice;

        return SetupState.NoBracketData;
    }

    static async buildBracketWorkbook(logging: ILogging): Promise<boolean>
    {
        try
        {
            await Excel.run(async (context) =>
            {
                return await BracketStructureBuilder.buildBracketsSheet(context, fastTables, logging);
            });
        }
        catch (error)
        {
            return false;
        }

        return true;
    }
}

