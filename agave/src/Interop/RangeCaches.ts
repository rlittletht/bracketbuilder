// we can quickly cache ranges of formulas and values, but figuring out what those ranges are
// can be time consuming (especially when they are data body ranges in a table)  This is especially
// frustrating when the range doesn't change once the workbook has been initially created.

// this cache can be setup when we load (and are refreshed), and referenced to get the ranges
import { BracketDefBuilder } from "../Brackets/BracketDefBuilder";
import { GameDataSources } from "../Brackets/GameDataSources";
import { FastFormulaAreasItems, FastFormulaAreas } from "./FastFormulaAreas/FastFormulaAreas";
import { JsCtx } from "./JsCtx";
import { RangeInfo, Ranges } from "./Ranges";
import { RulesBuilder } from "../Brackets/RulesBuilder";
import { s_staticConfig } from "../StaticConfig";

export class RangeCacheItemType
{
    static FieldsAndTimesBody = "FNT#Body";
    static FieldsAndTimesHeader = "FNT#Header";
    static TeamNamesBody = "TN#Body";
    static TeamNamesHeader = "TN#Header";
    static BracketDefBody = "BD#Body";
    static BracketDefHeader = "BD#Header";
    static FieldRulesBody = "FR#Body";
    static FieldRulesHeader = "FR#Header";
    static DayRulesBody = "DR#Body";
    static DayRulesHeader = "DR#Header";
}

export class RangeCacheItem
{
    Name: string;
    SheetName: string;
    RangeInfo: RangeInfo;
    FormulaCacheType: FastFormulaAreasItems;

    constructor(name: string, sheetName: string, rangeInfo: RangeInfo, formulaCacheType: FastFormulaAreasItems)
    {
        this.Name = name;
        this.SheetName = sheetName;
        this.RangeInfo = rangeInfo;
        this.FormulaCacheType = formulaCacheType;
    }
}

interface RangeCachedItem
{
    sheetName: string,
    rangeInfo: RangeInfo,
    formulaCacheType: FastFormulaAreasItems
}

export class RangeCaches
{
    static s_isDirty: boolean = true;
    static s_lastBracket: string = "";

    static m_items = new Map<string, RangeCacheItem>();

    static get BracketCached(): string
    {
        if (this.s_lastBracket != "" && !this.s_isDirty && this.m_items.has(RangeCacheItemType.BracketDefBody))
            return this.s_lastBracket;

        return null;
    }

    private static add(name: string, sheetName: string, rangeInfo: RangeInfo, formulaCacheType: FastFormulaAreasItems)
    {
        this.m_items.set(name, new RangeCacheItem(name, sheetName, rangeInfo, formulaCacheType));
    }

    static get(name: string): RangeCachedItem | null
    {
        if (!this.m_items.has(name))
            return { sheetName: null, rangeInfo: null, formulaCacheType: null};

        const item = this.m_items.get(name);

        return { sheetName: item.SheetName, rangeInfo: item.RangeInfo, formulaCacheType: item.FormulaCacheType };
    }

    static getCacheByType(type: RangeCacheItemType, id?: string): RangeCachedItem | null
    {
        return this.get(`${type}${id ?? ""}`);
    }

    static async GetRange(context: JsCtx, delegate: (context: JsCtx) => Promise<any>): Promise<any>
    {
        try
        {
            return await delegate(context);
        }
        catch (e)
        {
            return null;
        }
    }

    static SetDirty(isDirty: boolean)
    {
        this.s_isDirty = isDirty;
    }

    static getBracketBodyAndTeamNamesBodyRange(context: JsCtx): { bracketBodyRange: Excel.Range, teamNamesBodyRange: Excel.Range }
    {
        const sheetGet: Excel.Worksheet = context.Ctx.workbook.worksheets.getItemOrNullObject(GameDataSources.SheetName);
        const fieldsTimesTableName: string = "BracketSourceData";
        const fieldsTimesTable = sheetGet.tables.getItem(fieldsTimesTableName);
        const fieldsTimesRange: Excel.Range = fieldsTimesTable.getDataBodyRange();

        const teamsTableName: string = "TeamNames";
        const teamsTable = sheetGet.tables.getItem(teamsTableName);
        const teamsRange: Excel.Range = teamsTable.getDataBodyRange();

        fieldsTimesRange.load("rowCount, columnCount, rowIndex, columnIndex");
        teamsRange.load("rowCount, columnCount, rowIndex, columnIndex");

        // don't sync yet...we might have more to get
        return { bracketBodyRange: fieldsTimesRange, teamNamesBodyRange: teamsRange };
    }

