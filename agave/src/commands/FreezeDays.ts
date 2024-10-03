import { IAppContext } from "../AppContext/AppContext";
import { Dispatcher, DispatchWithCatchDelegate } from "../BracketEditor/Dispatcher";
import { FastFormulaAreas } from "../Interop/FastFormulaAreas/FastFormulaAreas";
import { FastRangeAreas } from "../Interop/FastRangeAreas";
import { CacheObject, ObjectType } from "../Interop/TrackingCache";
import { RangeInfo } from "../Interop/Ranges";
import { Grid } from "../BracketEditor/Grid";
import { JsCtx } from "../Interop/JsCtx";

export class FreezeDays
{
    static async toggleDayFreezeClick(appContext: IAppContext)
    {
        if (!Dispatcher.RequireBracketReady(appContext))
            return;

        let delegate: DispatchWithCatchDelegate = async (context) =>
        {
            const sheet: Excel.Worksheet = context.Ctx.workbook.worksheets.getActiveWorksheet();
            if (appContext.AppStateAccess.DaysFrozen)
            {
                sheet.freezePanes.unfreeze();
                await context.sync();

                appContext.AppStateAccess.DaysFrozen = false;
            }
            else
            {
                await FastFormulaAreas.populateAllCaches(context);
                const fastRangeAreasSmaller: FastRangeAreas =
                    await context.getTrackedItemOrPopulate(
                        "grid-fastRangeAreas",
                        async (context): Promise<CacheObject> =>
                        {
                            const areas = await FastRangeAreas.getRangeAreasGridForRangeInfo(
                                context,
                                "bigGridCache",
                                sheet,
                                new RangeInfo(0, 28, 0, 25));

                            return { type: ObjectType.TrObject, o: areas };
                        });

                const firstGridPattern = Grid.getFirstGridPatternCell(fastRangeAreasSmaller);

                const row = Grid.getRowForGameDates(context, firstGridPattern);

                sheet.freezePanes.freezeAt(`${row}:${row + 1}`);
                await context.sync();
                appContext.AppStateAccess.DaysFrozen = true;
            }
        };

        await Dispatcher.ExclusiveDispatchWithCatch(delegate, appContext);
    }
}