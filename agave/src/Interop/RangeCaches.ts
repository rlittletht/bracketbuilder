// we can quickly cache ranges of formulas and values, but figuring out what those ranges are
// can be time consuming (especially when they are data body ranges in a table)  This is especially
// frustrating when the range doesn't change once the workbook has been initially created.

// this cache can be setup when we load (and are refreshed), and referenced to get the ranges
import { RangeInfo } from "./Ranges";
import { JsCtx } from "./JsCtx";
import { BracketSources } from "../Brackets/BracketSources";
import { ObjectType } from "./TrackingCache";
import { FastFormulaAreas } from "./FastFormulaAreas";
import { BracketStructureBuilder } from "../Brackets/BracketStructureBuilder";

export class RangeCacheItem
{
    Name: string;
    SheetName: string;
    RangeInfo: RangeInfo;
    FormulaCacheName: string;

    constructor(name: string, sheetName: string, rangeInfo: RangeInfo, formulaCachename: string)
    {
        this.Name = name;
        this.SheetName = sheetName;
        this.RangeInfo = rangeInfo;
        this.FormulaCacheName = formulaCachename;
    }
}

export class RangeCaches
{
    static s_gameFieldsAndTimesDataBody = "bracketSourceDataRange";
    static s_teamNamesDataBody = "teamNamesDataRange";
    static s_bracketDefDataBody = "bracketDefDataRange";
    static s_isDirty: boolean = true;
    static s_lastBracket: string = "";

    static m_items = new Map<string, RangeCacheItem>();

    static add(name: string, sheetName: string, rangeInfo: RangeInfo, formulaCacheName: string)
    {
        this.m_items.set(name, new RangeCacheItem(name, sheetName, rangeInfo, formulaCacheName));
    }

    static get(name: string): { sheetName: string, rangeInfo: RangeInfo, formulaCacheName: string } | null
    {
        if (!this.m_items.has(name))
            return { sheetName: null, rangeInfo: null, formulaCacheName: null};

        const item = this.m_items.get(name);

        return { sheetName: item.SheetName, rangeInfo: item.RangeInfo, formulaCacheName: item.FormulaCacheName };
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

    static async Populate(context: JsCtx, bracketChoice: string)
    {
        if (!this.s_isDirty && this.s_lastBracket == bracketChoice)
            return;

        const { bracketBodyRange, teamNamesBodyRange } =
            await this.GetRange(context, async (context) =>
            {
                const sheetGet: Excel.Worksheet = context.Ctx.workbook.worksheets.getItemOrNullObject(BracketSources.SheetName);
                const fieldsTimesTableName: string = "BracketSourceData";
                const fieldsTimesTable = sheetGet.tables.getItem(fieldsTimesTableName);
                const fieldsTimesRange: Excel.Range = fieldsTimesTable.getDataBodyRange();

                const teamsTableName: string = "TeamNames";
                const teamsTable = sheetGet.tables.getItem(teamsTableName);
                const teamsRange: Excel.Range = teamsTable.getDataBodyRange();

                fieldsTimesRange.load("rowCount, columnCount, rowIndex, columnIndex");
                teamsRange.load("rowCount, columnCount, rowIndex, columnIndex");

                await context.sync("teams/bracketBodyRange");
                return { bracketBodyRange: RangeInfo.createFromRange(fieldsTimesRange), teamNamesBodyRange: RangeInfo.createFromRange(teamsRange) };
            });

        if (bracketBodyRange)
            this.add(this.s_gameFieldsAndTimesDataBody, BracketSources.SheetName, bracketBodyRange, FastFormulaAreas.s_teamsSheetCacheName);

        if (teamNamesBodyRange)
            this.add(this.s_gameFieldsAndTimesDataBody, BracketSources.SheetName, bracketBodyRange, FastFormulaAreas.s_teamsSheetCacheName);

        if (bracketChoice)
        {
            const { bracketDefRange } =
                await this.GetRange(
                    context,
                    async (context) =>
                    {
                        const sheetGet: Excel.Worksheet = context.Ctx.workbook.worksheets.getItemOrNullObject(BracketStructureBuilder.SheetName);
                        const defTableName: string = `${bracketChoice}Bracket`
                        const defTable = sheetGet.tables.getItem(defTableName);
                        const defRange: Excel.Range = defTable.getDataBodyRange();

                        defRange.load("rowCount, columnCount, rowIndex, columnIndex");

                        await context.sync("teams/bracketBodyRange");
                        return { bracketBodyRange: RangeInfo.createFromRange(defRange), bracketDefBodyRange: RangeInfo.createFromRange(defRange) };
                    });

            if (bracketDefRange)
                this.add(this.s_bracketDefDataBody, BracketStructureBuilder.SheetName, bracketDefRange, FastFormulaAreas.s_bracketDefCacheName);

        }
    }
}