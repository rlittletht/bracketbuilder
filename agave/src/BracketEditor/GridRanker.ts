import { RangeInfo, RangeOverlapKind } from "../Interop/Ranges";
import { BracketGame, IBracketGame } from "./BracketGame";
import { Grid, RangeOverlapDelegate, RangeOverlapMatch } from "./Grid";
import { GridItem } from "./GridItem";

export class GridRank
{
    cDisqualifers: number = 0;
    cAlmostAdjacentFeeder: number = 0;
    cTooCloseSameColumn: number = 0;
    cDisconnectedSources: number = 0;
    fDisqualified: boolean = false;
    homogeneityPenalty: number = 0;
    oddHeightPenalty: number = 0;
}

export class GridRanker
{
    static updateOddHeightPenalty(height: number, count: number, gridRank: GridRank)
    {
        let penalty: number = 0;

        if ((height - 3) % 4 != 0)
            penalty += count;

        gridRank.oddHeightPenalty += penalty;
    }


    /*----------------------------------------------------------------------------
        %%Function: GridRanker.getGridRank

        Rank the grid. Lower numbers are better

        Things that increase the score:
        - Average game height
        - Sparsity
        - Count of 'odd' height games ((height + 1) % 4 != 0)
        - Overlapping lines (disqualifying)
        - Feeder point adjacent to unrelated game (disqualifying)
        - Feader point too close to adjacent unrelated game 
        - Overall grid height
    ----------------------------------------------------------------------------*/
    static getGridRank(grid: Grid, bracket: string): number
    {
        const gridRank: GridRank = new GridRank();

        let maxHeight: number = 0;
        let maxColumn: number = 0;
        let areaCovered: number = 0;
        const mapColGameHeightCounts: Map<number, Map<number, number>> = new Map<number, Map<number, number>>();

        grid.enumerate(
            (item: GridItem) =>
            {
                if (!item.isLineRange)
                {
                    if (!mapColGameHeightCounts.has(item.Range.FirstColumn))
                        mapColGameHeightCounts.set(item.Range.FirstColumn, new Map<number, number>());

                    if (!mapColGameHeightCounts.get(item.Range.FirstColumn).has(item.Range.RowCount))
                        mapColGameHeightCounts.get(item.Range.FirstColumn).set(item.Range.RowCount, 0);

                    mapColGameHeightCounts.get(item.Range.FirstColumn).set(item.Range.RowCount,
                        mapColGameHeightCounts.get(item.Range.FirstColumn).get(item.Range.RowCount) + 1);
                }

                maxHeight = Math.max(maxHeight, item.Range.LastRow);
                maxColumn = Math.max(maxColumn, item.Range.LastColumn);

                areaCovered += item.Range.RowCount * item.Range.ColumnCount;
                if (item.Range.FirstRow < grid.FirstGridPattern.FirstRow
                    || item.Range.FirstColumn < grid.FirstGridPattern.FirstColumn)
                {
                    gridRank.fDisqualified = true;
                    return false;
                }

                if (item.Range.FirstRow > item.Range.LastRow)
                {
                    gridRank.fDisqualified = true;
                    return false;
                }

                if (item.Range.FirstColumn > item.Range.LastColumn)
                {
                    gridRank.fDisqualified = true;
                    return false;
                }

                const overlapping: GridItem[] = grid.getOverlappingItems(item.Range);
                if (overlapping.length > 1)
                {
                    gridRank.fDisqualified = true;
                    return false;
                }

                if (overlapping.length == 0)
                    throw new Error("can't find item we just enumerated")

                if (!item.isLineRange)
                {
                    const game: IBracketGame = BracketGame.CreateFromGameSync(bracket, item.GameId.GameNum);
                    game.SetSwapTopBottom(item.SwapTopBottom);
                    const [item1, item2] = grid.getConnectedGridItemsForGameFeeders(item, game);
                    let [source1, source2, outgoing] = grid.getRangeInfoForGameFeederItemConnectionPoints(game);
                    let fSwap: boolean = false;
                    [source1, source2, fSwap] = Grid.normalizeSources(source1, source2, fSwap);
                    const delegateDisqalOverlap: RangeOverlapDelegate = (matchRange: RangeInfo, matchItem: GridItem, matchKind: RangeOverlapKind) =>
                    {
                        matchRange;
                        matchItem;
                        matchKind;
                        gridRank.cDisqualifers++;
                        gridRank.fDisqualified = true;
                        return true;
                    };
                    const delegateTooCloseAdjacent: RangeOverlapDelegate = (matchRange: RangeInfo, matchItem: GridItem, matchKind: RangeOverlapKind) =>
                    {
                        matchRange;
                        matchItem;
                        matchKind;
                        gridRank.cAlmostAdjacentFeeder++;
                        return true;
                    };
                    const delegateTooCloseSameColumn: RangeOverlapDelegate = (matchRange: RangeInfo, matchItem: GridItem, matchKind: RangeOverlapKind) =>
                    {
                        matchRange;
                        matchItem;
                        matchKind;
                        gridRank.cTooCloseSameColumn++;
                        return true;
                    };
                    let rangesToCheck: RangeOverlapMatch[] = [];
                    const gameTop: RangeInfo = fSwap ? item.BottomTeamRange : item.TopTeamRange;
                    const gameBottom: RangeInfo = !fSwap ? item.BottomTeamRange : item.TopTeamRange;

                    if (item1 == null)
                    {
                        if (source1 != null)
                        {
                            gridRank.cDisconnectedSources++;
                        }
                        // our top item is not connected. make sure it doesn't have anything
                        // adjacent
                        // disqualifying if there is an item to the left of us overlapping our feeder line
                        rangesToCheck.push({ range: gameTop.offset(0, 2, -1, 1), delegate: delegateDisqalOverlap });

                        // too adjacent if there is a team name to the left of us that is on the same line as our team name.
                        rangesToCheck.push({ range: gameTop.offset(-1, 2, -1, 1), delegate: delegateTooCloseAdjacent });

                        // we prefer a full row (i.e. a name row + line row) between games in the same column
                        rangesToCheck.push({ range: gameTop.offset(-2, 2, 0, 1), delegate: delegateTooCloseSameColumn });
                        
                    }
                    if (item2 == null)
                    {
                        if (source2 != null)
                        {
                            gridRank.cDisconnectedSources++;
                        }
                        if (gameBottom) // protect against championship game
                        {
                            // our bottom item is not connected. make sure it doesn't have anything
                            // adjacent
                            rangesToCheck.push({ range: gameBottom.offset(-1, 2, -1, 1), delegate: delegateDisqalOverlap });
                            rangesToCheck.push({ range: gameBottom.offset(0, 2, -1, 1), delegate: delegateTooCloseAdjacent });

                            // we prefer a full row (i.e. a name row + line row) between games in the same column
                            rangesToCheck.push({ range: gameBottom.offset(1, 2, 0, 1), delegate: delegateTooCloseSameColumn });
                        }
                    }
                    grid.enumerateOverlapping(rangesToCheck);
                }

                // see if there's anything adjacent to our feeder area
                if (gridRank.fDisqualified)
                    return false;

                return true;
            });


        // two things we are interested in with the heights
        // 1) How many "odd" sizes to we have (i.e. not a multiple of 4, which means
        //    the outgoing line won't be perfectly centered)
        // 2) If we have only 2 different heights, how close are we to having just a single
        //    consistent height?
        mapColGameHeightCounts.forEach(
            (mapHeightsCount, key, map) =>
            {
                key;
                map;
                const iterHeightsCountKeys = mapHeightsCount.keys();

                const item1 = iterHeightsCountKeys.next();
                const item2 = iterHeightsCountKeys.next();

                if (!item1.done)
                    GridRanker.updateOddHeightPenalty(item1.value, mapHeightsCount.get(item1.value), gridRank);

                if (!item2.done)
                    GridRanker.updateOddHeightPenalty(item2.value, mapHeightsCount.get(item1.value), gridRank);

                let penalty: number = 0;
                if (!item1.done && !item2.done)
                {
                    const key1 = item1.value;
                    const key2 = item2.value;

                    const delta = Math.abs(mapHeightsCount.get(key1) - mapHeightsCount.get(key2)) + 1;
                    const total = mapHeightsCount.get(key1) + mapHeightsCount.get(key2);

                    penalty = (delta * 20) / total;
                }

                let item = iterHeightsCountKeys.next();

                // only update penalty if there were only 2 different heights. if we have a 3rd, then don't record it.
                if (item.done)
                    gridRank.homogeneityPenalty += penalty;

                while (!item.done)
                {
                    GridRanker.updateOddHeightPenalty(item.value, mapHeightsCount.get(item1.value), gridRank);
                    item = iterHeightsCountKeys.next();
                }
            });

        // now calculate the rank
        if (gridRank.fDisqualified)
            return -1;

        const sparsity: number =
            100
                - Math.floor(
                    (areaCovered / ((maxColumn - grid.FirstGridPattern.FirstColumn) * (maxHeight - grid.FirstGridPattern.FirstRow))) * 100);

        return gridRank.cAlmostAdjacentFeeder * 50
            + gridRank.cDisconnectedSources * 100
            + gridRank.cTooCloseSameColumn * 25
            + (maxHeight * 1.25)
            + sparsity
            + gridRank.homogeneityPenalty
            | gridRank.oddHeightPenalty;
    }
}