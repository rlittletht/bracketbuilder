import { IAppContext, IAppContext as IAppContext1, IAppContext as IAppContext2, IAppContext as IAppContext3, AppContext } from "../../AppContext";
import { Grid } from "../Grid";
import { GridChange, GridChangeOperation } from "../GridChange";
import { GameFormatting } from "../GameFormatting";
import { Ranges } from "../../Interop/Ranges";
import { IBracketGame, BracketGame } from "../BracketGame";
import { StructureRemove } from "./StructureRemove";
import { StructureInsert } from "./StructureInsert";
import { BracketSources } from "../../Brackets/BracketSources";
import { OADate } from "../../Interop/Dates";
import { UndoGameDataItem, UndoManager } from "../Undo";
import { TrackingCache } from "../../Interop/TrackingCache";

export class ApplyGridChange
{
    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.diffAndApplyChanges

        Take two grids, diff them, and apply the changes
    ----------------------------------------------------------------------------*/
    static async diffAndApplyChanges(appContext: IAppContext, ctx: any, grid: Grid, gridNew: Grid, bracketName: string): Promise<UndoGameDataItem[]>
    {
        // now, diff the grids
        const changes: GridChange[] = grid.diff(gridNew, bracketName);

        grid.logChanges(changes);

        return await this.applyChanges(appContext, ctx, changes, bracketName);
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.executeRemoveChange
    ----------------------------------------------------------------------------*/
    static async executeRemoveChange(appContext: IAppContext1, ctx: any, change: GridChange, bracketName: string)
    {
        if (change.IsLine)
        {
            AppContext.checkpoint("appc.3");
            // simple, just remove the line formatting
            GameFormatting.removeAllGameFormatting(
                Ranges.rangeFromRangeInfo(ctx.workbook.worksheets.getActiveWorksheet(), change.Range));

            AppContext.checkpoint("appc.4");
            await ctx.sync();
            AppContext.checkpoint("appc.5");
            return;
        }

        AppContext.checkpoint("appc.6");
        // if its a game, then we have to completely remove it, including its
        // named ranges
        let cache: TrackingCache = new TrackingCache();
        let game: IBracketGame = await BracketGame.CreateFromGameId(ctx, cache, bracketName, change.GameId);
        cache.ReleaseAll(ctx);
        cache = null;
        await ctx.sync();

        AppContext.checkpoint("appc.7");
        // if we couldn't create the game, or if its not linked to the bracket, then
        // just delete the range
        if (game == null || !game.IsLinkedToBracket)
        {
            AppContext.checkpoint("appc.8");
            await StructureRemove.removeGame(appContext, ctx, null, change.Range, false);
            AppContext.checkpoint("appc.9");
        }
        else
        {
            AppContext.checkpoint("appc.10");
            await StructureRemove.removeGame(appContext, ctx, game, change.Range, false);
            AppContext.checkpoint("appc.11");
        }
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.executeAddChange
    ----------------------------------------------------------------------------*/
    static async executeAddChange(appContext: IAppContext2, ctx: any, change: GridChange, bracketName: string): Promise<UndoGameDataItem>
    {
        const cache: TrackingCache = new TrackingCache();

        AppContext.checkpoint("appc.14");
        if (change.IsLine)
        {
            AppContext.checkpoint("appc.14.1");

            // just format the range as an underline
            GameFormatting.formatConnectingLineRangeRequest(
                Ranges.rangeFromRangeInfo(
                    ctx.workbook.worksheets.getActiveWorksheet(),
                    change.Range));

            AppContext.checkpoint("appc.14.2");
            return new UndoGameDataItem(undefined, undefined, undefined, undefined, undefined);
        }

        let game: BracketGame = new BracketGame();

        AppContext.checkpoint("appc.15");
        await game.Load(ctx, appContext, cache, bracketName, change.GameId.GameNum);
        AppContext.checkpoint("appc.16");
        if (game.IsLinkedToBracket)
            throw "game can't be linked - we should have already removed it from the bracket";

        game.SetSwapTopBottom(change.SwapTopBottom);
        game.SetStartTime(change.StartTime);
        game.SetField(change.Field);

        AppContext.checkpoint("appc.17");

        const undoGameDataItem: UndoGameDataItem =
            await BracketSources.updateGameInfoIfNotSet(ctx, game.GameNum, game.Field, OADate.OATimeFromMinutes(game.StartTime), false);

        if (game.IsChampionship)
            await StructureInsert.insertChampionshipGameAtRange(appContext, ctx, game, change.Range);
        else
            await StructureInsert.insertGameAtRange(appContext, ctx, game, change.Range, change.IsConnectedTop, change.IsConnectedBottom);

        AppContext.checkpoint("appc.18");

        cache.ReleaseAll(ctx);
        await ctx.sync();

        return undoGameDataItem;
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.applyChanges

        apply the set of GridChanges calculated from a diff of two grids
    ----------------------------------------------------------------------------*/
    static async applyChanges(appContext: IAppContext3, ctx: any, changes: GridChange[], bracketName: string): Promise<UndoGameDataItem[]>
    {
        let undoGameDataItems: UndoGameDataItem[] = [];

        AppContext.checkpoint("appc.1");

        // do all the removes first
        for (let item of changes)
        {
            AppContext.checkpoint("appc.2");
            if (item.ChangeOp == GridChangeOperation.Insert)
                continue;

            await this.executeRemoveChange(appContext, ctx, item, bracketName);
        }

        // and now do all the adds

        AppContext.checkpoint("appc.12");
        for (let item of changes)
        {
            AppContext.checkpoint("appc.13");
            if (item.ChangeOp == GridChangeOperation.Remove)
                continue;

            let undoGameDataItem: UndoGameDataItem =
                await this.executeAddChange(appContext, ctx, item, bracketName);

            if (UndoManager.shouldPushGameDataItems(undoGameDataItem))
                undoGameDataItems.push(undoGameDataItem);
        }

        return undoGameDataItems;
    }
}