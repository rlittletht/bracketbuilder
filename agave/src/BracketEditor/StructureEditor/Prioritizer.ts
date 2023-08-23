import { JsCtx } from "../../Interop/JsCtx";
import { AppContext, IAppContext } from "../../AppContext/AppContext";
import { GameDataSources } from "../../Brackets/GameDataSources";
import { Grid } from "../Grid";
import { StructureEditor } from "./StructureEditor";
import { GridItem } from "../GridItem";
import { RangeInfo, Ranges } from "../../Interop/Ranges";
import { IBracketGame, BracketGame } from "../BracketGame";
import { GridChange, GridChangeOperation } from "../GridChange";
import { GameFormatting } from "../GameFormatting";
import { DispatchWithCatchDelegate, Dispatcher } from "../Dispatcher";

/* 
    A note on team priorities...
*/
export class Prioritizer
{
    static async getTeamPriorityMap(context: JsCtx, appContext: AppContext): Promise<Map<string, number>>
    {
        appContext;
        // first, get all the teamName info
        const table: Excel.Table = await GameDataSources.getTeamNameTable(context);
        const tableRange: Excel.Range = table.getDataBodyRange();
        tableRange.load("values, rowCount");
        await context.sync();

        const priorityMap: Map<string, number> = new Map<string, number>();
        const values: any[][] = tableRange.values;

        for (let i = 0; i < tableRange.rowCount; i++)
        {
            const teamName: string = String(values[i][1]);
            let priority: number = -1; // unknown

            if (typeof tableRange.values[i][2] === "number")
                priority = Number(values[i][2]);

            priorityMap.set(teamName, priority);
        }

        return priorityMap;
    }


    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.shadeGamesByPriorityClick
    ----------------------------------------------------------------------------*/
    static async shadeGamesByPriorityClick(appContext: IAppContext)
    {
        if (!Dispatcher.RequireBracketReady(appContext))
            return;

        let delegate: DispatchWithCatchDelegate = async (context) =>
        {
            await this.shadeGamesByPriority(appContext, context);
            appContext.setHeroListDirty();
            await appContext.rebuildHeroListIfNeeded(context);
        };

        await Dispatcher.ExclusiveDispatchWithCatch(delegate, appContext);
    }

    /*----------------------------------------------------------------------------
        %%Function: Prioritizer.shadeGamesByPriority
    ----------------------------------------------------------------------------*/
    static async shadeGamesByPriority(appContext: IAppContext, context: JsCtx)
    {
        appContext;

        // build a grid
        const bracketName: string = await StructureEditor.getBracketName(context);

        const grid: Grid = await Grid.createGridFromBracket(context, bracketName);

        // now go through each game and shade them (the grid loaded the priorities)
        const items: GridItem[] = [];

        grid.enumerateMatching(
            (item: GridItem) =>
            {
                items.push(item);
                return true;
            },
            (item: GridItem) =>
            {
                return !item.isLineRange;
            });

        const sheet: Excel.Worksheet = context.Ctx.workbook.worksheets.getActiveWorksheet();

        for (let item of items)
        {
            const bodyRangeInfo: RangeInfo = new RangeInfo(item.Range.FirstRow + 2, item.Range.RowCount - 4, item.Range.FirstColumn, 2);
            const rangeBody: Excel.Range = Ranges.rangeFromRangeInfo(sheet, bodyRangeInfo);
            const rangeTop: Excel.Range = Ranges.rangeFromRangeInfo(sheet, item.TopTeamRange.offset(0, 1, 0, 2));
            const rangeBottom: Excel.Range = Ranges.rangeFromRangeInfo(sheet, item.BottomTeamRange.offset(0, 1, 0, 2));

            GameFormatting.formatRangeForPriority(rangeBody, item.GamePriority);
            GameFormatting.formatRangeForPriority(rangeTop, item.TopPriority);
            GameFormatting.formatRangeForPriority(rangeBottom, item.BottomPriority);
            await context.sync();
        }
    }
}
