import { GameId } from "../GameId";
import { Grid } from "../Grid";
import { IAppContext } from "../../AppContext/AppContext";
import { _bracketManager } from "../../Brackets/BracketManager";
import { BracketManager } from "../../Brackets/BracketManager";
import { GameNum } from "../GameNum";
import { IBracketDefinitionData } from "../../Brackets/IBracketDefinitionData";
import { GridItem } from "../GridItem";
import { GameResultType } from "../../Brackets/BracketDefinitions";

export interface GameExpanderStep
{
    gameId: GameId;
    positionDelta: number;
    sizeDelta: number;
}

const emptyGameExpanderStep: GameExpanderStep = { gameId: new GameId(0), positionDelta: 0, sizeDelta: 0 };

/*----------------------------------------------------------------------------
    %%Class: GameExpander

    Analyze a grid and make the games bigger and more spaced out

    REMEMBER: all deltas MUST be in terms of worksheet rows. This means
    to add a row between two games, you are adding TWO ROWS (the line row
    and the team row)
----------------------------------------------------------------------------*/
export class GameExpander
{
    static getGameIdsToConsiderForBracket(bracketDefinition: IBracketDefinitionData): Set<number>
    {
        const gameIdsToConsider: Set<number> = new Set<number>();

        for (let i = 0; i < bracketDefinition.games.length; i++)
        {
            const gameDefinition = bracketDefinition.games[i];

            if (!BracketManager.IsTeamSourceStatic(gameDefinition.topSource) && !BracketManager.IsTeamSourceStatic(gameDefinition.bottomSource))
                continue;

            // first round games are always considered
            gameIdsToConsider.add(new GameNum(i).GameId.Value);

            // and also the games that the losing team goes to
            const loserAdvancesToId = BracketManager.GameIdFromTopBottom(gameDefinition.loser);

            gameIdsToConsider.add(loserAdvancesToId.Value);
        }
        return gameIdsToConsider;
    }

    /*----------------------------------------------------------------------------
        %%Function: gameShouldReposition
        %%Qualified: GameExpander.gameShouldReposition

        games should not reposition if they are attached to another game
        (so if either feeder is a winning team, they are connected)

        we take both the bracket AND the feed items to catch inconsistencies
    ----------------------------------------------------------------------------*/
    static gameShouldReposition(bracketDefinition: IBracketDefinitionData, item: GridItem, topFeed: GridItem | null, bottomFeed: GridItem | null): boolean
    {
        const gameDef = bracketDefinition.games[item.GameId.GameNum.Value];

        if (topFeed && BracketManager.IsTeamSourceStatic(item.unswap(gameDef.topSource, gameDef.bottomSource)))
            throw new Error("top feed is connected on the grid but isn't supposed to be according to the bracket definition");

        if (bottomFeed && BracketManager.IsTeamSourceStatic(item.unswap(gameDef.bottomSource, gameDef.topSource)))
            throw new Error("bottom feed is connected on the grid but isn't supposed to be according to the bracket definition");

        return !(topFeed || bottomFeed);
    }

    /*----------------------------------------------------------------------------
        %%Function: canIgnoreFirstGameWithBottomFeedConnected
        %%Qualified: GameExpander.canIgnoreFirstGameWithBottomFeedConnected

        the very top first round game in the bracket should get ignore IF
        its bottom feed is connected -- the connected game will take care
        of expanding it.  (the connected game grows by 4, which moves the
        feeder point down by 2 AND when we drag it down, we will leave the
        top unconnected feed alone which is the other 2 we want to grow)

        (replace "4" by deltaSize and 2 by deltaSize / 2 and the explanation
        still holds)

        we take both the bracket AND the feed items to catch inconsistencies
    ----------------------------------------------------------------------------*/
    static canIgnoreFirstGameWithBottomFeedConnected(bracketDefinition: IBracketDefinitionData, item: GridItem, topFeed: GridItem | null, bottomFeed: GridItem | null): boolean
    {
        if (item.isLineRange)
            return false;

        const gameDef = bracketDefinition.games[item.GameId.GameNum.Value];

        if (!bottomFeed)
            return false;

        if (BracketManager.IsTeamSourceStatic(item.unswap(gameDef.bottomSource, gameDef.topSource)))
            throw new Error("bottom feed is connected on the grid but isn't supposed to be according to the bracket definition");

        if (topFeed)
        {
            if (BracketManager.IsTeamSourceStatic(item.unswap(gameDef.topSource, gameDef.bottomSource)))
                throw new Error("top feed is connected on the grid but isn't supposed to be according to the bracket definition");

            // can't skip if both feeds are connected. then again, we shouldn't have gotten here anyway...
            return false;
        }

        return true;
    }


