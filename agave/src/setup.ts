
import { BracketStructureBuilder } from "./Brackets/BracketStructureBuilder";
import { FastTables } from "./Interop/FastTables";
import { IAppContext } from "./AppContext";

export enum SetupState
{
    Broken,
    NoBracketStructure,
    NoBracketData,
    NoBracketChoice,
    Ready
};

let fastTables: FastTables = new FastTables();

export class SetupBook
{
    /*----------------------------------------------------------------------------
        %%Function: SetupBook.getBracketsStructureSheetOrNull
    ----------------------------------------------------------------------------*/
    static async getBracketsStructureSheetOrNull(ctx: any): Promise<Excel.Worksheet>
    {
        const bracketStructureSheet: Excel.Worksheet = ctx.workbook.worksheets.getItemOrNullObject("BracketStructure");
        await ctx.sync();

        if (bracketStructureSheet.isNullObject)
            return null;

        return bracketStructureSheet;
    }

    /*----------------------------------------------------------------------------
        %%Function: SetupBook.getBracketsDataSheetOrNull
    ----------------------------------------------------------------------------*/
    static async getBracketsDataSheetOrNull(ctx: any): Promise<Excel.Worksheet>
    {
        const bracketDataSheet: Excel.Worksheet = ctx.workbook.worksheets.getItemOrNullObject("BracketData");
        await ctx.sync();

        if (bracketDataSheet.isNullObject)
            return null;

        return bracketDataSheet;
    }

    /*----------------------------------------------------------------------------
        %%Function: SetupBook.getBracketChoiceOrNull

        see if there's a bracket choice cell. it will be named "BracketChoice"
        (it will be a global name)
    ----------------------------------------------------------------------------*/
    static async getBracketChoiceOrNull(ctx: any): Promise<string>
    {
        try
        {
            const bracketChoiceNameObject: Excel.NamedItem = ctx.workbook.names.getItemOrNullObject("BracketChoice");
            await ctx.sync();

            if (bracketChoiceNameObject.isNullObject)
                return null;

            bracketChoiceNameObject.load();
            await ctx.sync();
            const bracketChoiceRange: Excel.Range = bracketChoiceNameObject.getRange();
            await ctx.sync();
            bracketChoiceRange.load();
            await ctx.sync();
            const bracketChoice: string = bracketChoiceRange.values[0][0];
            await ctx.sync();

            return bracketChoice;
        }
        catch (_error)
        {
            return null;
        }
    }

    /*----------------------------------------------------------------------------
        %%Function: SetupBook.getBracketTableOrNull

        Return the bracket definition table for the given bracket choice
    ----------------------------------------------------------------------------*/
    static async getBracketTableOrNull(ctx: any, bracketStructureSheet: Excel.Worksheet, bracketChoice: string): Promise<Excel.Table>
    {
        if (bracketStructureSheet == null || bracketChoice == null)
            return null;

        if (bracketChoice[0] !== "T")
            return null;

        const bracketTable: Excel.Table =
            bracketStructureSheet.tables.getItemOrNullObject(bracketChoice.concat("Bracket"));

        await ctx.sync();
        if (bracketTable.isNullObject)
            return null;

        return bracketTable;
    }


    /*----------------------------------------------------------------------------
        %%Function: SetupBook.getBracketDefinitionsAvailable

        return an array of bracket definitions available in this workbook
    ----------------------------------------------------------------------------*/
    static async getBracketDefinitionsAvailable(ctx: any, bracketStructureSheet: Excel.Worksheet): Promise<string[]>
    {
        if (bracketStructureSheet == null)
            return null;

        let brackets: string[] = [];

        bracketStructureSheet.tables.load("items");
        await ctx.sync();

        for (let bracketTable of bracketStructureSheet.tables.items)
            brackets.push(bracketTable.name);

        if (brackets.length > 0)
            return null;

        return brackets;
    }


    /*----------------------------------------------------------------------------
        %%Function: SetupBook.getWorkbookSetupState

        get the current state of the workbook (does it have bracket definitions,
        a chosen bracket, etc)
    ----------------------------------------------------------------------------*/
    static async getWorkbookSetupState(ctx: any): Promise<SetupState>
    {
        // any bracket workbook has to have a BracketStructure sheet
        const bracketStructureSheet: Excel.Worksheet = await this.getBracketsStructureSheetOrNull(ctx);

        if (bracketStructureSheet ==  null)
            return SetupState.NoBracketStructure;

        const bracketChoice: string = await this.getBracketChoiceOrNull(ctx);

        if (bracketChoice != null)
        {
            const bracketTable: Excel.Table = await this.getBracketTableOrNull(ctx, bracketStructureSheet, bracketChoice);
                bracketStructureSheet.tables.getItemOrNullObject(bracketChoice.concat("Bracket"));
            await ctx.sync();

            if (bracketTable.isNullObject)
                return SetupState.NoBracketData;

            if (await this.getBracketsDataSheetOrNull(ctx) == null)
                return SetupState.NoBracketData;

            return SetupState.Ready;
        }

        // we don't have a bracket choice. figure out what brackets we have data for
        var brackets: string[] = [];
        bracketStructureSheet.tables.load("items");
        await ctx.sync();

        for (let bracketTable of bracketStructureSheet.tables.items)
            brackets.push(bracketTable.name);

        if (brackets.length > 0)
            return SetupState.NoBracketChoice;

        return SetupState.NoBracketStructure;
    }

    /*----------------------------------------------------------------------------
        %%Function: SetupBook.buildBracketStructureWorksheet
    ----------------------------------------------------------------------------*/
    static async buildBracketStructureWorksheet(appContext: IAppContext): Promise<boolean>
    {
        try
        {
            await Excel.run(async (context) =>
            {
                return await BracketStructureBuilder.buildBracketsSheet(context, fastTables, appContext);
            });
        }
        catch (error)
        {
            appContext.log(`Exception caught: ${error.message}`);
        }

        return true;
    }

    /*----------------------------------------------------------------------------
        %%Function: SetupBook.buildSpecificBracket

        Build out the necessary worksheets for the specified bracket. This might
        create a bracket structure (or rely on one that is already in the
        workbook), and it will create the BracketData, GlobalData, and
        GridTemplate sheets.
    ----------------------------------------------------------------------------*/
    static async buildSpecificBracket(appContext: IAppContext): Promise<boolean>
    {
        try
        {
            await Excel.run(async (context) =>
            {
                await BracketStructureBuilder.buildSpecificBracketCore(context, appContext, fastTables);
            });
        }
        catch (error)
        {
            appContext.log(`Exception caught: ${error.message}`);
        }

        return false;
    }
}

