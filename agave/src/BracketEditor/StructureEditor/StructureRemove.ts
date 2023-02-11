import { IAppContext, IAppContext as IAppContext1, IAppContext as IAppContext2, AppContext } from "../../AppContext";
import { RangeInfo, Ranges, RangeOverlapKind } from "../../Interop/Ranges";
import { GameLines } from "../GameLines";
import { GameFormatting } from "../GameFormatting";
import { BracketGame, IBracketGame } from "../BracketGame";
import { TeamNameMap, BracketSources } from "../../Brackets/BracketSources";
import { Grid } from "../Grid";
import { GridItem } from "../GridItem";
import { _undoManager } from "../Undo";
import { ApplyGridChange } from "./ApplyGridChange";

export class StructureRemove
{
    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.obliterateGameRangeFromSheet

        remove all traces of this game, including any lines extending into and
        out of it.

        The provided range has to include the top and bottom team names, the
        score column, and the line column. (most times this will be provided
        via getRangeInfoForGame)

        this does NOT take care of pushing data back to the bracket sources.
        this is the last step in deleting a game from the sheet.

        UNDONE: if there are any named ranges, they will be removed as well
        (there doesn't appear to be an API for this in javascript, so we will
        rely on the caller to cleanup the names)
    ----------------------------------------------------------------------------*/
    static async obliterateGameRangeFromSheet(ctx: any, appContext: IAppContext, rangeInfo: RangeInfo, removeConnections: boolean)
    {
        appContext;
        let sheet: Excel.Worksheet = ctx.workbook.worksheets.getActiveWorksheet();
        ctx.trackedObjects.add(sheet);

        if (removeConnections)
        {
            // now go looking for connecting lines
            let feederLine: RangeInfo;

            feederLine = await GameLines.getFeedingLineRangeInfo(ctx, sheet, new RangeInfo(rangeInfo.FirstRow + 1, 1, rangeInfo.FirstColumn, 1), true);
            GameFormatting.removeAllGameFormatting(Ranges.rangeFromRangeInfo(sheet, feederLine));

            feederLine = await GameLines.getFeedingLineRangeInfo(ctx, sheet, new RangeInfo(rangeInfo.LastRow - 1, 1, rangeInfo.FirstColumn, 1), false);
            GameFormatting.removeAllGameFormatting(Ranges.rangeFromRangeInfo(sheet, feederLine));
        }

        let range: Excel.Range = Ranges.rangeFromRangeInfo(sheet, rangeInfo);
        ctx.trackedObjects.add(range);
        GameFormatting.removeAllGameFormatting(range);

        //        await this.removeAllGameFormatting(ctx, range);
        range.load("rowIndex");
        range.load("columnIndex");

        // and now look for merged regions so we can find the outgoing line
        let areas: Excel.RangeAreas = range.getMergedAreasOrNullObject();

        await ctx.sync();

        if (!areas.isNullObject)
        {
            let mergedRange: Excel.Range = areas.areas.getItemAt(0);
            ctx.trackedObjects.add(mergedRange);

            GameFormatting.removeAllGameFormatting(mergedRange);

            mergedRange.load("address");
            mergedRange.load("rowIndex");
            mergedRange.load("columnIndex");

            await ctx.sync();
            if (removeConnections)
            {
                // the middle row is the outgoing row
                let rangeLine: Excel.Range =
                    sheet.getRangeByIndexes(mergedRange.rowIndex + 1, mergedRange.columnIndex + 1, 1, 1);

                rangeLine.load("rowIndex");
                rangeLine.load("columnIndex");

                if (await GameFormatting.isCellInLineColumn(ctx, rangeLine))
                {
                    let feederLine: RangeInfo = await GameLines.getOutgoingLineRange(
                        ctx,
                        sheet,
                        new RangeInfo(rangeLine.rowIndex, 1, rangeLine.columnIndex, 1));

                    GameFormatting.removeAllGameFormatting(Ranges.rangeFromRangeInfo(sheet, feederLine));
                }
            }

            mergedRange.unmerge();
            await ctx.sync();

            ctx.trackedObjects.remove(range);
            ctx.trackedObjects.remove(mergedRange);
            ctx.trackedObjects.remove(sheet);
        }
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.removeNamedRangeAndUpdateBracketSource
    ----------------------------------------------------------------------------*/
    static async removeNamedRangeAndUpdateBracketSource(ctx: any, cellName: string, gameTeamName: string): Promise<[string, string]>
    {
        let range: Excel.Range = await Ranges.getRangeForNamedCell(ctx, cellName);

        if (range == null)
            return [null, null];

        range.load("formulas");
        await ctx.sync();

        const value: string = range.formulas[0][0];
        await Ranges.ensureGlobalNameDeleted(ctx, cellName);

        // if this team name is not static, then we don't propagate any direct typing
        if (!BracketGame.IsTeamSourceStatic(gameTeamName))
            return [null, null];

        if (value[0] == "=")
        {
            // there was no direct edit. return no update
            return [null, null];
        }

        return [gameTeamName, value];
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.removeGameInfoNamedRangeAndUpdateBracketSource

        Given the name of the gameinfo cell, remove the named range and return
        the values for the field# and the time
    ----------------------------------------------------------------------------*/
    static async removeGameInfoNamedRangeAndUpdateBracketSource(ctx: any, cellName: string): Promise<[any, any]>
    {
        let range: Excel.Range = await Ranges.getRangeForNamedCell(ctx, cellName);

        if (range == null)
            return [null, 0];

        range.load("address, rowIndex, rowCount, columnIndex, columnCount");
        await ctx.sync();
        const gameNumRange: RangeInfo = RangeInfo.createFromRange(range);

        range = Ranges.rangeFromRangeInfo(
            range.worksheet,
            gameNumRange.offset(0, 3, -1, 1));

        range.load("formulas");
        await ctx.sync();

        const field: any = range.formulas[0][0];
        const time: any = range.formulas[2][0];

        await Ranges.ensureGlobalNameDeleted(ctx, cellName);

        return [field, time];
    }


    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.removeNamedRangesAndUpdateBracketSources

        remove the named ranges for this game. also, get any direct edits from
        these ranges and propagate these edits to the bracket sources table
    ----------------------------------------------------------------------------*/
    static async removeNamedRangesAndUpdateBracketSources(ctx: any, game: IBracketGame)
    {
        let gameTeamName1: string;
        let overrideText1: string;
        let gameTeamName2: string;
        let overrideText2: string;
        let field: string;
        let time: number;

        [gameTeamName1, overrideText1] = await this.removeNamedRangeAndUpdateBracketSource(ctx, game.TopTeamCellName, game.TopTeamName);

        if (game.IsChampionship)
            return;

        [gameTeamName2, overrideText2] = await this.removeNamedRangeAndUpdateBracketSource(ctx, game.BottomTeamCellName, game.BottomTeamName);

        [field, time] = await this.removeGameInfoNamedRangeAndUpdateBracketSource(ctx, game.GameNumberCellName);

        let map: TeamNameMap[] = [];

        if (overrideText1 && overrideText1 != null && overrideText1 != "")
            map.push(
                {
                    teamNum: gameTeamName1,
                    name: overrideText1
                });
        if (overrideText2 && overrideText2 != null && overrideText2 != "")
            map.push(
                {
                    teamNum: gameTeamName2,
                    name: overrideText2
                });

        await BracketSources.updateBracketSourcesTeamNames(ctx, map);
        if (field && field != null && field != "")
            await BracketSources.updateGameInfo(ctx, game.GameId.GameNum, field, time, game.SwapTopBottom);

        console.log(`saved: ${gameTeamName1}=${overrideText1}, ${gameTeamName2}=${overrideText2}, field=${field}, time=${time}`);
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.removeGame

        Remove the given bracket game from the sheet.
        If only the rangeinfo is provided, then use that as the range to remove.
        If both are provided, they must be consistent.
    ----------------------------------------------------------------------------*/
    static async removeGame(appContext: IAppContext1, ctx: any, game: IBracketGame, range: RangeInfo, removeConnections: boolean)
    {
        AppContext.checkpoint("remgm.1");

        if (range != null && game != null && game.IsLinkedToBracket)
        {
            AppContext.checkpoint("remgm.2");
            if (!range.isEqual(game.FullGameRange))
                throw "remove game: bound game range != given range";
            AppContext.checkpoint("remgm.3");
        }

        if (game != null && game.IsLinkedToBracket)
        {
            await this.removeNamedRangesAndUpdateBracketSources(ctx, game);
            /*
                        // obliterate can't deal with the named ranges (there's no way to map
                        // range back to named item), but we know the names, so we can delete them
                        AppContext.checkpoint("remgm.6");
                        await Ranges.ensureGlobalNameDeleted(ctx, game.TopTeamCellName);
                        AppContext.checkpoint("remgm.7");
                        await Ranges.ensureGlobalNameDeleted(ctx, game.BottomTeamCellName);
                        AppContext.checkpoint("remgm.8");
                        await Ranges.ensureGlobalNameDeleted(ctx, game.GameNumberCellName);
                        AppContext.checkpoint("remgm.9");*/
        }

        AppContext.checkpoint("remgm.4");
        await this.obliterateGameRangeFromSheet(ctx, appContext, range == null ? game.FullGameRange : range, removeConnections);

        AppContext.checkpoint("remgm.5");
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.findAndRemoveGame

        If there is a selected range, and that range doesn't overlap any known
        bracket games, then we will assume the user is trying to unformat a game
        that is corrupted (missing name definitions). Remove all the game
        formatting in the range

        If there is no selected range, then find the given game and remove it.

    ----------------------------------------------------------------------------*/
    static async findAndRemoveGame(appContext: IAppContext2, ctx: any, game: IBracketGame, bracketName: string)
    {
        // load the grid
        let grid: Grid = await Grid.createGridFromBracket(ctx, bracketName);
        const rangeSelected: RangeInfo = await Ranges.createRangeInfoForSelection(ctx);

        if (game == null && rangeSelected.IsSingleCell)
        {
            // see if we are intersecting a game and that is what we will remove
            const [item, kind] = grid.getFirstOverlappingItem(rangeSelected);

            if (kind != RangeOverlapKind.None && item != null && !item.isLineRange)
            {
                game = await BracketGame.CreateFromGameId(ctx, bracketName, item.GameId);
            }
        }

        await game.Bind(ctx);

        // if we can't bind to the game, and if the selection is a single cell, then
        // we can't do anything
        if (!game.IsLinkedToBracket && rangeSelected.RowCount <= 1 && rangeSelected.ColumnCount <= 1)
        {
            appContext.log(`Cannot find game ${game.GameId.Value} in the bracket`);
            return;
        }

        // first, see if the selected range overlaps any known games
        if (!rangeSelected.IsSingleCell)
        {
            if (grid.doesRangeOverlap(rangeSelected) == RangeOverlapKind.None)
            {
                await this.removeGame(appContext, ctx, null, rangeSelected, true);
                return;
            }
        }

        // find the given game in the grid
        let items: GridItem[] = grid.getAllGameItems(game.GameId);

        if (items.length > 0)
        {
            let gridNew: Grid = grid.clone();

            gridNew.removeItems(items);

            // remove won't change any field/times
            _undoManager.setUndoGrid(grid, []);
            await ApplyGridChange.diffAndApplyChanges(appContext, ctx, grid, gridNew, game.BracketName);
            return;
        }

        // we're linked to a game, so we can go straight to it and obliterate it
        //        await this.removeGame(appContext, ctx, game, rangeSelected);

        //        await game.Bind(ctx);
    }
}