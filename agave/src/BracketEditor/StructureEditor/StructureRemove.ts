import { AppContext, IAppContext } from "../../AppContext/AppContext";
import { GameDataSources, TeamNameMap } from "../../Brackets/GameDataSources";
import { HelpTopic } from "../../Coaching/HelpInfo";
import { FastFormulaAreas, FastFormulaAreasItems } from "../../Interop/FastFormulaAreas";
import { IIntention } from "../../Interop/Intentions/IIntention";
import { TnDeleteGlobalName } from "../../Interop/Intentions/TnDeleteGlobalName";
import { TnUnmergeRange } from "../../Interop/Intentions/TnUmergeRange";
import { JsCtx } from "../../Interop/JsCtx";
import { RangeInfo, RangeOverlapKind, Ranges } from "../../Interop/Ranges";
import { ObjectType } from "../../Interop/TrackingCache";
import { _TimerStack } from "../../PerfTimer";
import { BracketGame, IBracketGame } from "../BracketGame";
import { FormulaBuilder } from "../FormulaBuilder";
import { GameFormatting } from "../GameFormatting";
import { GameLines } from "../GameLines";
import { Grid, GridColumnType } from "../Grid";
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
    static async obliterateGameRangeFromSheet(context: JsCtx, appContext: IAppContext, rangeInfo: RangeInfo, removeConnections: boolean): Promise<IIntention[]>
    {
        const tns = [];
        const fastFormulaAreas = FastFormulaAreas.getGridFastFormulaAreaCache(context);

        appContext;
        let sheet: Excel.Worksheet = context.Ctx.workbook.worksheets.getActiveWorksheet();
        context.Ctx.trackedObjects.add(sheet);

        if (removeConnections)
        {
            // now go looking for connecting lines
            let feederLine: RangeInfo;

            feederLine = GameLines.getFeedingLineRangeInfo(fastFormulaAreas, new RangeInfo(rangeInfo.FirstRow + 1, 1, rangeInfo.FirstColumn, 1), true);
            tns.push(...GameFormatting.tnsRemoveAllGameFormatting(feederLine));

            feederLine = GameLines.getFeedingLineRangeInfo(fastFormulaAreas, new RangeInfo(rangeInfo.LastRow - 1, 1, rangeInfo.FirstColumn, 1), false);
            tns.push(...GameFormatting.tnsRemoveAllGameFormatting(feederLine));
        }

        //        let range: Excel.Range = Ranges.rangeFromRangeInfo(sheet, rangeInfo);
        //        context.Ctx.trackedObjects.add(range);
        tns.push(...GameFormatting.tnsRemoveAllGameFormatting(rangeInfo));

//        await this.removeAllGameFormatting(context, range);
        // don't try to remove the outgoing feed if we don't have at least 9 rows (we are either broken,
        // or we are the championship game)
        if (rangeInfo.RowCount >= 9)
        {
            const gameInfoRange = Grid.getRangeInfoForGameInfo(rangeInfo);
            //        range.load("rowIndex");
            //        range.load("columnIndex");

            // and now look for merged regions so we can find the outgoing line
            //        let areas: Excel.RangeAreas = range.getMergedAreasOrNullObject();
            //
            //        await context.sync();

            if (removeConnections)
            {
                // the middle row is the outgoing row
                const rangeLine = new RangeInfo(gameInfoRange.FirstRow + 1, 1, gameInfoRange.FirstColumn + 1, 1);

                const checkLine = fastFormulaAreas.getFormulasForRangeInfo(rangeLine);
                if (GameFormatting.isLineColumnTypeMatch(checkLine[0][0], GridColumnType.Line))
                {
                    const feederLine = GameLines.getOutgoingLineRange(fastFormulaAreas, rangeLine)
                    tns.push(...GameFormatting.tnsRemoveAllGameFormatting(feederLine));
                }
                //        if (!areas.isNullObject)
                //        {
                //            let mergedRange: Excel.Range = areas.areas.getItemAt(0);
                //            context.Ctx.trackedObjects.add(mergedRange);
                //
                //            GameFormatting.removeAllGameFormatting(mergedRange);
                //
                //            mergedRange.load("address");
                //            mergedRange.load("rowIndex");
                //            mergedRange.load("columnIndex");
                //
                //            await context.sync();
                //            if (removeConnections)
                //            {
                //                // the middle row is the outgoing row
                //                let rangeLine: Excel.Range =
                //                    sheet.getRangeByIndexes(mergedRange.rowIndex + 1, mergedRange.columnIndex + 1, 1, 1);
                //
                //                rangeLine.load("rowIndex");
                //                rangeLine.load("columnIndex");
                //
                //                if (await GameFormatting.isCellInLineColumn(context, rangeLine))
                //                {
                //                    let feederLine: RangeInfo = await GameLines.getOutgoingLineRangeNoCache(
                //                        context,
                //                        sheet,
                //                        new RangeInfo(rangeLine.rowIndex, 1, rangeLine.columnIndex, 1));
                //
                //                    GameFormatting.removeAllGameFormatting(Ranges.rangeFromRangeInfo(sheet, feederLine));
                //                }
                //            }
            }
        }
        tns.push(TnUnmergeRange.Create(rangeInfo));
        //            mergedRange.unmerge();
        //            await context.sync();
        //
        //            context.Ctx.trackedObjects.remove(range);
        //            context.Ctx.trackedObjects.remove(mergedRange);
        //            context.Ctx.trackedObjects.remove(sheet);


        // lastly, deal with any named ranges in the range (the caller may have already dealt
        // with the games expected ranges
        const names = await context.getTrackedItemOrPopulate(
            "workbookNamesItems",
            async (context): Promise<any> =>
            {
                context.Ctx.workbook.load("names");
                await context.sync("GTI names");
                return { type: ObjectType.JsObject, o: context.Ctx.workbook.names.items };
            });

        for (let _item of names)
        {
            if (_item.type == Excel.NamedItemType.error)
                tns.push(TnDeleteGlobalName.Create(_item.name));
            else if (_item.type == Excel.NamedItemType.range)
            {
                if (RangeInfo.isOverlapping(rangeInfo, Ranges.createRangeInfoFromFormula(_item.formula)) != RangeOverlapKind.None)
                    tns.push(TnDeleteGlobalName.Create(_item.name));
            }
        }
        return tns;
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.getTeamSourceNameOverrideValueForNamedRange

        returns the static source name for the game
        as well as the override (directly edited) value; or [null, null]
        if not overridden
    ----------------------------------------------------------------------------*/
    static async getTeamSourceNameOverrideValueForNamedRange(context: JsCtx, cellName: string, gameTeamName: string)
        : Promise<string>
    {
        const fastFormulaAreas = FastFormulaAreas.getGridFastFormulaAreaCache(context);

        const rangeInfo = await RangeInfo.getRangeInfoForNamedCellFaster(context, cellName);
        if (rangeInfo == null)
            return null;

        let formulas: any[][];

        if (fastFormulaAreas && fastFormulaAreas.rowCountNeededToExpand(rangeInfo) == 0)
        {
            formulas = fastFormulaAreas.getFormulasForRangeInfo(rangeInfo);
        }
        else
        {
            let range: Excel.Range = await Ranges.getRangeForNamedCell(context, cellName);

            if (range == null)
                return null;

            range.load("formulas");
            await context.sync("ovr namedCell");

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
    static async getTeamSourceNameValueForNamedRange(context: JsCtx, cellName: string): Promise<string>
    {
        const fastFormulaAreas: FastFormulaAreas = FastFormulaAreas.getFastFormulaAreaCacheForType(context, FastFormulaAreasItems.GameGrid);

        const rangeInfo = await RangeInfo.getRangeInfoForNamedCellFaster(context, cellName);
        if (rangeInfo == null)
            return "";

        let values: any[][];

        if (fastFormulaAreas && fastFormulaAreas.rowCountNeededToExpand(rangeInfo) == 0)
        {
            values = fastFormulaAreas.getValuesForRangeInfo(rangeInfo);
        }
        else
        {
            let range: Excel.Range = await Ranges.getRangeForNamedCell(context, cellName);

            if (range == null)
                return "";

            range.load("values");
            await context.sync("gm namedCell");
            values = range.values;
        }

        return values[0][0];
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.getFieldAndTimeOverrideValuesForNamedRange

        Given the name of the gameinfo cell, remove the named range and return
        the values for the field# and the time
    ----------------------------------------------------------------------------*/
    static async getFieldAndTimeOverrideValuesForNamedRange(context: JsCtx, cellName: string): Promise<[any, any]>
    {
        const fastFormulaAreas: FastFormulaAreas = FastFormulaAreas.getFastFormulaAreaCacheForType(context, FastFormulaAreasItems.GameGrid);

        const rangeInfo = await RangeInfo.getRangeInfoForNamedCellFaster(context, cellName);
        if (rangeInfo == null)
            return [null, 0];

        let formulas: any[][];

        if (fastFormulaAreas && fastFormulaAreas.rowCountNeededToExpand(rangeInfo) == 0)
        {
            const gameNumRange = rangeInfo.offset(0, 1, -1, 1);

            // we cam only get formulas for one cell at a time, so get the ones we want and push them
            // into the formulas so we can deconstruct later
            const f1 = fastFormulaAreas.getFormulasForRangeInfo(gameNumRange.offset(0, 1, 0, 1));
            const f2 = fastFormulaAreas.getFormulasForRangeInfo(gameNumRange.offset(2, 1, 0, 1));
            formulas =
                [
                    [f1[0][0]],
                    [],
                    [f2[0][0]]
                ];
//            formulas.push([]);
//            formulas[0] = [];
//            formulas[0].push(f1[0][0]);
//            formulas.push([]);
//            formulas.push([]);
//            formulas[2].push(f2[0][0]);
        }
        else
        {
            let range: Excel.Range = await Ranges.getRangeForNamedCell(context, cellName);

            if (range == null)
                return [null, 0];

            range.load("address, rowIndex, rowCount, columnIndex, columnCount");
            await context.sync("fld ovr");
            const gameNumRange: RangeInfo = RangeInfo.createFromRange(range);

            range = Ranges.rangeFromRangeInfo(
                range.worksheet,
                gameNumRange.offset(0, 3, -1, 1));

            range.load("formulas");
            await context.sync("fld ovr vals");

            formulas = range.formulas;
        }

        const field: any = formulas[0][0];
        const time: any = formulas[2][0];

        return [field, time];
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureRemove.updateGameDataSourcesWithOverrides

        get any direct edits from these ranges and propagate these edits to the
        bracket sources table
    ----------------------------------------------------------------------------*/
    static async updateGameDataSourcesWithOverrides(context: JsCtx, game: IBracketGame): Promise<IIntention[]>
    {
        const tns = [];

        let overrideText1: string;
        let overrideText2: string;
        let field: string;
        let time: number;

        if (game.IsChampionship)
            return tns;

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

        await GameDataSources.updateGameDataSourcesTeamNames(context, map);
        if (field && field != null && field != "")
            tns.push(...await GameDataSources.updateGameInfo(context, game.GameId.GameNum, field, time, game.SwapTopBottom));

        AppContext.log(`saved: ${game.TopTeamName}=${overrideText1}, ${game.BottomTeamName}=${overrideText2}, field=${field}, time=${time}`);

        return tns;
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.removeNamedRanges

        remove the named ranges for this game. 
    ----------------------------------------------------------------------------*/
    static async removeNamedRanges(context: JsCtx, game: IBracketGame): Promise<IIntention[]>
    {
        const tns = [];

        if (await RangeInfo.getRangeInfoForNamedCellFaster(context, game.TopTeamCellName) != null)
            tns.push(TnDeleteGlobalName.Create(game.TopTeamCellName));
        if (await RangeInfo.getRangeInfoForNamedCellFaster(context, game.BottomTeamCellName) != null)
            tns.push(TnDeleteGlobalName.Create(game.BottomTeamCellName));
        if (await RangeInfo.getRangeInfoForNamedCellFaster(context, game.GameNumberCellName) != null)
            tns.push(TnDeleteGlobalName.Create(game.GameNumberCellName));

        return tns;
//        await Ranges.ensureGlobalNameDeleted(context, game.TopTeamCellName);
//        await Ranges.ensureGlobalNameDeleted(context, game.BottomTeamCellName);
//        await Ranges.ensureGlobalNameDeleted(context, game.GameNumberCellName);
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.removeGame

        Remove the given bracket game from the sheet.
        If only the rangeinfo is provided, then use that as the range to remove.
        If both are provided, they must be consistent.
    ----------------------------------------------------------------------------*/
    static async removeGame(appContext: IAppContext, context: JsCtx, game: IBracketGame, range: RangeInfo, removeConnections: boolean, liteRemove: boolean): Promise<IIntention[]>
    {
        const tns = [];

        AppContext.checkpoint("remgm.1");

        await context.getTrackedItemOrPopulate(
            "workbookNamesItems",
            async (context): Promise<any> =>
            {
                context.Ctx.workbook.load("names");
                await context.sync("names");
                return { type: ObjectType.JsObject, o: context.Ctx.workbook.names.items };
            });

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
                tns.push(...await StructureRemove.updateGameDataSourcesWithOverrides(context, game));

            if (!liteRemove)
                tns.push(...await this.removeNamedRanges(context, game));
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
            tns.push(...await this.obliterateGameRangeFromSheet(context, appContext, range == null ? game.FullGameRange : range, removeConnections));

        AppContext.checkpoint("remgm.5");
        return tns;
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

        _TimerStack.pushTimer("findAndRemove - prep");
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
        await context.sync("FAR release");

        _TimerStack.popTimer();

        _TimerStack.pushTimer("removeBoundGames");
        for (let _game of games)
            await this.removeBoundGame(appContext, context, grid, _game, rangeSelected);
        _TimerStack.popTimer();

        // last, obliterate the rest of the range
        _TimerStack.pushTimer("obliterate selection");
        if (!rangeSelected.IsSingleCell)
            await this.removeGame(appContext, context, null, rangeSelected, false, false /*liteRemove*/);
        _TimerStack.popTimer();
    }
}