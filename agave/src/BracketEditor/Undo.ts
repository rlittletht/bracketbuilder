import { Grid } from "./Grid";
import { StructureEditor } from "./StructureEditor/StructureEditor";
import { IAppContext } from "../AppContext/AppContext";
import { ApplyGridChange } from "./StructureEditor/ApplyGridChange";
import { GameNum } from "./GameNum";
import { BracketSources } from "../Brackets/BracketSources";
import { JsCtx } from "../Interop/JsCtx";

export class UndoGameDataItem
{
    gameNum: GameNum;
    fieldOriginal: string | undefined;
    fieldNew: string | undefined;
    startTimeOriginal: number | undefined;
    startTimeNew: number | undefined;

    constructor(
        gameNum: GameNum,
        fieldOriginal: string | undefined,
        fieldNew: string | undefined,
        startTimeOriginal: number | undefined,
        startTimeNew: number | undefined)
    {
        this.gameNum = gameNum;
        this.fieldOriginal = fieldOriginal;
        this.fieldNew = fieldNew;
        this.startTimeOriginal = startTimeOriginal;
        this.startTimeNew = startTimeNew;
    }

    clone(): UndoGameDataItem
    {
        return new UndoGameDataItem(this.gameNum, this.fieldOriginal, this.fieldNew, this.startTimeOriginal, this.startTimeNew);
    }
}

class UndoItem
{
    grid: Grid;
    gameData: UndoGameDataItem[];
}

export class UndoManager
{
    m_undoStack: UndoItem[] = [];
    m_redoStack: UndoItem[] = [];

    static shouldPushGameDataItems(undoGameDataItem: UndoGameDataItem)
    {
        if (undoGameDataItem.fieldNew || undoGameDataItem.startTimeNew || undoGameDataItem.fieldOriginal || undoGameDataItem.startTimeOriginal)
            return true;

        return false;
    }

    cloneUndoGameDataItems(gameDataItems: UndoGameDataItem[]): UndoGameDataItem[]
    {
        let newItems: UndoGameDataItem[] = [];

        for (let item of gameDataItems)
        {
            newItems.push(item.clone())
        }

        return newItems;
    }

    createUndoItem(grid: Grid, gameDataItems: UndoGameDataItem[]): UndoItem
    {
        if (gameDataItems == null)
            gameDataItems = [];

        let item: UndoItem = new UndoItem();

        item.grid = grid.clone();
        item.gameData = this.cloneUndoGameDataItems((gameDataItems));

        return item;
    }

    setUndoGrid(grid: Grid, gameDataItems: UndoGameDataItem[])
    {
        this.m_undoStack.push(this.createUndoItem(grid.clone(), gameDataItems));
        this.m_redoStack = [];
    }

    static async applyUndoGameDataItems(context: JsCtx, items: UndoGameDataItem[]): Promise<UndoGameDataItem[]>
    {
        let undoneGameDataItems: UndoGameDataItem[] = [];

        for (let item of items)
        {
            let undoneGameDataItem: UndoGameDataItem =
                await BracketSources.updateGameInfoIfNotSet(context, item.gameNum, item.fieldOriginal, item.startTimeOriginal, true);

            if (UndoManager.shouldPushGameDataItems(undoneGameDataItem))
                undoneGameDataItems.push(undoneGameDataItem);
        }

        return undoneGameDataItems;
    }

    async undo(appContext: IAppContext, context: JsCtx)
    {
        if (this.m_undoStack.length == 0)
            return;

        let bracketName: string = await StructureEditor.getBracketName(context);
        let grid: Grid = await Grid.createGridFromBracket(context, bracketName);
        let undoItem: UndoItem = this.m_undoStack.pop();

        // this diff and apply shouldn't change any field/time data (since any changes
        // we are undoing would just be returning to defaults and by definition, we don't
        // change non-default values))
        let undoneGameDataItems: UndoGameDataItem[] =
            await ApplyGridChange.diffAndApplyChanges(appContext, context, grid, undoItem.grid, bracketName);

        if (undoneGameDataItems.length != 0)
            throw Error("apply undo changes should not result in UndoGameDataItems!");

        undoneGameDataItems = await UndoManager.applyUndoGameDataItems(context, undoItem.gameData);

        this.m_redoStack.push(this.createUndoItem(grid.clone(), undoneGameDataItems));
    }

    async redo(appContext: IAppContext, context: JsCtx)
    {
        if (this.m_redoStack.length == 0)
            return;

        let bracketName: string = await StructureEditor.getBracketName(context);
        let grid: Grid = await Grid.createGridFromBracket(context, bracketName);
        let undoItem: UndoItem = this.m_redoStack.pop();

        let undoneGameDataItems: UndoGameDataItem[] =
            await ApplyGridChange.diffAndApplyChanges(appContext, context, grid, undoItem.grid, bracketName);

        if (undoneGameDataItems.length != 0)
            throw Error("apply undo changes should not result in UndoGameDataItems!");

        undoneGameDataItems = await UndoManager.applyUndoGameDataItems(context, undoItem.gameData);

        this.m_undoStack.push(this.createUndoItem(grid.clone(), undoneGameDataItems));
    }
}

export let _undoManager: UndoManager = new UndoManager();

