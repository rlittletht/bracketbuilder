// we can quickly cache ranges of formulas and values, but figuring out what those ranges are
// can be time consuming (especially when they are data body ranges in a table)  This is especially
// frustrating when the range doesn't change once the workbook has been initially created.

// this cache can be setup when we load (and are refreshed), and referenced to get the ranges
import { RangeInfo } from "./Ranges";

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

export class RangeCache
{
    m_items = new Map<string, RangeCacheItem>();

    add(name: string, sheetName: string, rangeInfo: RangeInfo, formulaCacheName: string)
    {
        this.m_items.set(name, new RangeCacheItem(name, sheetName, rangeInfo, formulaCacheName));
    }

    get(name: string): { sheetName: string, rangeInfo: RangeInfo, formulaCacheName: string } | null
    {
        if (!this.m_items.has(name))
            return null;

        const item = this.m_items.get(name);

        return { sheetName: item.SheetName, rangeInfo: item.RangeInfo, formulaCacheName: item.FormulaCacheName };
    }
}