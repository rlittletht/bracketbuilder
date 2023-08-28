
import { IAppContext } from "./AppContext/AppContext";
import { BracketInfoBuilder as BracketDataBuilder, BracketInfoBuilder } from "./Brackets/BracketInfoBuilder";
import { BracketDefBuilder, BracketOption } from "./Brackets/BracketDefBuilder";
import { CoachTransition } from "./Coaching/CoachTransition";
import { HelpTopic } from "./Coaching/HelpInfo";
import { TrError } from "./Exceptions";
import { FastFormulaAreas, FastFormulaAreasItems } from "./Interop/FastFormulaAreas";
import { FastTables } from "./Interop/FastTables";
import { JsCtx } from "./Interop/JsCtx";
import { StatusBox } from "./taskpane/components/StatusBox";
import { RangeInfo } from "./Interop/Ranges";
import { RangeCaches, RangeCacheItemType } from "./Interop/RangeCaches";
import { BracketDefinition } from "./Brackets/BracketDefinitions";
import { _bracketManager } from "./Brackets/BracketManager";
import { Dispatcher, DispatchWithCatchDelegate } from "./BracketEditor/Dispatcher";
import { GridBuilder } from "./Brackets/GridBuilder";

export class SetupState
{
    static Unknown = "U";
    static Broken = "B";
    static NoBracketStructure = "NBS";
    static NoBracketData = "NBD";
    static NoBracketChoice = "NBC";
    static Ready = "R";
};

let fastTables: FastTables = new FastTables();

export class SetupBook
{
    /*----------------------------------------------------------------------------
        %%Function: SetupBook.getBracketsStructureSheetOrNull
    ----------------------------------------------------------------------------*/
    static async getBracketsStructureSheetOrNull(context: JsCtx): Promise<Excel.Worksheet>
    {
        const bracketStructureSheet: Excel.Worksheet = context.Ctx.workbook.worksheets.getItemOrNullObject(BracketDefBuilder.SheetName);
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
            const infoSheet = await FastFormulaAreas.populateFastFormulaAreaCacheForType(context, FastFormulaAreasItems.BracketInfo);
            const bracket = infoSheet.getValuesForRangeInfo(BracketInfoBuilder.s_bracketChoiceRange);

            return bracket[0][0];
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
        %%Function: SetupBook.getWorkbookSetupState

        get the current state of the workbook (does it have bracket definitions,
        a chosen bracket, etc)

        Normally this is cached in appContext on initial load of the addin
        OR after we have built the bracket

        after this is called, the bracketManager will be up to date with the
        chosen bracket (if selected)
    ----------------------------------------------------------------------------*/
    static async getWorkbookSetupState(context: JsCtx): Promise<[SetupState, string]>
    {
        const areasCache = FastFormulaAreas.getFastFormulaAreaCacheForType(context, FastFormulaAreasItems.BracketDefs);

        if (areasCache)
        {
            // we have the bracket workbook structures created. get the selected bracket
            const bracketChoice = await this.getBracketChoiceOrNull(context);

            if (bracketChoice == null)
                return [SetupState.NoBracketChoice, null];

            if (RangeCaches.getCacheByType(RangeCacheItemType.BracketDefBody) != null)
                return [SetupState.Ready, bracketChoice];
        }

        // if we get here, we don't have a cache or we had a bracket choice, but we haven't
        // cached the bracket definition range -- do it the slow way

        // any bracket workbook has to have a BracketStructure sheet
        const bracketStructureSheet: Excel.Worksheet = await this.getBracketsStructureSheetOrNull(context);

        if (bracketStructureSheet ==  null)
            return [SetupState.NoBracketStructure, null]

        const bracketChoice: string = await this.getBracketChoiceOrNull(context);

        if (bracketChoice != null)
        {
            const bracketDefinition = await _bracketManager.populateBracketsIfNecessary(context, bracketChoice);

            if (!bracketDefinition)
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

                await BracketDefBuilder.buildBracketsSheet(context, fastTables, appContext);
                appContext.setHeroListDirty();
                context.releaseAllCacheObjects();
            });
        }
        catch (error)
        {
            if (error instanceof TrError)
                appContext.Messages.error(error._Messages, { topic: error._HelpInfo });
            else
                appContext.Messages.error(StatusBox.linesFromError(error), { topic: HelpTopic.FAQ_Exceptions });
        }