    /*----------------------------------------------------------------------------
        %%Function: shouldOutfeedGameDisplaceGamesBelow
        %%Qualified: GameExpander.shouldOutfeedGameDisplaceGamesBelow

        we should displace lower games only if the outfeedGame we are linked to
        is linked at the TOP
    ----------------------------------------------------------------------------*/
    static shouldOutfeedGameDisplaceGamesBelow(grid: Grid, gameItem: GridItem, outfeedGame: GridItem): boolean
    {
        const [topFeed, bottomFeed] = grid.getConnectedGridItemsForGameFeeders(outfeedGame, outfeedGame.BracketGameCache);

        return topFeed && topFeed.GameId.Value == gameItem.GameId.Value;
    }

    /*----------------------------------------------------------------------------
        %%Function: generateStepsToExpandAndSpaceOutGames
        %%Qualified: GameExpander.generateStepsToExpandAndSpaceOutGames

        we are going to move games from the bottom to the top, so we have
        to know ahead of time how much every game has to move.

        we only have to worry about the actual games we are going to move -- these
        are the games that have "dangling feeders" into them (i.e. a loser feeds
        into either the top or bottom or both)

        we (arbitrarily) only do this for first round games, or for the first
        loser out game for any team (we will determine the candidate games from
        the bracket definition)
    ----------------------------------------------------------------------------*/
    public static generateStepsToExpandAndSpaceOutGames(appContext: IAppContext, bracketName: string, grid: Grid, sizeDelta: number, gapDelta: number): GameExpanderStep[]
    {
        appContext;
        if (sizeDelta % 4 != 0)
            throw new Error("sizeDelta must include line rows AND must move the outgoing feeder in whole increments");

        if (gapDelta % 2 != 0)
            throw new Error("gapDelta must include line rows");

        const steps: GameExpanderStep[] = [];

        // determine the games to move
        const bracketDefinition = _bracketManager.GetBracketDefinitionData(bracketName);
        const gameIdsToConsider = GameExpander.getGameIdsToConsiderForBracket(bracketDefinition);

        // now sort the grid items so we start at the top
        const gridItemsTopToBottom: GridItem[] = grid.getItemsTopToBottom();

        let firstGame = true;
        let cumulativeDelta = 0;
        let lastExpandedDelta = 0;
        for (const gridItem of gridItemsTopToBottom)
        {
            if (gridItem.isLineRange || !gameIdsToConsider.has(gridItem.GameId.Value))
                continue;

            const [topFeed, bottomFeed] = grid.getConnectedGridItemsForGameFeeders(gridItem, gridItem.BracketGameCache);
            const outFeed = grid.getConnectedGridItemForGameResult(gridItem.BracketGameCache);

            const canIgnoreFirstGameWithBottomFeedConnected = GameExpander.canIgnoreFirstGameWithBottomFeedConnected(bracketDefinition, gridItem, topFeed, bottomFeed);
            const shouldOnlyGrowGame = !GameExpander.gameShouldReposition(bracketDefinition, gridItem, topFeed, bottomFeed);

            if (!shouldOnlyGrowGame)
            {
                cumulativeDelta += lastExpandedDelta;
                lastExpandedDelta = 0;

                if (!firstGame)
                    cumulativeDelta += gapDelta;

                // extra special case for the very top game in the bracket that IS NOT a first round game)
                if (!firstGame || !canIgnoreFirstGameWithBottomFeedConnected)
                    lastExpandedDelta = sizeDelta;
            }

            // now see if we are connected on the outgoing feed, in which case subsequent games are going to shift down
            // by the change in the outFood
            if (outFeed && gameIdsToConsider.has(outFeed.GameId.Value) && this.shouldOutfeedGameDisplaceGamesBelow(grid, gridItem, outFeed))
                lastExpandedDelta += (sizeDelta / 2);

            firstGame = false;
            if (canIgnoreFirstGameWithBottomFeedConnected)
            {
                const step: GameExpanderStep = { gameId: gridItem.GameId, positionDelta: 0, sizeDelta: 0 };
                steps.unshift(step);
            }
            else
            {
                const step: GameExpanderStep = { gameId: gridItem.GameId, positionDelta: shouldOnlyGrowGame ? 0 : cumulativeDelta, sizeDelta: sizeDelta };
                steps.unshift(step);
            }
        }
        return steps;
    }
}