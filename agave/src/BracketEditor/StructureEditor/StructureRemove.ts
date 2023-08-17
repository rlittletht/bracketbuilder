import { IAppContext, AppContext } from "../../AppContext/AppContext";
import { RangeInfo, Ranges, RangeOverlapKind } from "../../Interop/Ranges";
import { GameLines } from "../GameLines";
import { GameFormatting } from "../GameFormatting";
import { BracketGame, IBracketGame } from "../BracketGame";
import { TeamNameMap, BracketSources } from "../../Brackets/BracketSources";
import { Grid } from "../Grid";
import { GridItem } from "../GridItem";
import { _undoManager } from "../Undo";
import { ApplyGridChange } from "./ApplyGridChange";
import { TrackingCache } from "../../Interop/TrackingCache";
import { JsCtx } from "../../Interop/JsCtx";
import { HelpTopic } from "../../HelpInfo";
import { FormulaBuilder } from "../FormulaBuilder";
import { FastRangeAreas } from "../../Interop/FastRangeAreas";

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
    static async obliterateGameRangeFromSheet(context: JsCtx, appContext: IAppContext, rangeInfo: RangeInfo, removeConnections: boolean)
    {
        appContext;
        let sheet: Excel.Worksheet = context.Ctx.workbook.worksheets.getActiveWorksheet();
        context.Ctx.trackedObjects.add(sheet);

        if (removeConnections)
        {
            // now go looking for connecting lines
            let feederLine: RangeInfo;

            feederLine = await GameLines.getFeedingLineRangeInfoNoCache(context, sheet, new RangeInfo(rangeInfo.FirstRow + 1, 1, rangeInfo.FirstColumn, 1), true);
            GameFormatting.removeAllGameFormatting(Ranges.rangeFromRangeInfo(sheet, feederLine));

            feederLine = await GameLines.getFeedingLineRangeInfoNoCache(context, sheet, new RangeInfo(rangeInfo.LastRow - 1, 1, rangeInfo.FirstColumn, 1), false);
            GameFormatting.removeAllGameFormatting(Ranges.rangeFromRangeInfo(sheet, feederLine));
        }

        let range: Excel.Range = Ranges.rangeFromRangeInfo(sheet, rangeInfo);
        context.Ctx.trackedObjects.add(range);
        GameFormatting.removeAllGameFormatting(range);

        //        await this.removeAllGameFormatting(context, range);
        range.load("rowIndex");
        range.load("columnIndex");

        // and now look for merged regions so we can find the outgoing line
        let areas: Excel.RangeAreas = range.getMergedAreasOrNullObject();

        await context.sync();

        if (!areas.isNullObject)
        {
            let mergedRange: Excel.Range = areas.areas.getItemAt(0);
            context.Ctx.trackedObjects.add(mergedRange);

            GameFormatting.removeAllGameFormatting(mergedRange);

            mergedRange.load("address");
            mergedRange.load("rowIndex");
            mergedRange.load("columnIndex");

            await context.sync();
            if (removeConnections)
            {
                // the middle row is the outgoing row
                let rangeLine: Excel.Range =
                    sheet.getRangeByIndexes(mergedRange.rowIndex + 1, mergedRange.columnIndex + 1, 1, 1);

                rangeLine.load("rowIndex");
                rangeLine.load("columnIndex");

                if (await GameFormatting.isCellInLineColumn(context, rangeLine))
                {
                    let feederLine: RangeInfo = await GameLines.getOutgoingLineRangeNoCache(
                        context,
                        sheet,
                        new RangeInfo(rangeLine.rowIndex, 1, rangeLine.columnIndex, 1));

                    GameFormatting.removeAllGameFormatting(Ranges.rangeFromRangeInfo(sheet, feederLine));
                }
            }

            mergedRange.unmerge();
            await context.sync();

            context.Ctx.trackedObjects.remove(range);
            context.Ctx.trackedObjects.remove(mergedRange);
            context.Ctx.trackedObjects.remove(sheet);
        }

        // lastly, deal with any named ranges in the range (the caller may have already dealt
        // with the games expected ranges
        const names = context.Ctx.workbook.names;
        names.load("items, items.name, items.formula, items.type");
        await context.sync();

        for (let _item of names.items)
        {
            if (_item.type == Excel.NamedItemType.error)
                _item.delete();
            else if (_item.type == Excel.NamedItemType.range)
            {
                if (RangeInfo.isOverlapping(rangeInfo, Ranges.createRangeInfoFromFormula(_item.formula)) != RangeOverlapKind.None)
                    _item.delete();
            }
        }
        await context.sync();
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.getTeamSourceNameOverrideValueForNamedRange

        returns the static source name for the game
        as well as the override (directly edited) value; or [null, null]
        if not overridden
    ----------------------------------------------------------------------------*/
    static async getTeamSourceNameOverrideValueForNamedRange(context: JsCtx, cellName: string, gameTeamName: string, fastRangeAreas?: FastRangeAreas)
        : Promise<string>
    {
        const rangeInfo = await RangeInfo.getRangeInfoForNamedCellFaster(context, cellName);
        if (rangeInfo == null)
            return null;

        let formulas: any[][];

        if (fastRangeAreas && fastRangeAreas.rowCountNeededToExpand(rangeInfo) == 0)
        {
            formulas = fastRangeAreas.getFormulasForRangeInfo(rangeInfo);
        }
        else
        {
            let range: Excel.Range = await Ranges.getRangeForNamedCell(context, cellName);

            if (range == null)
                return null;

            range.load("formulas");
            await context.sync();

            formulas = range.formulas;
        }

        const value: string = formulas[0][0];

        // if this team name is not static, then we don't propagate any direct typing
        if (!BracketGame.IsTeamSourceStatic(gameTeamName))
            return null;

        if (value[0] == "=")
        {
            // there was no direct edit. return no update
            return null;
        }

        return value;
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.getTeamSourceNameValueForNamedRange

        returns the calculated value for the game
    ----------------------------------------------------------------------------*/
    static async getTeamSourceNameValueForNamedRange(context: JsCtx, cellName: string, fastRangeAreas?: FastRangeAreas): Promise<string>
    {
        const rangeInfo = await RangeInfo.getRangeInfoForNamedCellFaster(context, cellName);
        if (rangeInfo == null)
            return "";

        let values: any[][];

        if (fastRangeAreas && fastRangeAreas.rowCountNeededToExpand(rangeInfo) == 0)
        {
            values = fastRangeAreas.getValuesForRangeInfo(rangeInfo);
        }
        else
        {
            let range: Excel.Range = await Ranges.getRangeForNamedCell(context, cellName);

            if (range == null)
                return "";

            range.load("values");
            await context.sync();
            values = range.values;
        }

        return values[0][0];
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.getFieldAndTimeOverrideValuesForNamedRange

        Given the name of the gameinfo cell, remove the named range and return
        the values for the field# and the time
    ----------------------------------------------------------------------------*/
    static async getFieldAndTimeOverrideValuesForNamedRange(context: JsCtx, cellName: string, fastRangeAreas?: FastRangeAreas): Promise<[any, any]>
    {
        const rangeInfo = await RangeInfo.getRangeInfoForNamedCellFaster(context, cellName);
        if (rangeInfo == null)
            return [null, 0];

        let formulas: any[][];

        if (fastRangeAreas && fastRangeAreas.rowCountNeededToExpand(rangeInfo) == 0)
        {
            const gameNumRange = rangeInfo.offset(0, 3, -1, 1);

            formulas = fastRangeAreas.getFormulasForRangeInfo(gameNumRange);
        }
        else
        {
            let range: Excel.Range = await Ranges.getRangeForNamedCell(context, cellName);

            if (range == null)
                return [null, 0];

            range.load("address, rowIndex, rowCount, columnIndex, columnCount");
            await context.sync();
            const gameNumRange: RangeInfo = RangeInfo.createFromRange(range);

            range = Ranges.rangeFromRangeInfo(
                range.worksheet,
                gameNumRange.offset(0, 3, -1, 1));

            range.load("formulas");
            await context.sync();

            formulas = range.formulas;
        }

        const field: any = formulas[0][0];
        const time: any = formulas[2][0];

        return [field, time];
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureRemove.updateBracketSourcesWithOverrides

        get any direct edits from these ranges and propagate these edits to the
        bracket sources table
    ----------------------------------------------------------------------------*/
    static async updateBracketSourcesWithOverrides(context: JsCtx, game: IBracketGame)
    {
        let overrideText1: string;
        let overrideText2: string;
        let field: string;
        let time: number;

        if (game.IsChampionship)
            return;

        overrideText1 = await this.getTeamSourceNameOverrideValueForNamedRange(context, game.TopTeamCellName, game.TopTeamName);
        overrideText2 = await this.getTeamSourceNameOverrideValueForNamedRange(context, game.BottomTeamCellName, game.BottomTeamName);
        [field, time] = await this.getFieldAndTimeOverrideValuesForNamedRange(context, game.GameNumberCellName);

        let map: TeamNameMap[] = [];

        if (overrideText1 && overrideText1 != null && overrideText1 != "")
            map.push(
                {
                    teamNumber: FormulaBuilder.getTeamNumberFromTeamNum(game.TopTeamName),
                    name: overrideText1,
                    priority: 0
                });
        if (overrideText2 && overrideText2 != null && overrideText2 != "")
            map.push(
                {
                    teamNumber: FormulaBuilder.getTeamNumberFromTeamNum(game.BottomTeamName),
                    name: overrideText2,
                    priority: 0
                });

        await BracketSources.updateBracketSourcesTeamNames(context, map);
        if (field && field != null && field != "")
            await BracketSources.updateGameInfo(context, game.GameId.GameNum, field, time, game.SwapTopBottom);

        console.log(`saved: ${game.TopTeamName}=${overrideText1}, ${game.BottomTeamName}=${overrideText2}, field=${field}, time=${time}`);
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.removeNamedRangesAndUpdateBracketSources

        remove the named ranges for this game. 
    ----------------------------------------------------------------------------*/
    static async removeNamedRanges(context: JsCtx, game: IBracketGame)
    {
        await Ranges.ensureGlobalNameDeleted(context, game.TopTeamCellName);
        await Ranges.ensureGlobalNameDeleted(context, game.BottomTeamCellName);
        await Ranges.ensureGlobalNameDeleted(context, game.GameNumberCellName);
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.removeGame

        Remove the given bracket game from the sheet.
        If only the rangeinfo is provided, then use that as the range to remove.
        If both are provided, they must be consistent.
    ----------------------------------------------------------------------------*/
    static async removeGame(appContext: IAppContext, context: JsCtx, game: IBracketGame, range: RangeInfo, removeConnections: boolean, liteRemove: boolean)
    {
        AppContext.checkpoint("remgm.1");

        if (range != null && game != null && game.IsLinkedToBracket && !game.IsBroken)
        {
            AppContext.checkpoint("remgm.2");
            if (!range.isEqual(game.FullGameRange))
                throw new Error("remove game: bound game range != given range");
            AppContext.checkpoint("remgm.3");
        }

        if (game != null && (game.IsLinkedToBracket || game.IsBroken))
        {
            if (!game.IsBroken)
                await this.updateBracketSourcesWithOverrides(context, game)

            if (!liteRemove)
                await this.removeNamedRanges(context, game);
            /*
                        // obliterate can't deal with the named ranges (there's no way to map
                        // range back to named item), but we know the names, so we can delete them
                        AppContext.checkpoint("remgm.6");
                        await Ranges.ensureGlobalNameDeleted(context, game.TopTeamCellName);
                        AppContext.checkpoint("remgm.7");
                        await Ranges.ensureGlobalNameDeleted(context, game.BottomTeamCellName);
                        AppContext.checkpoint("remgm.8");
                        await Ranges.ensureGlobalNameDeleted(context, game.GameNumberCellName);
                        AppContext.checkpoint("remgm.9");*/
        }

        AppContext.checkpoint("remgm.4");
        if (!liteRemove)
            await this.obliterateGameRangeFromSheet(context, appContext, range == null ? game.FullGameRange : range, removeConnections);

        AppContext.checkpoint("remgm.5");
    }

    static async removeBoundGame(appContext: IAppContext, context: JsCtx, grid: Grid, game: IBracketGame, rangeSelected: RangeInfo)
    {
        if (game.IsBroken)
        {
            let topRow = Number.MAX_VALUE;
            let bottomRow = 0;
            let firstCol = Number.MAX_VALUE;
            let lastCol = 0;
            let setRange = false;

            // guess at the full range
            if (game.TopTeamRange)
            {
                topRow = Math.min(topRow, game.TopTeamRange.FirstRow);
                firstCol = Math.min(firstCol, game.TopTeamRange.FirstColumn);
                bottomRow = Math.max(bottomRow, game.TopTeamRange.LastRow + 1);
                lastCol = Math.max(lastCol, game.TopTeamRange.LastColumn + 2);
                setRange = true;
            }
            if (game.GameIdRange)
            {
                topRow = Math.min(topRow, game.GameIdRange.FirstRow - 1);
                firstCol = Math.min(firstCol, game.GameIdRange.FirstColumn - 1);
                bottomRow = Math.max(bottomRow, game.GameIdRange.LastRow + 2); // check this
                lastCol = Math.max(lastCol, game.GameIdRange.LastColumn + 1);
                setRange = true;
            }
            if (game.BottomTeamRange)
            {
                topRow = Math.min(topRow, game.BottomTeamRange.FirstRow - 1);
                firstCol = Math.min(firstCol, game.BottomTeamRange.FirstColumn);
                bottomRow = Math.max(bottomRow, game.BottomTeamRange.LastRow);
                lastCol = Math.max(lastCol, game.BottomTeamRange.LastColumn + 2);
                setRange = true;
            }

            if (!setRange)
                throw new Error(`could not find any range for the broken game ${game.GameId.Value}`);

            rangeSelected = new RangeInfo(topRow, bottomRow - topRow + 1, firstCol, lastCol - firstCol + 1);
            // can't let the normal (undoable) remove happen. need to obliterate the selection
            await this.removeGame(appContext, context, game, rangeSelected, false, false /*liteRemove*/);
            return;
        }

        // if we can't bind to the game, and if the selection is a single cell, then
        // we can't do anything
        if (!game.IsLinkedToBracket && rangeSelected.RowCount <= 1 && rangeSelected.ColumnCount <= 1 && !game.IsBroken)
        {
            appContext.Messages.error(
                [`Cannot find game ${game.GameId.Value} in the bracket`],
                { topic: HelpTopic.FAQ_BrokenBracket });

            return;
        }

        // find the given game in the grid
        let items: GridItem[] = grid.getAllGameItems(game.GameId);

        if (items.length > 0)
        {
            let gridNew: Grid = grid.clone();

            gridNew.removeItems(items);

            // remove won't change any field/times
            _undoManager.setUndoGrid(grid, []);
            await ApplyGridChange.diffAndApplyChanges(appContext, context, grid, gridNew, game.BracketName);
            return;
        }
    }
    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.findAndRemoveGame

        If there is a selected range, and that range doesn't overlap any known
        bracket games, then we will assume the user is trying to unformat a game
        that is corrupted (missing name definitions). Remove all the game
        formatting in the range

        If there is no selected range, then find the given game and remove it.

    ----------------------------------------------------------------------------*/
    static async findAndRemoveGame(appContext: IAppContext, context: JsCtx, game: IBracketGame, bracketName: string)
    {
        const bookmark: string = "findAndRemoveGame";

        context.pushTrackingBookmark(bookmark);

        // load the grid
        let grid: Grid = await Grid.createGridFromBracket(context, bracketName);
        let rangeSelected: RangeInfo = await Ranges.createRangeInfoForSelection(context);

        if (game == null && rangeSelected.IsSingleCell)
        {
            // see if we are intersecting a game and that is what we will remove
            const [item, kind] = grid.getFirstOverlappingItem(rangeSelected);

            if (kind != RangeOverlapKind.None && item != null && !item.isLineRange)
            {
                game = await BracketGame.CreateFromGameId(context, bracketName, item.GameId);
            }
        }

        const games: IBracketGame[] = [];

        if (game != null)
        {
            await game.Bind(context, appContext);
            games.push(game);
        }

        if (game == null)
        {
            // check for any games that overlap the selection
            const items = grid.getOverlappingItems(rangeSelected);

            for (let _item of items)
            {
                if (!_item.isLineRange)
                    games.push(await BracketGame.CreateFromGameId(context, bracketName, _item.GameId));
            }
        }

        context.releaseCacheObjectsUntil(bookmark)
        await context.sync();

        for (let _game of games)
            await this.removeBoundGame(appContext, context, grid, _game, rangeSelected);

        // last, obliterate the rest of the range
        if (!rangeSelected.IsSingleCell)
            await this.removeGame(appContext, context, null, rangeSelected, false, false /*liteRemove*/);
    }
}