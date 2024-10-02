import { RangeInfo } from "../Ranges";
import { FastFormulaAreaDefinition } from "./FastFormulaAreaDefinition";
import { FastFormulaAreasItems } from "./FastFormulaAreasItems";


/*----------------------------------------------------------------------------
    %%Class: FastFormulaAreaDefinitions.FastFormulaAreaDefinitions

    These are the definitions for all the fast formula areas we have

    if you want to add another range to track, just add a new static name
    and an entry to the definitions list.

    The range that you provide below is the complete range that will be
    cached.
    
    If you are going to use a named range or a range from a table to figure
    out the coordinates to fetch, that's fine -- you can cache that information
    in the RangeCaches object.

    HOWEVER even though you are getting the range from RangeCaches, you still
    must make sure the entire range is cache in the FastFormulaAreaCache.

    For example:  Table "Foo" refers to "Sheet1!A1:G20".  You have to make
    sure yoiu cache AT LEAST RangeInfo(0, 0, 20, 7).  You can cache more
    (and there is only a tiny incremental cost -- you can cache a 100x100
    array in < 100ms), and the cache will take care of returning just what
    you ask for.  (so you can request A1:G20 from a 100x100 cache area and
    you will get just A1:G20)

    What if you find out later that the range you cache wasn't big enough?
    Use FastFormulaAreas.addMoreRows.
----------------------------------------------------------------------------*/
export class FastFormulaAreaDefinitions
{
    static s_gridCacheName: string = "gamegrid-FastFormulaAreas";
    static s_gameDataSheetCacheName: string = "gameData-FastFormulaAreas";
    static s_bracketDefCacheName: string = "bracketDefs-FastFormulaAreas";
    static s_bracketInfoCacheName: string = "bracketInfo-FastFormulaAreas";
    static s_rulesSheetCacheName: string = "rules-FastFormulaAreas";

    static s_definitions =
        new Map<FastFormulaAreasItems, FastFormulaAreaDefinition>(
            [
                [FastFormulaAreasItems.GameGrid, new FastFormulaAreaDefinition(FastFormulaAreaDefinitions.s_gridCacheName, "Games", new RangeInfo(0, 250, 0, 60), "Games")],
                [FastFormulaAreasItems.GameData, new FastFormulaAreaDefinition(FastFormulaAreaDefinitions.s_gameDataSheetCacheName, "TeamsAndFields", new RangeInfo(0, 150, 0, 7), "Data")],
                [FastFormulaAreasItems.BracketDefs, new FastFormulaAreaDefinition(FastFormulaAreaDefinitions.s_bracketDefCacheName, "BracketDefs", new RangeInfo(0, 200, 0, 15), "Defs")],
                [FastFormulaAreasItems.BracketInfo, new FastFormulaAreaDefinition(FastFormulaAreaDefinitions.s_bracketInfoCacheName, "BracketInfo", new RangeInfo(0, 100, 0, 15), "Info")],
                [FastFormulaAreasItems.RulesData, new FastFormulaAreaDefinition(FastFormulaAreaDefinitions.s_rulesSheetCacheName, "Rules", new RangeInfo(0, 50, 0, 10), "Rules")]
            ]);

    static getCacheNameFromType(type: FastFormulaAreasItems, cacheName: string): string
    {
        return `${cacheName}-${this.s_definitions.get(type).CacheRootName}`;
    }

    static getRangeFromType(type: FastFormulaAreasItems): RangeInfo
    {
        return this.s_definitions.get(type).Range;
    }

    static getSheetNameFromType(type: FastFormulaAreasItems): string
    {
        return this.s_definitions.get(type).SheetName;
    }

    static getMapTypeNameFromType(type: FastFormulaAreasItems): string
    {
        return this.s_definitions.get(type).MapTypeName;
    }
}