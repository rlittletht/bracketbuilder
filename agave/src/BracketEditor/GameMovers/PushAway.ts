import { RangeInfo, RangeOverlapKind } from "../../Interop/Ranges";
import { GridItem } from "../GridItem";
import { GridOption, GameMover } from "../GridAdjusters/GameMover";
import { Mover } from "./Mover";
import { Grid } from "../Grid";

export class PushAway
{
    static checkAndMoveItemsAway(gameMover: GameMover, mover: Mover, optionWork: GridOption)
    {
        const moveItemAwayFromItem = (range: RangeInfo, item: GridItem, kind: RangeOverlapKind) =>
        {
            if (item.isEqual(mover.ItemNew))
                return true;

            range;
            kind;
            // the given item overlaps with the range. move it away (either up or down)
            // if we moved up AND we didn't move down, OR we moved down and the lastRow
            // of this overlapping item at or beyond our new last row. that last part covers
            // the new item growing up AND down, but this overlapping item was above us so
            // it should move up.

            if (mover.MovedUp && (!mover.MovedDown || item.Range.LastRow >= mover.ItemNew.Range.LastRow))
            {
                const newItem: GridItem = item.clone().shiftByRows(mover.ShiftTop);

                // don't make an adjustment if its still going to fail.
                if (RangeInfo.isOverlapping(range, newItem.Range) == RangeOverlapKind.None)
                {
                    const newItems: GridOption[] = gameMover.moveGameInternal(optionWork, item, newItem, mover.Bracket);

                    for (let item of newItems)
                        mover.pushOption(item);
                }
            }
            else if (mover.MovedDown && (!mover.MovedUp || item.Range.FirstRow <= mover.ItemNew.Range.FirstRow))
            {
                const newItem: GridItem = item.clone().shiftByRows(mover.ShiftBottom);

                // don't make an adjustment if its still going to fail.
                if (RangeInfo.isOverlapping(range, newItem.Range) == RangeOverlapKind.None)
                {
                    const newItems: GridOption[] = gameMover.moveGameInternal(optionWork, item, newItem, mover.Bracket);

                    for (let item of newItems)
                        mover.pushOption(item);
                }
            }

            return true;
        }


        // move things away from us that we now collide with (up and down)
        let rangeOverlapCheck: RangeInfo = new RangeInfo(
            mover.ItemNew.Range.FirstRow - 2,
            mover.ItemNew.Range.RowCount + 4,
            mover.ItemNew.Range.FirstColumn,
            mover.ItemNew.Range.ColumnCount);

        optionWork.grid.enumerateOverlapping(
            [{ range: rangeOverlapCheck, delegate: moveItemAwayFromItem }]);
    }
}