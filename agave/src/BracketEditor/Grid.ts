import { RangeInfo } from "../Interop/Ranges";
import { BracketDefinition } from "../Brackets/BracketDefinitions";


export class Grid
{
    m_ranges: RangeInfo[];

    addRange(range: RangeInfo)
    {
        this.m_ranges.push(range);
    }

    doesRangeOverlap(range: RangeInfo): boolean
    {
        for (let item of this.m_ranges)
        {
            if (RangeInfo.isOverlapping(range, item))
                return true;
        }

        return false;
    }

    async loadGridFromBracket(ctx: any, sheet: Excel.Worksheet, bracketDef: BracketDefinition)
    {
        // go through all the game definitions and try to add them to the grid
        ctx;
        sheet;
        bracketDef;
    }
}