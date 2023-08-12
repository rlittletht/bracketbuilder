import { RangeInfo, RangeOverlapKind } from "../../Interop/Ranges";
import { GridItem } from "../GridItem";
import { GridOption, GameMover } from "../GridAdjusters/GameMover";
import { Mover } from "./Mover";
import { Grid } from "../Grid";

export class PushAway
{
    /*----------------------------------------------------------------------------
        %%Function: PushAway.calcShiftUpDownFromOverlappingItems

        Given two items, an existing item and a newly placed item, determine
        how to shift the existing item out of the way.
    ----------------------------------------------------------------------------*/
    static calcShiftUpDownFromOverlappingItems(itemNew: GridItem, itemExisting: GridItem, dRowsBuffer: number): number
    {
        if (dRowsBuffer % 2 != 0)
            throw new Error("buffer must be multiple of 2!");

        const dTop: number = itemNew.Range.FirstRow - itemExisting.Range.FirstRow;
        const dBottom: number = itemNew.Range.LastRow - itemExisting.Range.LastRow;

        //     ---old---
        //     |       |
        // -new+-------+---
        // |   |       |  |
        // |   ---------  |
        // |              |
        // ----------------
        // or
        //
        // -new------------
        // |   ---old---  |
        // |   |       |  |
        // |   |       |  |
        // |   ---------  |
        // |              |
        // ----------------
        if ((dBottom >= 0 && dTop >= 0)
            || ((dBottom > 0 && dTop < 0)
                && Math.abs(dBottom) >= Math.abs(dTop)))
        {
            // shift up
            return -(itemExisting.Range.LastRow - itemNew.Range.FirstRow + dRowsBuffer);
        }
        // -new------------
        // |              |
        // |   ---------  |
        // |   |       |  |
        // ----+-------+---
        //     |       |
        //     ---old---
        // or
        //
        // -new------------
        // |              |
        // |   ---old---  |
        // |   |       |  |
        // |   |       |  |
        // |   ---------  |
        // ----------------
        else if ((dBottom < 0 && dTop < 0)
            || ((dBottom > 0 && dTop < 0)
                && Math.abs(dBottom) < Math.abs(dTop)))
        {
            // shift down
            return itemNew.Range.LastRow - itemExisting.Range.FirstRow + dRowsBuffer;
        }

        return 0;
    }