    /*----------------------------------------------------------------------------
        %%Function: RangeCaches.getRulesRanges

        Get the ranges for the field rules and the day rules, preload
        rowCount, columnCount, rowIndex, and columnIndex
    ----------------------------------------------------------------------------*/
    static getRulesRanges(context: JsCtx): { fieldRulesBodyRange: Excel.Range, dayRulesBodyRange: Excel.Range }
    {
        const sheetGet: Excel.Worksheet = context.Ctx.workbook.worksheets.getItemOrNullObject(RulesBuilder.SheetName);

        const fieldRulesRange = Ranges.getTableDataBodyRangeFromTableName(sheetGet, "FieldRules");
        const dayRulesRange = Ranges.getTableDataBodyRangeFromTableName(sheetGet, "DayRules");

        fieldRulesRange.load("rowCount, columnCount, rowIndex, columnIndex");
        dayRulesRange.load("rowCount, columnCount, rowIndex, columnIndex");

        // don't sync yet...we might have more to get
        return { fieldRulesBodyRange: fieldRulesRange, dayRulesBodyRange: dayRulesRange };
    }

    static getBracketDefRange(context: JsCtx, bracketChoice: string): Excel.Range
    {
//        if ((bracketChoice ?? "") === "")
//            return null;

        const sheetGet: Excel.Worksheet = context.Ctx.workbook.worksheets.getItemOrNullObject(BracketDefBuilder.SheetName);
        const defTableName: string = `${bracketChoice}Bracket`
        const defTable = sheetGet.tables.getItem(defTableName);
        const defRange: Excel.Range = defTable.getDataBodyRange();

        defRange.load("rowCount, columnCount, rowIndex, columnIndex");

        return defRange;
    }

    /*----------------------------------------------------------------------------
        %%Function: RangeCaches.getDataValuesFromRangeCacheType

        Get all the values for the dataBodyRange for the given cacheType
    ----------------------------------------------------------------------------*/
    static getDataRangeAndValuesFromRangeCacheType(context: JsCtx, type: string): { range: RangeInfo, values: any[][] }
    {
        const range: RangeCachedItem = RangeCaches.getCacheByType(type);

        if (!range)
            return { range: null, values: null };

        const areas = FastFormulaAreas.getFastFormulaAreaCacheForType(context, range.formulaCacheType);

        if (!areas)
            return { range: null, values: null };

        const dataRange = range.rangeInfo;
        const dataValues = areas.getValuesForRangeInfo(dataRange);

        return { range: dataRange, values: dataValues };
    }
    
