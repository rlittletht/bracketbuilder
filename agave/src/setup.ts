
import { BracketStructureBuilder } from "./Brackets/BracketStructureBuilder";
import { FastTables } from "./Interop/FastTables";
import { IAppContext, AppContext } from "./AppContext";
import { BracketDataBuilder } from "./Brackets/BracketDataBuilder";
import { JsCtx } from "./Interop/JsCtx";
import { Coachstate } from "./Coachstate";
import { CoachTransition } from "./CoachTransition";

export enum SetupState
{
    Unknown,
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
    static async getBracketsStructureSheetOrNull(context: JsCtx): Promise<Excel.Worksheet>
    {
        const bracketStructureSheet: Excel.Worksheet = context.Ctx.workbook.worksheets.getItemOrNullObject(BracketStructureBuilder.SheetName);
        await context.sync();

        if (bracketStructureSheet.isNullObject)
            return null;

        return bracketStructureSheet;
    }

    /*----------------------------------------------------------------------------
        %%Function: SetupBook.getBracketsDataSheetOrNull
    ----------------------------------------------------------------------------*/
    static async getBracketsDataSheetOrNull(context: JsCtx): Promise<Excel.Worksheet>
    {
        const bracketDataSheet: Excel.Worksheet = context.Ctx.workbook.worksheets.getItemOrNullObject(BracketDataBuilder.SheetName);
        await context.sync();

        if (bracketDataSheet.isNullObject)
            return null;

        return bracketDataSheet;
    }

    /*----------------------------------------------------------------------------
        %%Function: SetupBook.getBracketChoiceOrNull

        see if there's a bracket choice cell. it will be named "BracketChoice"
        (it will be a global name)
    ----------------------------------------------------------------------------*/
    static async getBracketChoiceOrNull(context: JsCtx): Promise<string>
    {
        try
        {
            const bracketChoiceNameObject: Excel.NamedItem = context.Ctx.workbook.names.getItemOrNullObject("BracketChoice");
            await context.sync();

            if (bracketChoiceNameObject.isNullObject)
                return null;

            bracketChoiceNameObject.load("type");
            await context.sync();
            if (bracketChoiceNameObject.type == "Error")
                return null;

            const bracketChoiceRange: Excel.Range = bracketChoiceNameObject.getRange();
            bracketChoiceRange.load("values");
            await context.sync();
            const bracketChoice: string = bracketChoiceRange.values[0][0];

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
    static async getBracketTableOrNull(context: JsCtx, bracketStructureSheet: Excel.Worksheet, bracketChoice: string): Promise<Excel.Table>
    {
        if (bracketStructureSheet == null || bracketChoice == null)
            return null;

        if (bracketChoice[0] !== "T")
            return null;

        const bracketTable: Excel.Table =
            bracketStructureSheet.tables.getItemOrNullObject(bracketChoice.concat("Bracket"));

        await context.sync();
        if (bracketTable.isNullObject)
            return null;

        return bracketTable;
    }


    /*----------------------------------------------------------------------------
        %%Function: SetupBook.getBracketDefinitionsAvailable

        return an array of bracket definitions available in this workbook
    ----------------------------------------------------------------------------*/
    static async getBracketDefinitionsAvailable(context: JsCtx, bracketStructureSheet: Excel.Worksheet): Promise<string[]>
    {
        if (bracketStructureSheet == null)
            return null;

        let brackets: string[] = [];

        bracketStructureSheet.tables.load("items");
        await context.sync();

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
    static async getWorkbookSetupState(context: JsCtx): Promise<[SetupState, string]>
    {
        // any bracket workbook has to have a BracketStructure sheet
        const bracketStructureSheet: Excel.Worksheet = await this.getBracketsStructureSheetOrNull(context);

        if (bracketStructureSheet ==  null)
            return [SetupState.NoBracketStructure, null]

        const bracketChoice: string = await this.getBracketChoiceOrNull(context);

        if (bracketChoice != null)
        {
            const bracketTable: Excel.Table = await this.getBracketTableOrNull(context, bracketStructureSheet, bracketChoice);

            if (bracketTable.isNullObject)
                return [SetupState.NoBracketData, bracketChoice];

            if (await this.getBracketsDataSheetOrNull(context) == null)
                return [SetupState.NoBracketData, bracketChoice];

            return [SetupState.Ready, bracketChoice];
        }

/* We don't support prepopulating brackets into the workbook and choosing from them -- it was too confusing of a paradigm

        // we don't have a bracket choice. figure out what brackets we have data for
        var brackets: string[] = [];
        bracketStructureSheet.tables.load("items");
        await context.sync();

        for (let bracketTable of bracketStructureSheet.tables.items)
            brackets.push(bracketTable.name);

        if (brackets.length > 0)
            return SetupState.NoBracketChoice;
*/
        return [SetupState.NoBracketStructure, bracketChoice];
    }

    /*----------------------------------------------------------------------------
        %%Function: SetupBook.buildBracketStructureWorksheet
    ----------------------------------------------------------------------------*/
    static async buildBracketStructureWorksheet(appContext: IAppContext): Promise<boolean>
    {
        try
        {
            await Excel.run(async (ctx) =>
            {
                const context: JsCtx = new JsCtx(ctx);

                await BracketStructureBuilder.buildBracketsSheet(context, fastTables, appContext);
                await appContext.invalidateHeroList(context);
                context.releaseAllTrackedItems();
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
        appContext.transitionState(CoachTransition.BuildBracket);

        appContext.clearCoachmark();
        appContext.setProgressVisible(true);

        try
        {
            await Excel.run(async (ctx) =>
            {
                const context: JsCtx = new JsCtx(ctx);
                await BracketStructureBuilder.buildSpecificBracketCore(context, appContext, fastTables);
                await appContext.invalidateHeroList(context);
                context.releaseAllTrackedItems();
            });
        }
        catch (error)
        {
            appContext.log(`Exception caught: ${error.message}`);
        }

        appContext.setProgressVisible(false);
        return false;
    }
}

