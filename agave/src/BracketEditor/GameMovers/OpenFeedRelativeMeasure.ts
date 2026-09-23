import { GameId } from "../GameId";
import { Grid } from "../Grid";
import { GridItem } from "../GridItem";
import { RangeInfo } from "../../Interop/Ranges";

/*----------------------------------------------------------------------------
    %%Class: OpenFeedRelativeMeasure

    if a game has this recorded, then it tells us how the loser feed (which
    is a disconnected source by definition) is positioned relative to a
    *following* game to the left of us. This lets us try to maintain that
    relative positioning.

    since we are moving DOWN always, we cannot rely on games ABOVE us since
    we are moving away from them.
----------------------------------------------------------------------------*/
export class OpenFeedRelativeMeasure
{
    private m_gameIdRelativeTo: GameId;
    private m_isOpenTopFeed: boolean = false;
    private m_delta: number;

    get GameIdRelativeTo(): GameId
    {
        return this.m_gameIdRelativeTo;
    }


    get IsLoserTopFeed(): boolean
    {
        return this.m_isOpenTopFeed;
    }


    get Delta(): number
    {
        return this.m_delta;
    }


    /*----------------------------------------------------------------------------
        %%Function: createFromGridItem
        %%Qualified: OpenFeedRelativeMeasure.createFromGridItem

        create a new measure from the given grid and gridItem. we can only
        return a measure if only one of our incoming feeds is open.

        the measure we return is relative to the item connected to our non-open
        feed
    ----------------------------------------------------------------------------*/
    static createFromGridItem(grid: Grid, item: GridItem): OpenFeedRelativeMeasure
    {
        const [topFeedItem, bottomFeedItem] = grid.getConnectedGridItemsForGameFeeders(item, item.BracketGameCache);

        // if there are no feeder items, we can't capture relative positioning
        if (topFeedItem == null && bottomFeedItem == null)
            return null;

        const relativeMeasure: OpenFeedRelativeMeasure = new OpenFeedRelativeMeasure();

        if (topFeedItem == null)
        {
            relativeMeasure.m_isOpenTopFeed = true;
            relativeMeasure.m_delta = item.TopTeamRange.FirstRow - bottomFeedItem.Range.FirstRow;
            relativeMeasure.m_gameIdRelativeTo = bottomFeedItem.BracketGameCache.GameId;
        }
        else if (bottomFeedItem == null && !item.IsChampionshipGame)
        {
            relativeMeasure.m_delta = item.BottomTeamRange.LastRow - topFeedItem.Range.LastRow;
            relativeMeasure.m_gameIdRelativeTo = topFeedItem.BracketGameCache.GameId;
            relativeMeasure.m_isOpenTopFeed = false;
        }
        else
        {
            // neither are null -- no relative measure
            return null;
        }

        return relativeMeasure;
    }
}
