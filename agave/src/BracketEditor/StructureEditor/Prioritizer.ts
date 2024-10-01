import { AppContext, IAppContext } from "../../AppContext/AppContext";
import { GameDataSources } from "../../Brackets/GameDataSources";
import { JsCtx } from "../../Interop/JsCtx";
import { RangeInfo, Ranges } from "../../Interop/Ranges";
import { Dispatcher, DispatchWithCatchDelegate } from "../Dispatcher";
import { GameFormatting } from "../GameFormatting";
import { Grid } from "../Grid";
import { GridItem } from "../GridItem";
import { StructureEditor } from "./StructureEditor";
import { RangeCaches, RangeCacheItemType } from "../../Interop/RangeCaches";
import { FastFormulaAreas, FastFormulaAreasItems } from "../../Interop/FastFormulaAreas/FastFormulaAreas";
import { s_staticConfig } from "../../StaticConfig";

/* 
    A note on team priorities...
*/
export class Prioritizer
{
    static async getTeamPriorityMap(context: JsCtx, appContext: AppContext): Promise<Map<string, number>>
    {
        appContext;
        const priorityMap: Map<string, number> = new Map<string, number>();
        const dataBodyRange = RangeCaches.getCacheByType(RangeCacheItemType.TeamNamesBody);
        let values: any[][];

        if (dataBodyRange)
        {
            const areas = FastFormulaAreas.getFastFormulaAreaCacheForType(context, dataBodyRange.formulaCacheType);

            if (areas)
            {
                values = areas.getValuesForRangeInfo(dataBodyRange.rangeInfo);
            }
        }

        if (values == null)
        {
            if (s_staticConfig.throwOnCacheMisses)
            {
                debugger;
                throw new Error("cache miss on getTeamPriorityMap");
            }

            // first, get all the teamName info
            const table: Excel.Table = await GameDataSources.getTeamNameTable(context);
            const tableRange: Excel.Range = table.getDataBodyRange();
            tableRange.load("values, rowCount");
            await context.sync();

            values = tableRange.values;
        }

        for (let i = 0; i < values.length; i++)
        {
            const teamName: string = String(values[i][1]);
            let priority: number = -1; // unknown

            if (typeof values[i][2] === "number")
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
            await FastFormulaAreas.populateAllCaches(context);

            await this.shadeGamesByPriority(appContext, context);
            appContext.AppStateAccess.HeroListDirty = true;
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
        const bracketName: string = appContext.SelectedBracket;

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
            if (item.IsChampionshipGame)
                continue;

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