        return true;
    }

    static async getCustomBracketOptions(context: JsCtx, appContext: IAppContext): Promise<BracketOption[]>
    {
        const brackets = await SetupBook.loadCustomBracketsAsync(context, appContext);
        const bracketOptions: BracketOption[] = [];

        for (let _bracket of brackets)
        {
            bracketOptions.push(
                {
                    key: _bracket.tableName.substr(0, _bracket.tableName.length - 7),
                    name: `${_bracket.name}*`
                });
        }

        return bracketOptions;
    }

    /*----------------------------------------------------------------------------
        %%Function: SetupBook.getSetupState

        get the setup state for the workbook.
    ----------------------------------------------------------------------------*/
    static async getSetupState(context: JsCtx): Promise<[SetupState, string]>
    {
        const [setupState, bracketChoice] = await SetupBook.getWorkbookSetupState(context);

        return [setupState, bracketChoice];
    }

    static async loadCustomBracketsAsync(context: JsCtx, appContext: IAppContext, reportMissingBrackets?: boolean): Promise<BracketDefinition[]>
    {
        const brackets: BracketDefinition[] = [];

        _bracketManager.setDirty(true);

        await FastFormulaAreas.populateAllCaches(context);
        try
        {
            await _bracketManager.populateBracketsIfNecessary(context);
            brackets.push(..._bracketManager.getBrackets());
        }
        catch (error)
        {
            if (error instanceof TrError)
            {
                appContext.Messages.error(error._Messages, { topic: error._HelpInfo });
            }
            else if (reportMissingBrackets)
            {
                appContext.Messages.error(
                    [
                        "There are either no custom brackets defined in this workbook, or there is a problem with the definitions.",
                        "Make sure the bracket definitions are on a sheet named 'BracketDefs' and the tables are correctly named.",
                        "DETAILS:",
                        ...StatusBox.linesFromError(error)
                    ],
                    { topic: HelpTopic.FAQ_CustomBrackets });
            }
        }

        return brackets;
    }

    static async loadCustomBrackets(appContext: IAppContext): Promise<BracketDefinition[]>
    {
        const brackets: BracketDefinition[] = [];

        let delegate: DispatchWithCatchDelegate = async (context) =>
        {
            brackets.push(...await this.loadCustomBracketsAsync(context, appContext, true));
        };

        await Dispatcher.ExclusiveDispatchWithCatch(delegate, appContext);

        return brackets;
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
        appContext.Teaching.transitionState(CoachTransition.BuildBracket);

        appContext.Teaching.clearCoachmark();
        appContext.setProgressVisible(true);

        try
        {
            await Excel.run(async (ctx) =>
            {
                const context: JsCtx = new JsCtx(ctx);

                await _bracketManager.populateBracketsIfNecessary(context, appContext.SelectedBracket);
                await BracketDefBuilder.buildSpecificBracketCore(context, appContext, fastTables);

                // now update the workbook setup state
                const [setupState, bracketChoice] = await (SetupBook.getSetupState(context));

                if (appContext.SelectedBracket != bracketChoice)
                    throw new Error(`selectedBracket != bracketChoice (${appContext.SelectedBracket} != {bracketChoice})`);

                appContext.WorkbookSetupState = setupState;

                appContext.setHeroListDirty();
                RangeCaches.SetDirty(true);

                appContext.setHeroListDirty();
                SetupBook.registerBindingsForEdits(context, appContext);
                context.releaseAllCacheObjects();
            });
        }
        catch (error)
        {
            if (error instanceof TrError)
                appContext.Messages.error(error._Messages, { topic: error._HelpInfo });
            else
                appContext.Messages.error(StatusBox.linesFromError(error), { topic: HelpTopic.FAQ_Exceptions });
        }

        appContext.setProgressVisible(false);
        return false;
    }

    static async registerBindingsForEdits(context: JsCtx, appContext: IAppContext)
    {
        if (appContext.WorkbookSetupState != SetupState.Ready)
            return;

        const sheet = context.Ctx.workbook.worksheets.getItem(GridBuilder.SheetName);
        context.Ctx.workbook.bindings.add(sheet.getRangeByIndexes(7, 3, 200, 100), Excel.BindingType.range, "gameGrid").onDataChanged.add(() => { appContext.setBracketDirtyForBracketEdit() });
        await context.sync();
    }
}

