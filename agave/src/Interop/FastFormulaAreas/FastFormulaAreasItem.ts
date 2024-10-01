import { RangeInfo } from "../Ranges";

export class FastFormulaAreasItem
{
    m_rangeAreas: Excel.RangeAreas;
    m_rangeInfo: RangeInfo;

    constructor(rangeAreas: Excel.RangeAreas, rangeInfo: RangeInfo)
    {
        this.m_rangeAreas = rangeAreas;
        this.m_rangeInfo = rangeInfo;
    }

    // there's no way to get a range from this RangeInfo -- we have a single Excel.RangeAreas for this FormulaAreasItem
    // instead, you have to request the items you want specifically

    getRowColOffsetsIntoAreasItem(range: RangeInfo): { dRow: number, dCol: number }
    {
        const dRow = range.FirstRow - this.m_rangeInfo.FirstRow;
        const dCol = range.FirstColumn - this.m_rangeInfo.FirstColumn;

        if (dRow < 0
            || dCol < 0
            || range.LastRow > this.m_rangeInfo.LastRow
            || range.LastColumn > this.m_rangeInfo.LastColumn)
            throw new Error(`requested range out of range for FormulaAreasItem (this.range: ${this.m_rangeInfo.toFriendlyString}, requested: ${range.toFriendlyString()})`);

        return { dRow: dRow, dCol: dCol };
    }

    getFormulasForRangeInfo(range: RangeInfo): any[][]
    {
        const { dRow, dCol } = this.getRowColOffsetsIntoAreasItem(range);
        const fmlas = [];

        for (let iRow = 0; iRow < range.RowCount; iRow++)
        {
            const row = [];

            for (let iCol = 0; iCol < range.ColumnCount; iCol++)
                row.push(this.m_rangeAreas.areas.items[0].formulas[iRow + dRow][iCol + dCol]);

            fmlas.push(row);
        }

        return fmlas;
    }

    getValuesForRangeInfo(range: RangeInfo): any[][]
    {
        const { dRow, dCol } = this.getRowColOffsetsIntoAreasItem(range);
        const vals = [];

        for (let iRow = 0; iRow < range.RowCount; iRow++)
        {
            const row = [];

            for (let iCol = 0; iCol < range.ColumnCount; iCol++)
                row.push(this.m_rangeAreas.areas.items[0].values[iRow + dRow][iCol + dCol]);

            vals.push(row);
        }

        return vals;
    }
}

