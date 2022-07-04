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

            // check to see if we are connected to this item

            if (item.isLineRange)
            {
                if (mover.ItemNew.OutgoingFeederPoint.isEqual(item.Range.offset(0, 1, 0, 1)))
                    return true;
            }
            else
            {
                if (mover.ItemNew.OutgoingFeederPoint.isEqual(item.TopTeamRange.offset(1, 1, 0, 1)))
                    return true;

                if (mover.ItemNew.OutgoingFeederPoint.isEqual(item.BottomTeamRange.offset(-1, 1, 0, 1)))
                    return true;
            }

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
                    mover.moveRecurse(gameMover, optionWork, false, item, newItem);
            }
            else if (mover.MovedDown && (!mover.MovedUp || item.Range.FirstRow <= mover.ItemNew.Range.FirstRow))
            {
                const newItem: GridItem = item.clone().shiftByRows(mover.ShiftBottom);

                // don't make an adjustment if its still going to fail.
                if (RangeInfo.isOverlapping(range, newItem.Range) == RangeOverlapKind.None)
                    mover.moveRecurse(gameMover, optionWork, false, item, newItem);
            }

            return true;
        }


        // first move things away in our own column
        // move things away from us that we now collide with (up and down)
        let rangeOverlapCheck: RangeInfo = new RangeInfo(
            mover.ItemNew.Range.FirstRow - 2,
            mover.ItemNew.Range.RowCount + 4,
            mover.ItemNew.Range.FirstColumn,
            mover.ItemNew.Range.ColumnCount);

        optionWork.grid.enumerateOverlapping(
            [{ range: rangeOverlapCheck, delegate: moveItemAwayFromItem }]);

        // next things away in adjacent column (we are more tolerant with adjacency)
        rangeOverlapCheck = new RangeInfo(
            mover.ItemNew.Range.FirstRow - 2,
            mover.ItemNew.Range.RowCount + 2,
            mover.ItemNew.Range.LastColumn + 1,
            1);

        optionWork.grid.enumerateOverlapping(
            [{ range: rangeOverlapCheck, delegate: moveItemAwayFromItem }]);

    }
}