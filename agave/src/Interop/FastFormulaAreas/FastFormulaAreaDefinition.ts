import { RangeInfo } from "../Ranges";

export class FastFormulaAreaDefinition
{
    MapTypeName: string;
    SheetName: string;
    Range: RangeInfo;
    CacheRootName: string;

    constructor(typeName: string, sheet: string, range: RangeInfo, rootName: string)
    {
        this.MapTypeName = typeName;
        this.SheetName = sheet;
        this.Range = RangeInfo.createFromRangeInfo(range);
        this.CacheRootName = rootName;
    }
}