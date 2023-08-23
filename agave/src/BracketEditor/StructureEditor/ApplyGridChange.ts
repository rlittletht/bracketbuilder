import { IAppContext, AppContext } from "../../AppContext/AppContext";
import { GridChange, GridChangeOperation } from "../GridChange";
import { GameFormatting } from "../GameFormatting";
import { Ranges } from "../../Interop/Ranges";
import { IBracketGame, BracketGame } from "../BracketGame";
import { StructureRemove } from "./StructureRemove";
import { StructureInsert } from "./StructureInsert";
import { GameDataSources } from "../../Brackets/GameDataSources";
import { OADate } from "../../Interop/Dates";
import { UndoGameDataItem, UndoManager } from "../Undo";
import { TrackingCache } from "../../Interop/TrackingCache";
import { JsCtx } from "../../Interop/JsCtx";
import { Grid, GridColumnType } from "../Grid";
import { _TimerStack } from "../../PerfTimer";
import { Intentions } from "../../Interop/Intentions/Intentions";
import { IIntention } from "../../Interop/Intentions/IIntention";
import { FastFormulaAreas, FastFormulaAreasItems } from "../../Interop/FastFormulaAreas";

export class ApplyGridChange
{
    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.diffAndApplyChanges

        Take two grids, diff them, and apply the changes
    ----------------------------------------------------------------------------*/
    static async diffAndApplyChanges(appContext: IAppContext, context: JsCtx, grid: Grid, gridNew: Grid, bracketName: string): Promise<UndoGameDataItem[]>
    {
        // now, diff the grids
        const changes: GridChange[] = grid.diff(gridNew, bracketName);

        grid.logChanges(changes);

        return await this.applyChanges(appContext, context, gridNew, changes, bracketName);
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.executeRemoveChange

        if the Op is RemoveLite, there's really nothing to do -- the Insert is
        going to assume all the named ranges are already there
    ----------------------------------------------------------------------------*/
    static async executeRemoveChange(appContext: IAppContext, context: JsCtx, change: GridChange, bracketName: string): Promise<IIntention[]>
    {
        const tns: IIntention[] = [];

        if (change.IsLine)
        {
            if (change.ChangeOp == GridChangeOperation.RemoveLite)
                return tns;;

            AppContext.checkpoint("appc.3");
            // simple, just remove the line formatting
            const removeFormattingTns = GameFormatting.tnsRemoveAllGameFormatting(change.Range);
            tns.push(...removeFormattingTns);

            AppContext.checkpoint("appc.5");
            return tns;
        }

        AppContext.checkpoint("appc.6");
        // if its a game, then we have to completely remove it, including its
        // named ranges
        const bookmark: string = "executeRemoveChange";

        context.pushTrackingBookmark(bookmark);

        let game: IBracketGame = await BracketGame.CreateFromGameId(context, bracketName, change.GameId);

        context.releaseCacheObjectsUntil(bookmark);
//        await context.sync();

        AppContext.checkpoint("appc.7");
        // if we couldn't create the game, or if its not linked to the bracket, then
        // just delete the range
        if (game == null || !game.IsLinkedToBracket)
        {
            if (change.ChangeOp == GridChangeOperation.RemoveLite)
                return tns;

            AppContext.checkpoint("appc.8");
            tns.push(...await StructureRemove.removeGame(appContext, context, null, change.Range, false, false));
            AppContext.checkpoint("appc.9");
        }
        else
        {
            AppContext.checkpoint("appc.10");
            tns.push(...await StructureRemove.removeGame(appContext, context, game, change.Range, false, change.ChangeOp == GridChangeOperation.RemoveLite));
            AppContext.checkpoint("appc.11");
        }

        return tns;
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.executeAddChange

        if the ChangeOp is InsertLite, then all we are going to do is insert
        the formulas and text. The names and structure are assumed to already
        be there.
    ----------------------------------------------------------------------------*/
    static async executeAddChange(appContext: IAppContext, context: JsCtx, gridRef: Grid, change: GridChange, bracketName: string): Promise<UndoGameDataItem>
    {
        const bookmark: string = "executeAddChange";

        context.pushTrackingBookmark(bookmark);

        AppContext.checkpoint("appc.14");
        if (change.IsLine)
        {
            if (change.ChangeOp == GridChangeOperation.InsertLite)
                // nothing to undo since there's no action...
                return new UndoGameDataItem(undefined, undefined, undefined, undefined, undefined);

            AppContext.checkpoint("appc.14.1");

            const range: Excel.Range = Ranges.rangeFromRangeInfo(
                context.Ctx.workbook.worksheets.getActiveWorksheet(),
                change.Range);

            // just format the range as an underline
            GameFormatting.formatConnectingLineRangeRequest(range);

            const linesText = [];
            for (let i = 0; i < change.Range.ColumnCount; i++)
                linesText.push(GameFormatting.s_mapGridColumnType.get(gridRef.getColumnType(change.Range.FirstColumn + i)));

            range.formulas = [linesText];

            AppContext.checkpoint("appc.14.2");
            return new UndoGameDataItem(undefined, undefined, undefined, undefined, undefined);
        }

        let game: BracketGame = new BracketGame();

        AppContext.checkpoint("appc.15");
        await game.Load(context, appContext, bracketName, change.GameId.GameNum);
        AppContext.checkpoint("appc.16");

        let undoGameDataItem: UndoGameDataItem = new UndoGameDataItem(undefined, undefined, undefined, undefined, undefined);

        if (change.ChangeOp == GridChangeOperation.InsertLite)
        {
            if (!game.IsLinkedToBracket)
                throw new Error("game not linked on InsertLite operation");

            if (game.SwapTopBottom != change.SwapTopBottom)
                throw new Error("swap top/bottom not set correctly on InsertLite operation");
        }
        else
        {
            if (game.IsLinkedToBracket)
                throw new Error("game can't be linked - we should have already removed it from the bracket");

            game.SetSwapTopBottom(change.SwapTopBottom);
            game.SetStartTime(change.StartTime);

            game.SetField(change.Field);

            AppContext.checkpoint("appc.17");

            undoGameDataItem =
                await GameDataSources.updateGameInfoIfNotSet(context, game.GameNum, game.Field, OADate.OATimeFromMinutes(game.StartTime), false);
        }

        if (game.IsChampionship)
            await StructureInsert.insertChampionshipGameAtRange(appContext, context, game, change.Range);
        else
            await StructureInsert.insertGameAtRange(appContext, context, gridRef, game, change.Range, change.IsConnectedTop, change.IsConnectedBottom, change.ChangeOp == GridChangeOperation.InsertLite);

        AppContext.checkpoint("appc.18");

        context.releaseCacheObjectsUntil(bookmark);
        await context.sync("EAC release");

        return undoGameDataItem;
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.applyChanges

        apply the set of GridChanges calculated from a diff of two grids
    ----------------------------------------------------------------------------*/
    static async applyChanges(appContext: IAppContext, context: JsCtx, gridRef: Grid, changes: GridChange[], bracketName: string): Promise<UndoGameDataItem[]>
    {
        let undoGameDataItems: UndoGameDataItem[] = [];

        AppContext.checkpoint("appc.1");

        _TimerStack.pushTimer("applyChanges:executeRemoveChange");

        const removeTns: Intentions = new Intentions();
        await FastFormulaAreas.populateFastFormulaAreaCachesForAllSheets(context);

        // do all the removes first
        for (let item of changes)
        {
            AppContext.checkpoint("appc.2");
            if (item.ChangeOp == GridChangeOperation.Insert || item.ChangeOp == GridChangeOperation.InsertLite)
                continue;

            removeTns.AddTns(await this.executeRemoveChange(appContext, context, item, bracketName));
        }

        await removeTns.Execute(context);
        _TimerStack.popTimer();

        // must invalidate all of our caches
        context.releaseAllCacheObjects();
        // and now do all the adds

        _TimerStack.pushTimer("applyChanges:executeAddChange");
        AppContext.checkpoint("appc.12");
        for (let item of changes)
        {
            AppContext.checkpoint("appc.13");
            if (item.ChangeOp == GridChangeOperation.Remove || item.ChangeOp == GridChangeOperation.RemoveLite)
                continue;

            let undoGameDataItem: UndoGameDataItem =
                await this.executeAddChange(appContext, context, gridRef, item, bracketName);

            if (UndoManager.shouldPushGameDataItems(undoGameDataItem))
                undoGameDataItems.push(undoGameDataItem);
        }
        _TimerStack.popTimer();

        return undoGameDataItems;
    }
}