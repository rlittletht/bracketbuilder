import { Grid } from "../Grid";
import { RangeInfo } from "../../Interop/Ranges";
import { GridItem } from "../GridItem";

export class Spacer
{
    static canInsertRowSpaceBefore(gridTry: Grid, row: number): boolean
    {
        const rangeInsertBefore: RangeInfo = new RangeInfo(row, 1, 0, 1000);

        let items: GridItem[] = gridTry.getOverlappingItems(rangeInsertBefore);

        for (let item of items)
        {
            if (item.Range.FirstRow < rangeInsertBefore.FirstRow)
                return false;
        }

        return true;
    }

    static insertRowSpaceBefore(gridTry: Grid, row: number, count: number)
    {
        for (let i: number = 0; i < gridTry.m_gridItems.length; i++)
        {
            if (gridTry.m_gridItems[i].Range.FirstRow < row
                && gridTry.m_gridItems[i].Range.LastRow >= row)
            {
                throw Error("item found spanning insert row. is canInsertRowSpaceBefore broken?");
            }

            if (gridTry.m_gridItems[i].Range.FirstRow >= row)
                gridTry.m_gridItems[i].shiftByRows(count);
        }
    }
}