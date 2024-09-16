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
import { FastFormulaAreas, FastFormulaAreasTest } from "../Interop/FastFormulaAreas";
import { FastRangeAreasTest } from "../Interop/FastRangeAreas";
import { JsCtx } from "../Interop/JsCtx";
import { ParserTests } from "../Interop/Parser";
import { StreamWriter } from "../Support/StreamWriter";
import { _bracketManager } from "../Brackets/BracketManager";
import { GameDataSourcesTests } from "../Brackets/GameDataSources";
import { TourneyTests } from "../Tourney/TourneyTests";
import { TimeWithoutDateTests } from "../Support/TimeWithoutDateTests";

export class UnitTests
{
    static async doUnitTests(appContext: IAppContext)
    {
        const results = [];

        const outStream = new StreamWriter((line) => results.push(line));

        try
        {
            _bracketManager.populateStaticBracketsForTests();

            // first, dump the grid for the current sheet. this is handy if you are building
            // unit tests since it gives you a way to generate a grid...
            await Excel.run(
                async (ctx) =>
                {
                    const context: JsCtx = new JsCtx(ctx);
                    await FastFormulaAreas.populateAllCaches(context);
                    const grid: Grid = await Grid.createGridFromBracket(context, appContext.SelectedBracket);

                    grid.logGridCondensed();
                    context.releaseAllCacheObjects();
                });

            TimeWithoutDateTests.runAllTests(appContext, outStream);
            TourneyTests.runAllTests(appContext, outStream);
            GameDataSourcesTests.runAllTests(appContext, outStream);
            StructureInsertTests.runAllTests(appContext, outStream);
            FastFormulaAreasTest.runAllTests(appContext, outStream);
            FastRangeAreasTest.runAllTests(appContext, outStream);
            ParserTests.runAllTests(appContext, outStream);
            OADateTests.runAllTests(appContext, outStream);
            GameMoverTests.runAllTests(appContext, outStream);
            GridRankerTests.runAllTests(appContext, outStream);
            GridTests.runAllTests(appContext, outStream);
            RegionSwapper_BottomGameTests.runAllTests(appContext, outStream);
            Adjuster_WantToGrowUpAtTopOfGridTests.runAllTests(appContext, outStream);
            Adjuster_WantToGrowUpAtTopOfGridTests.runAllTests(appContext, outStream);
            Adjuster_SwapGameRegonsForOverlapTests.runAllTests(appContext, outStream);
            Adjuster_SwapAdjacentGameRegionsForOverlapTests.runAllTests(appContext, outStream);
        }
        catch (e)
        {
            results.push(`EXCEPTION CAUGHT: ${e}`);
        }

        appContext.Messages.message([...results, "Unit Tests Complete"]);
        _bracketManager.setDirty(true);
        appContext.AppStateAccess.HeroListDirty = true; // need to repopulate caches, etc.
    }
}