    /*----------------------------------------------------------------------------
        %%Function: PushAway.checkAndMoveItemsAway

        This module will determine when the moved item land on (or too close to)
        another item, and moves that item away.

        this checks only for game items and should be the most aggressive about
        pushing away since it is checking only direct overlaps in the target
        column

        this does not move any connected items -- that's the responsibility of
        the dragging modules
    ----------------------------------------------------------------------------*/
    static checkAndMoveItemsAway(gameMover: GameMover, mover: Mover, optionWork: GridOption, crumbs: string): boolean
    {
        let subMove = 0;
        let changes: boolean = false;

        const moveItemAwayFromItem = (range: RangeInfo, item: GridItem, kind: RangeOverlapKind) =>
        {
            if (item.isEqual(mover.ItemNew))
                return true;

            // if we are connected to this item, we don't want to try to move it. the connections
            // will get dragged by another module.

            if (item.isLineRange)
            {
                // lines will be pushed in a less aggressive overlap check (below)
                return true;
            }
            else
            {
                if (!mover.ItemNew.IsChampionshipGame)
                {
                    if (mover.ItemNew.OutgoingFeederPoint.isEqual(item.TopTeamRange.offset(1, 1, 0, 1)))
                        return true;

                    if (mover.ItemNew.OutgoingFeederPoint.isEqual(item.BottomTeamRange.offset(-1, 1, 0, 1)))
                        return true;
                }
            }

            range;
            kind;

            // the given item overlaps with the range. move it away (either up or down)
            // if we moved up AND we didn't move down, OR we moved down and the lastRow
            // of this overlapping item at or beyond our new last row. that last part covers
            // the new item growing up AND down, but this overlapping item was above us so
            // it should move up.
            const shift = PushAway.calcShiftUpDownFromOverlappingItems(mover.ItemNew, item, 4);

            if (shift != 0)
            {
                // we have an adjustment we could make
                const newItem: GridItem = item.clone().shiftByRows(shift);

                // don't make an adjustment if its still going to fail.
                if (RangeInfo.isOverlapping(range, newItem.Range) == RangeOverlapKind.None)
                {
                    changes = mover.moveRecurse(gameMover, optionWork, true, item, newItem, "checkAndMoveItemsAway_shift", `${crumbs}.${subMove++}`);
                }
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

        return changes;
    }

    /*----------------------------------------------------------------------------
        %%Function: PushAway.checkAndMoveLinesAway

        This should be run against a less aggressive overlap check -- just a
        direct overlap, not adjacent (since we're OK with lines being right next
        to our game)

        This is currently NYI
    ----------------------------------------------------------------------------*/
    static checkAndMoveLinesAway(gameMover: GameMover, mover: Mover, optionWork: GridOption, crumbs: string): boolean
    {
        let changes: boolean = false;

        const moveItemAwayFromItem = (range: RangeInfo, item: GridItem, kind: RangeOverlapKind) =>
        {
            if (item.isEqual(mover.ItemNew))
                return true;

            // if we are connected to this item, we don't want to try to move it. the connections
            // will get dragged by another module.

            if (!item.isLineRange)
            {
                // we only care about lines in this module
                return true;
            }
            else
            {
                if (!mover.ItemNew.IsChampionshipGame)
                {
                    if (mover.ItemNew.OutgoingFeederPoint.isEqual(item.TopTeamRange.offset(1, 1, 0, 1)))
                        return true;

                    if (mover.ItemNew.OutgoingFeederPoint.isEqual(item.BottomTeamRange.offset(-1, 1, 0, 1)))
                        return true;
                }
            }

            range;
            kind;
            const shift: number = PushAway.calcShiftUpDownFromOverlappingItems(mover.ItemNew, item, 4);

            if (shift != 0)
            {
                // we have an adjustment we could make
                const newItem: GridItem = item.clone().shiftByRows(shift);

                // don't make an adjustment if its still going to fail.
                if (RangeInfo.isOverlapping(range, newItem.Range) == RangeOverlapKind.None)
                {
                    changes = mover.moveRecurse(gameMover, optionWork, true, item, newItem, "checkAndMoveLinesAway_shift", crumbs);
                }
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

        return changes;
    }


    /*----------------------------------------------------------------------------
        %%Function: PushAway.checkAndMoveAdjacentItemsAway

        This time we are only checking the column adjacent to us to see if we
        should push an item up or down
    ----------------------------------------------------------------------------*/
    static checkAndMoveAdjacentItemsAway(gameMover: GameMover, mover: Mover, optionWork: GridOption, crumbs: string): boolean
    {
        let subMove = 0;
        let changes: boolean = false;

        const moveItemAwayFromItem = (range: RangeInfo, item: GridItem, kind: RangeOverlapKind) =>
        {
            if (item.isEqual(mover.ItemNew))
            {
                throw new Error("can't have our moved item in the adjacent column!!");
            }

            // if we are connected to this item, we don't want to try to move it. the connections
            // will get dragged by another module.

            if (item.isLineRange)
            {
                // we don't handle lines here...
                return true;
            }
            else
            {
                if (!mover.ItemOld.IsChampionshipGame)
                {
                    // check to see if the adjacent item is a game connected to us...
                    if (mover.ItemOld.OutgoingFeederPoint.isEqual(item.TopTeamRange.offset(1, 1, 0, 1)))
                        return true;

                    if (mover.ItemOld.OutgoingFeederPoint.isEqual(item.BottomTeamRange.offset(-1, 1, 0, 1)))
                        return true;
                }
            }

            range;
            kind;
            const shift: number = PushAway.calcShiftUpDownFromOverlappingItems(mover.ItemNew, item, 2);

            if (shift != 0)
            {
                // we have an adjustment we could make
                const newItem: GridItem = item.clone().shiftByRows(shift);
                const rangeRealToAvoid: RangeInfo =
                    new RangeInfo(
                        range.FirstRow + 2,
                        range.RowCount - 2,
                        range.LastColumn,
                        1);

                // don't make an adjustment if its still going to fail.
                if (RangeInfo.isOverlapping(rangeRealToAvoid, newItem.Range) == RangeOverlapKind.None)
                {
                    changes = mover.moveRecurse(gameMover, optionWork, true, item, newItem, "checkAndMoveAdjacentItemsAway_shift", `${crumbs}.${subMove++}`);
                }
            }

            return true;
        }


        // move things away in adjacent column (we are more tolerant with adjacency)
        let rangeOverlapCheck = new RangeInfo(
            mover.ItemNew.Range.FirstRow - 2,
            mover.ItemNew.Range.RowCount + 2,
            mover.ItemNew.Range.LastColumn + 1,
            1);

        optionWork.grid.enumerateOverlapping(
            [{ range: rangeOverlapCheck, delegate: moveItemAwayFromItem }]);

        return changes;
    }

}