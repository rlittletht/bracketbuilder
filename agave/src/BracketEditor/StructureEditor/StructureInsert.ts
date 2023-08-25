import { IAppContext } from "../../AppContext/AppContext";
import { Coachstate } from "../../Coaching/Coachstate";
import { HelpTopic } from "../../Coaching/HelpInfo";
import { JsCtx } from "../../Interop/JsCtx";
import { RangeInfo, Ranges } from "../../Interop/Ranges";
import { _TimerStack } from "../../PerfTimer";
import { IBracketGame } from "../BracketGame";
import { FormulaBuilder } from "../FormulaBuilder";
import { GameFormatting } from "../GameFormatting";
import { Grid } from "../Grid";
import { GridItem } from "../GridItem";
import { UndoGameDataItem, _undoManager } from "../Undo";
import { ApplyGridChange } from "./ApplyGridChange";
import { StructureEditor } from "./StructureEditor";
import { StructureRemove } from "./StructureRemove";
import { IIntention } from "../../Interop/Intentions/IIntention";
import { TnSetFormulas } from "../../Interop/Intentions/TnSetFormula";
import { TnCreateGlobalName } from "../../Interop/Intentions/TnCreateGlobalName";

export class StructureInsert
{
    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.pushPadding

        just (count) number of the given value. useful for padding things
    ----------------------------------------------------------------------------*/
    static pushPadding(ary: any[][], valToPush: any, count: number)
    {
        while (count > 0)
        {
            ary.push(valToPush);
            count--;
        }
    }

