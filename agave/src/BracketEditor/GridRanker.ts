import { Grid, RangeOverlapDelegate, RangeOverlapMatch } from "./Grid";
import { BracketDefinition } from "../Brackets/BracketDefinitions";
import { GridItem } from "./GridItem";
import { BracketGame, IBracketGame } from "./BracketGame";
import { RangeInfo, RangeOverlapKind } from "../Interop/Ranges";

export class GridRank
{
    cDisqualifers: number = 0;
    cAlmostAdjacentFeeder: number = 0;
    cDisconnectedSources: number = 0;
    fDisqualified: boolean = false;
}

export class GridRanker
{
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

        grid.enumerate(
            (item: GridItem) =>
            {
                maxHeight = Math.max(maxHeight, item.Range.LastRow);
                maxColumn = Math.max(maxColumn, item.Range.LastColumn);

                areaCovered += item.Range.RowCount * item.Range.ColumnCount;

                const overlapping: GridItem[] = grid.getOverlappingItems(item.Range);
                if (overlapping.length > 1)
                {
                    gridRank.fDisqualified = true;
                    return false;
                }

                if (overlapping.length == 0)
                    throw Error("can't find item we just enumerated")

                if (!item.isLineRange)
                {
                    const game: IBracketGame = BracketGame.CreateFromGameSync(bracket, item.GameId.GameNum);
                    const [item1, item2] = grid.getFeederConnectionsForGame(item, game);
                    let [source1, source2, outgoing] = grid.getFeederInfoForGame(game);
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
                        rangesToCheck.push({ range: gameTop.offset(0, 2, -1, 1), delegate: delegateDisqalOverlap });
                        rangesToCheck.push({ range: gameTop.offset(0, 4, -1, 1), delegate: delegateTooCloseAdjacent });
                    }
                    if (item2 == null)
                    {
                        if (source2 != null)
                        {
                            gridRank.cDisconnectedSources++;
                        }
                        // our bottom item is not connected. make sure it doesn't have anything
                        // adjacent
                        rangesToCheck.push({ range: gameBottom.offset(-1, 2, -1, 1), delegate: delegateDisqalOverlap });
                        rangesToCheck.push({ range: gameBottom.offset(-1, 4, -1, 1), delegate: delegateTooCloseAdjacent });
                    }
                    grid.enumerateOverlapping(rangesToCheck);
                }

                // see if there's anything adjacent to our feeder area
                if (gridRank.fDisqualified)
                    return false;

                return true;
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
            + (maxHeight * 1.25)
            + sparsity;
    }
}