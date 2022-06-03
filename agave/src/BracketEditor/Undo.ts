import { Grid } from "./Grid";
import { StructureEditor } from "./StructureEditor/StructureEditor";
import { IAppContext } from "../AppContext";

export class UndoManager
{
    m_undoStack: Grid[] = [];
    m_redoStack: Grid[] = [];

    setUndoGrid(grid: Grid)
    {
        this.m_undoStack.push(grid.clone());
        this.m_redoStack = [];
    }

    async undo(appContext: IAppContext, ctx: any)
    {
        if (this.m_undoStack.length == 0)
            return;

        let bracketName: string = await StructureEditor.getBracketName(ctx);
        let grid: Grid = await Grid.createGridFromBracket(ctx, bracketName);
        let gridNew: Grid = this.m_undoStack.pop();

        await StructureEditor.diffAndApplyChanges(appContext, ctx, grid, gridNew, bracketName);
        this.m_redoStack.push(grid.clone());
    }

    async redo(appContext: IAppContext, ctx: any)
    {
        if (this.m_redoStack.length == 0)
            return;

        let bracketName: string = await StructureEditor.getBracketName(ctx);
        let grid: Grid = await Grid.createGridFromBracket(ctx, bracketName);
        let gridNew: Grid = this.m_redoStack.pop();

        await StructureEditor.diffAndApplyChanges(appContext, ctx, grid, gridNew, bracketName);
        this.m_undoStack.push(grid.clone());
    }
}

export let _undoManager: UndoManager = new UndoManager();