    static async insertChampionshipGameAtRange(appContext: IAppContext, context: JsCtx, game: IBracketGame, insertRangeInfo: RangeInfo): Promise<IIntention[]>
    {
        const tns: IIntention[] = [];

        const bookmark: string = "insertChampionshipGameAtRange";

        context.pushTrackingBookmark(bookmark);

        if (insertRangeInfo == null)
        {
            appContext.Messages.error(
                ["There was no selection for the championship game insertion. You must select a cell to insert the championship game at"],
                { topic: HelpTopic.FAQ_ManuallySelect });

            return tns;
        }

        // figure out how big the game will be (width,height)
        let formulas: any[][] = [];

        formulas.push(
            [FormulaBuilder.getTeamNameFormulaFromSource(game.TopTeamName, game.BracketName), ""]);
        formulas.push([GameFormatting.s_hLineTeam, ""]);
        formulas.push(["Champion", ""]);

        let rangeTarget =
            new RangeInfo(insertRangeInfo.FirstRow, insertRangeInfo.RowCount, insertRangeInfo.FirstColumn, insertRangeInfo.ColumnCount - 1);

        tns.push(TnSetFormulas.Create(rangeTarget, formulas));

        // if there are any existing global names for this game, they will get deleted --
        // by now, we are committed to this game going in this spot

        // now we have to format the game and assign global names
        tns.push(...GameFormatting.tnsFormatTeamNameRangeRequest(insertRangeInfo.offset(0, 1, 0, 2)));

        // delete any existing named ranges
        tns.push(...await Ranges.tnsDeleteGlobalName(context, game.TopTeamCellName));

        tns.push(TnCreateGlobalName.Create(game.TopTeamCellName, insertRangeInfo.offset(0, 1, 0, 1)));

        tns.push(...GameFormatting.tnsFormatChampionshipText(new RangeInfo(insertRangeInfo.LastRow, 1, insertRangeInfo.FirstColumn, 2)));

        tns.push(...GameFormatting.tnsFormatConnectingLineRangeRequest(insertRangeInfo.offset(1, 1, 0, 1)));

        context.releaseCacheObjectsUntil(bookmark);

        return tns;
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureInsert.setAndFormatGameInfo

        set the text for the game info, and format the ranges
    ----------------------------------------------------------------------------*/
    static setAndFormatGameInfo(
        gameInfoRange: RangeInfo,
        gameInfoRangeInfo: RangeInfo,
        game: IBracketGame,
        connectedTop: boolean,
        connectedBottom: boolean): IIntention[]
    {
        const tns: IIntention[] = [];

        let formulas: any[][] = [];
        let topString: string = game.FormatLoser();
        let bottomString: string = "";

        if (topString == "" && !connectedTop)
        {
            topString = game.TopSource;
            if (topString != "" && topString[0] != 'L')
                topString = "";
        }

        if (!connectedBottom)
        {
            bottomString = game.BottomSource;
            if (bottomString != "" && bottomString[0] != 'L')
                bottomString = "";
        }

        if (game.IsIfNecessaryGame)
        {
            if (game.SwapTopBottom)
                bottomString = "(if first loss)";
            else
                topString = "(if first loss)";
        }

        const fCompressGame = gameInfoRangeInfo.FirstRow - gameInfoRange.FirstRow - 1 < 0;

        // we have to compress the game by losing the top row
        if (!fCompressGame)
        {
            formulas.push([topString]);
            this.pushPadding(
                formulas,
                [""],
                gameInfoRangeInfo.FirstRow - gameInfoRange.FirstRow - 1);
        }

        formulas.push(
            [
                FormulaBuilder.getFieldFormulaFromGameNumber(game.GameNum)
            ]);
        formulas.push([""]);
        formulas.push([FormulaBuilder.getTimeFormulaFromGameId(game.GameId)]);

        this.pushPadding(formulas, [""], gameInfoRange.LastRow - gameInfoRangeInfo.LastRow);
        formulas.push([""]);
        formulas.push([bottomString]);

        tns.push(TnSetFormulas.Create(gameInfoRange, formulas));
        tns.push(...GameFormatting.tnsFormatGameInfoBodyTextRequest(gameInfoRangeInfo.offset(0, 1, 0, 1)));
        tns.push(...GameFormatting.tnsFormatGameInfoTimeTextRequest(gameInfoRangeInfo.offset(2, 1, 0, 1)));

        if (!fCompressGame)
            tns.push(...GameFormatting.tnsFormatGameInfoAdvanceToTextRequest(gameInfoRange.offset(0, 1, 0, 1), Excel.VerticalAlignment.top));

        tns.push(...GameFormatting.tnsFormatGameInfoAdvanceToTextRequest(gameInfoRange.bottomLeft().offset(0, 1, 0, 1), Excel.VerticalAlignment.bottom));

        return tns;
    }

    static setTargetFormulasForGame(
        game: IBracketGame,
        insertRangeInfo: RangeInfo,
        gameInfoRangeInfo: RangeInfo): IIntention[]
    {
        // figure out how big the game will be (width,height)
        const formulas: any[][] = [];

        formulas.push(
            [FormulaBuilder.getTeamNameFormulaFromSource(game.TopTeamName, game.BracketName), ""]);

        formulas.push([GameFormatting.s_hLineTeam, GameFormatting.s_hLineScore]);

        // push padding for the underline row AND the number of blank lines 
        this.pushPadding(
            formulas,
            ["", ""],
            gameInfoRangeInfo.FirstRow
            - (insertRangeInfo.FirstRow + 2));

        formulas.push([FormulaBuilder.getFieldFormulaFromGameNumber(game.GameNum), `G${game.GameId.Value}`]);
        // we will fill in the game info text later. for now just push space

        this.pushPadding(formulas, ["", ""], 4 + insertRangeInfo.LastRow - gameInfoRangeInfo.LastRow - 2);
        formulas.push([GameFormatting.s_hLineTeam, GameFormatting.s_hLineScore]);
        formulas.push(
            [FormulaBuilder.getTeamNameFormulaFromSource(game.BottomTeamName, game.BracketName), ""]);

        const range =
            new RangeInfo(insertRangeInfo.FirstRow, insertRangeInfo.RowCount, insertRangeInfo.FirstColumn, insertRangeInfo.ColumnCount - 1);

        return [TnSetFormulas.Create(range, formulas)];
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.insertGameAtRange

        this will insert the text and set the global cell names for all the parts
        of the game. 
    ----------------------------------------------------------------------------*/
    static async insertGameAtRange(
        appContext: IAppContext,
        context: JsCtx,
        gridRef: Grid,
        game: IBracketGame,
        insertRangeInfo: RangeInfo,
        connectedTop: boolean,
        connectedBottom: boolean,
        liteInsert: boolean): Promise<IIntention[]>
    {
        const tns: IIntention[] = [];

        const bookmark: string = "insertGameAtRange";

        context.pushTrackingBookmark(bookmark);

        if (insertRangeInfo == null)
        {
            appContext.Messages.error(
                ["There was no selection for the game insertion. You must select a cell to insert a game at."],
                { topic: HelpTopic.FAQ_ManuallySelect });
            return tns;
        }

        const gameInfoRangeInfo = Grid.getRangeInfoForGameInfo(insertRangeInfo);

        tns.push(...this.setTargetFormulasForGame(game, insertRangeInfo, gameInfoRangeInfo));

        tns.push(...this.setAndFormatGameInfo(
            new RangeInfo(insertRangeInfo.FirstRow + 2, insertRangeInfo.RowCount - 4, insertRangeInfo.FirstColumn, 1),
            gameInfoRangeInfo,
            game,
            connectedTop,
            connectedBottom));

        if (!liteInsert)
        {
            // if there are any existing global names for this game, they will get deleted --
            // by now, we are committed to this game going in this spot

            // now we have to format the game and assign global names
            tns.push(...GameFormatting.tnsFormatTeamNameRangeRequest(insertRangeInfo.offset(0, 1, 0, 2)));
            tns.push(...await Ranges.tnsDeleteGlobalName(context, game.TopTeamCellName));
            tns.push(TnCreateGlobalName.Create(game.TopTeamCellName, insertRangeInfo.offset(0, 1, 0, 1)));

            tns.push(...GameFormatting.tnsFormatTeamNameRangeRequest(insertRangeInfo.bottomLeft().offset(0, 1, 0, 2)));
            tns.push(...await Ranges.tnsDeleteGlobalName(context, game.BottomTeamCellName));
            tns.push(TnCreateGlobalName.Create(game.BottomTeamCellName, insertRangeInfo.bottomLeft().offset(0, 1, 0, 1)));

            tns.push(...GameFormatting.tnsFormatConnectingLineRangeRequest(insertRangeInfo.offset(1, 1, 0, 3)));
            tns.push(...GameFormatting.tnsFormatConnectingLineRangeRequest(
                new RangeInfo(insertRangeInfo.FirstRow + insertRangeInfo.RowCount - 2, 1, insertRangeInfo.FirstColumn, 3)));

            const vertLineRowCount = insertRangeInfo.RowCount - 2;
            const vertLineFirstRow = insertRangeInfo.FirstRow + 1;
            const vertLineRangeInfo = new RangeInfo(vertLineFirstRow, vertLineRowCount, insertRangeInfo.FirstColumn + 2, 1);

            tns.push(...GameFormatting.tnsFormatConnectingLineRangeRequest(vertLineRangeInfo));

            const linesText = [];
            for (let i = 0; i < vertLineRowCount; i++)
                linesText.push([GameFormatting.s_mapGridRowType.get(gridRef.getRowType(vertLineFirstRow + i))]);

            tns.push(TnSetFormulas.Create(vertLineRangeInfo, linesText));

            const gameNumRange = new RangeInfo(gameInfoRangeInfo.FirstRow, 3, gameInfoRangeInfo.FirstColumn + 1, 1);
            
            tns.push(...GameFormatting.tnsFormatGameInfoGameNumberRequest(gameNumRange));

            tns.push(...await Ranges.tnsDeleteGlobalName(context, game.GameNumberCellName));
            tns.push(TnCreateGlobalName.Create(game.GameNumberCellName, gameNumRange));

            context.releaseCacheObjectsUntil(bookmark);
        }

        return tns;
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureInsert.getNextTimeAndFieldForDate
    ----------------------------------------------------------------------------*/
    static getNextTimeAndFieldForDate(
        grid: Grid,
        date: Date,
        maxTime: number,
        fields: string[],
        count: number,
        fieldCount: number): [number, string]
    {
        if (maxTime != 0 && count < fieldCount)
            return [maxTime, StructureEditor.getNextFieldName(fields, fieldCount)];

        if (maxTime != 0)
        {
            // skip ahead 3 hours
            return [maxTime + 60 * 3, StructureEditor.getNextFieldName(null, fieldCount)];
        }

        return [grid.getFirstSlotForDate(date), StructureEditor.getNextFieldName(null, fieldCount)];
    }


    static checkGameDependency(sourceGame: GridItem, requested: RangeInfo): { depSuccess: boolean, depFailReason?: string[], depTopic?: HelpTopic}
    {
        if (sourceGame)
        {
            if (sourceGame.Range.FirstColumn >= requested.FirstColumn)
            {
                return {
                    depSuccess: false,
                    depFailReason: [`Can't insert this game in this column. Game ${sourceGame.GameId.Value} must be played first.`,
                    `This game has to be inserted in column ${Ranges.getColName(sourceGame.Range.FirstColumn + 3)} or later`],
                    depTopic: HelpTopic.FAQ_GameDependencies
                };
            }
        }
        return { depSuccess: true };
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureInsert.buildNewGridForGameInsertAtSelection

        This is the non async portion of insert game at selection. Suitable for
        testing
    ----------------------------------------------------------------------------*/
    static buildNewGridForGameInsertAtSelection(requested: RangeInfo, grid: Grid, game: IBracketGame): { gridNew: Grid, failReason?: string[], coachState?: Coachstate, topic?: HelpTopic }
    {
        if (requested.FirstColumn < grid.FirstGridPattern.FirstColumn)
        {
            return {
                gridNew: null,
                failReason: ["Can't insert game at the current location.",
                    `Please select a cell in a Team Name column in the bracket grid -- column "${Ranges.getColName(grid.FirstGridPattern.FirstColumn)}" or greater)`],
                topic: HelpTopic.FAQ_InsertLocation,
                coachState: Coachstate.AfterInsertGameFailed
            };
        }

        const columnAdjacent = (requested.FirstColumn - grid.FirstGridPattern.FirstColumn) % 3;

        if (columnAdjacent != 0)
        {
            if (columnAdjacent == 1)
            {
                // they aren't in a team name column. if they are in the score column, then auto
                // adjust back to the name
                requested.shiftByColumns(-1);
            }
            else if (columnAdjacent == 2)
            {
                // if they are in the line column, that is closer to the _next_ team name
                // column
                requested.shiftByColumns(1);
            }
            else
            {
                const validColumns: string =
                    `${Ranges.getColName(grid.FirstGridPattern.FirstColumn)}, `
                    + `${Ranges.getColName(grid.FirstGridPattern.FirstColumn + 3)}, `
                    + `${Ranges.getColName(grid.FirstGridPattern.FirstColumn + 6)}, `
                    + `${Ranges.getColName(grid.FirstGridPattern.FirstColumn + 9)}, `
                    + `${Ranges.getColName(grid.FirstGridPattern.FirstColumn + 12)}, `
                    + `${Ranges.getColName(grid.FirstGridPattern.FirstColumn + 15)}, `
                    + `${Ranges.getColName(grid.FirstGridPattern.FirstColumn + 18)}, `
                    + `${Ranges.getColName(grid.FirstGridPattern.FirstColumn + 21)}, `
                    + `${Ranges.getColName(grid.FirstGridPattern.FirstColumn + 24)}, `
                    + `${Ranges.getColName(grid.FirstGridPattern.FirstColumn + 27)}`;

                return {
                    gridNew: null,
                    failReason: [
                        "Can't insert game at the current location.",
                        `Please select a cell in a Team Name column, not a score column or a line column. Valid columns include (${validColumns})`
                    ],
                    topic: HelpTopic.FAQ_InsertLocation,
                    coachState: Coachstate.AfterInsertGameFailed
                };
            }
        }

        // let's confirm that this games predecessor's are not in the same column
        const [topSourceGame, bottomSourceGame] = grid.getFeedingGamesForGame(game);

        {
            const { depSuccess, depFailReason, depTopic } = this.checkGameDependency(topSourceGame, requested);

            if (!depSuccess)
                return { gridNew: null, failReason: depFailReason, topic: depTopic, coachState: Coachstate.AfterInsertGameFailed };
        }
        {
            const { depSuccess, depFailReason, depTopic } = this.checkGameDependency(bottomSourceGame, requested);

            if (!depSuccess)
                return { gridNew: null, failReason: depFailReason, topic: depTopic, coachState: Coachstate.AfterInsertGameFailed };
        }

        // before we insert the game, let's figure out field and start time info. only do this if we have loaded
        // the date information for the grid...
        if (grid.AreDatesLoaded)
        {
            const date: Date = grid.getDateFromGridColumn(requested.FirstColumn);
            let maxTime: number = 0;
            let count: number = 0;
            let fields: string[] = [];

            if (date != null)
            {
                [maxTime, count, fields] = grid.getLatestTimeForDate(date);
                let nextTime: number;
                let field: string;
                [nextTime, field] = this.getNextTimeAndFieldForDate(grid, date, maxTime, fields, count, grid.FieldsToUse);
                game.SetStartTime(nextTime);
                game.SetField(field);
            }
        }

        const [gridNew, failReason] = grid.buildNewGridForGameAdd(game, requested);

        if (failReason != null)
        {
            return {
                gridNew: null,
                failReason: [`Insert Failed: ${failReason}`],
                topic: HelpTopic.FAQ_InsertFailed,
                coachState: Coachstate.AfterInsertGameFailedOverlapping
            };
        }

        return { gridNew: gridNew };
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.insertGameAtSelection
    ----------------------------------------------------------------------------*/
    static async insertGameAtSelection(appContext: IAppContext, context: JsCtx, game: IBracketGame): Promise<boolean>
    {
        const bookmark: string = "insertGameAtSelection";

        game.Unbind();

        context.pushTrackingBookmark(bookmark);

        // first, see if this game is already on the bracket, and if so, delete it
        await game.Bind(context, appContext);

        if (game.IsLinkedToBracket)
        {
            await StructureRemove.findAndRemoveGame(appContext, context, game, game.BracketName);
            // need to release any of our cached items since we just edited the book
            context.releaseCacheObjectsUntil(bookmark);
            context.pushTrackingBookmark(bookmark);
        }

        _TimerStack.pushTimer("insertGameAtSelection:gridBuildFromBracket");
        // first make sure we have a complete grid for the bracket
        let grid: Grid = await StructureEditor.gridBuildFromBracket(context, appContext.SelectedBracket);
        _TimerStack.popTimer();

        _TimerStack.pushTimer("insertGameAtSelection:buildNewGridForGameInsertAtSelection");

        // now let's figure out where we want to insert the game
        let requested: RangeInfo = await Ranges.createRangeInfoForSelection(context);

        if ((requested.FirstColumn < grid.FirstGridPattern.FirstColumn
            || (requested.FirstColumn > grid.FirstGridPattern.FirstColumn && requested.FirstColumn < grid.FirstGridPattern.FirstColumn + 3))
            && grid.IsEmpty)
        {
            // move the selection to the first column
            const range = Ranges.rangeFromRangeInfo(context.Ctx.workbook.worksheets.getActiveWorksheet(), grid.FirstGridPattern.offset(0, 1, 0, 1));
            range.select();
            requested = await Ranges.createRangeInfoForSelection(context);
        }

        const { gridNew, failReason, coachState, topic } = this.buildNewGridForGameInsertAtSelection(requested, grid, game);
        _TimerStack.popTimer();
       
        // caller 
        if (failReason)
        {
            appContext.Messages.error(
                failReason,
                { topic: topic });

            if (coachState)
                appContext.Teaching.pushTempCoachstate(coachState);

            return false;
        }

        _TimerStack.pushTimer("insertGameAtSelection:diffAndApplyChanges");

        let undoGameDataItems: UndoGameDataItem[] =
            await ApplyGridChange.diffAndApplyChanges(appContext, context, grid, gridNew, game.BracketName);

        _TimerStack.popTimer();


        _undoManager.setUndoGrid(grid, undoGameDataItems);
        return true;
    }
}