    static async PopulateIfNeeded(context: JsCtx, bracketChoice: string)
    {
        if (!this.s_isDirty && this.s_lastBracket == bracketChoice)
            return;

        this.s_isDirty = false;
        this.s_lastBracket = bracketChoice;

        let bracketBodyRange: RangeInfo = null;
        let teamNamesBodyRange: RangeInfo = null;
        let bracketDefRange: RangeInfo = null;
        let fieldRulesBodyRange: RangeInfo = null;
        let dayRulesBodyRange: RangeInfo = null;

        // first, try to get all the ranges together (in one batch). if this throws an exception, then we'll
        // try to get them separately
        let allRanges =
            await this.GetRange(context, async (context) =>
            {
                const { bracketBodyRange, teamNamesBodyRange } = this.getBracketBodyAndTeamNamesBodyRange(context);
                const { fieldRulesBodyRange, dayRulesBodyRange } = this.getRulesRanges(context);

                const bracketDefRange = this.getBracketDefRange(context, bracketChoice);
                await context.sync();

                return { bracketBodyRange: bracketBodyRange, teamNamesBodyRange: teamNamesBodyRange, bracketDefRange: bracketDefRange, fieldRulesBodyRange: fieldRulesBodyRange, dayRulesBodyRange: dayRulesBodyRange };
            });

        if (!allRanges)
        {
            allRanges = {};

            const rangesPart1 =
                await this.GetRange(
                    context,
                    async (context) =>
                    {
                        const { bracketBodyRange, teamNamesBodyRange } = this.getBracketBodyAndTeamNamesBodyRange(context);
                        const { fieldRulesBodyRange, dayRulesBodyRange } = this.getRulesRanges(context);

                        await context.sync();

                        return { bracketBodyRange: bracketBodyRange, teamNamesBodyRange: teamNamesBodyRange, bracketDefRange: null, fieldRulesBodyRange: fieldRulesBodyRange, dayRulesBodyRange: dayRulesBodyRange };
                    });

            allRanges.bracketBodyRange = rangesPart1?.bracketBodyRange ?? null;
            allRanges.teamNamesBodyRange = rangesPart1?.teamNamesBodyRange ?? null;
            allRanges.fieldRulesBodyRange = rangesPart1?.fieldRulesBodyRange ?? null;
            allRanges.dayRulesBodyRange = rangesPart1?.dayRulesBodyRange ?? null;

            const rangesPart2 =
                await this.GetRange(
                    context,
                    async (context) =>
                    {
                        const bracketDefRange = this.getBracketDefRange(context, bracketChoice);
                        await context.sync();

                        return { bracketDefRange: bracketDefRange };
                    });

            allRanges.bracketDefRange = rangesPart2?.bracketDefRange ?? null;
        }

        bracketBodyRange = RangeInfo.createFromRange(allRanges.bracketBodyRange);
        teamNamesBodyRange = RangeInfo.createFromRange(allRanges.teamNamesBodyRange);
        bracketDefRange = RangeInfo.createFromRange(allRanges.bracketDefRange);
        fieldRulesBodyRange = RangeInfo.createFromRange(allRanges.fieldRulesBodyRange);
        dayRulesBodyRange = RangeInfo.createFromRange(allRanges.dayRulesBodyRange);

        if (bracketBodyRange)
        {
            this.add(RangeCacheItemType.FieldsAndTimesBody, GameDataSources.SheetName, bracketBodyRange, FastFormulaAreasItems.GameData);
            this.add(RangeCacheItemType.FieldsAndTimesHeader, GameDataSources.SheetName, bracketBodyRange.offset(-1, 1), FastFormulaAreasItems.GameData);
        }

        if (teamNamesBodyRange)
        {
            this.add(RangeCacheItemType.TeamNamesBody, GameDataSources.SheetName, teamNamesBodyRange, FastFormulaAreasItems.GameData);
            this.add(RangeCacheItemType.TeamNamesHeader, GameDataSources.SheetName, teamNamesBodyRange.offset(-1, 1), FastFormulaAreasItems.GameData);
        }

        if (bracketDefRange)
        {
            this.add(RangeCacheItemType.BracketDefBody, BracketDefBuilder.SheetName, bracketDefRange, FastFormulaAreasItems.BracketDefs);
            this.add(RangeCacheItemType.BracketDefHeader, BracketDefBuilder.SheetName, bracketDefRange.offset(-1, 1), FastFormulaAreasItems.BracketDefs);
        }

        if (fieldRulesBodyRange)
        {
            this.add(RangeCacheItemType.FieldRulesBody, RulesBuilder.SheetName, fieldRulesBodyRange, FastFormulaAreasItems.RulesData);
            this.add(RangeCacheItemType.FieldRulesHeader, RulesBuilder.SheetName, fieldRulesBodyRange.offset(-1, 1), FastFormulaAreasItems.RulesData);
        }

        if (dayRulesBodyRange)
        {
            this.add(RangeCacheItemType.DayRulesBody, RulesBuilder.SheetName, dayRulesBodyRange, FastFormulaAreasItems.RulesData);
            this.add(RangeCacheItemType.DayRulesHeader, RulesBuilder.SheetName, dayRulesBodyRange.offset(-1, 1), FastFormulaAreasItems.RulesData);
        }
    }
}