import { IAppContext } from "../AppContext/AppContext";
import { GameMoverTests } from "../BracketEditor/GameMoverTests";
import { Grid } from "../BracketEditor/Grid";
import { Adjuster_SwapAdjacentGameRegionsForOverlapTests } from "../BracketEditor/GridAdjusters/Adjuster_SwapAdjacentGameRegionsForOverlap";
import { Adjuster_SwapGameRegonsForOverlapTests } from "../BracketEditor/GridAdjusters/Adjuster_SwapGameRegonsForOverlap";
import { Adjuster_WantToGrowUpAtTopOfGridTests } from "../BracketEditor/GridAdjusters/Adjuster_WantToGrowUpAtTopOfGrid";
import { RegionSwapper_BottomGameTests } from "../BracketEditor/GridAdjusters/RegionSwapper_BottomGame";
import { GridRankerTests } from "../BracketEditor/GridRankerTests";
import { GridTests } from "../BracketEditor/GridTests";
import { StructureInsertTests } from "../BracketEditor/StructureEditor/StrutureInsertTests";
import { OADateTests } from "../Interop/Dates";
import { FastFormulaAreasTest } from "../Interop/FastFormulaAreas";
import { FastRangeAreasTest } from "../Interop/FastRangeAreas";
import { JsCtx } from "../Interop/JsCtx";
import { ParserTests } from "../Interop/Parser";
import { StreamWriter } from "../Support/StreamWriter";

export class UnitTests
{
    static async doUnitTests(appContext: IAppContext)
    {
        const results = [];

        const outStream = new StreamWriter((line) => results.push(line));

        try
        {
            // first, dump the grid for the current sheet. this is handy if you are building
            // unit tests since it gives you a way to generate a grid...
            await Excel.run(
                async (ctx) =>
                {
                    const context: JsCtx = new JsCtx(ctx);
                    const grid: Grid = await Grid.createGridFromBracket(context, appContext.getSelectedBracket());

                    grid.logGridCondensed();
                    context.releaseAllCacheObjects();
                });

            await StructureInsertTests.runAllTests(appContext, outStream);
            await FastFormulaAreasTest.runAllTests(appContext, outStream);
            await FastRangeAreasTest.runAllTests(appContext, outStream);
            await ParserTests.runAllTests(appContext, outStream);
            await OADateTests.runAllTests(appContext, outStream);
            await GameMoverTests.runAllTests(appContext, outStream);
            await GridRankerTests.runAllTests(appContext, outStream);
            await GridTests.runAllTests(appContext, outStream);
            await RegionSwapper_BottomGameTests.runAllTests(appContext, outStream);
            await Adjuster_WantToGrowUpAtTopOfGridTests.runAllTests(appContext, outStream);
            await Adjuster_WantToGrowUpAtTopOfGridTests.runAllTests(appContext, outStream);
            await Adjuster_SwapGameRegonsForOverlapTests.runAllTests(appContext, outStream);
            await Adjuster_SwapAdjacentGameRegionsForOverlapTests.runAllTests(appContext, outStream);
        }
        catch (e)
        {
            results.push(`EXCEPTION CAUGHT: ${e}`);
        }

        appContext.Messages.message([...results, "Unit Tests Complete"]);
    }
}