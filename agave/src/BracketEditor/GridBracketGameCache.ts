import { IBracketGame } from "./IBracketGame";
import { BracketGame } from "./BracketGame";
import { GridItem } from "./GridItem";
import { BracketGameBase } from "./BracketGameBase";
import { JsCtx } from "../Interop/JsCtx";
import { IAppContext } from "../AppContext/AppContext";

export enum GridBracketGameCacheState
{
    Unknown,
    Clean,
    Dirty
}

// this is cached when we load the grid from the bracket (or for unit tests, when we
// create the grid)

// we try to keep it up to date when we edit the grid, but once any edit is done
// it no longer matches the workbook so it will be marked dirty.

export class GridBracketGameCache extends BracketGameBase implements IBracketGame
{
    m_state: GridBracketGameCacheState = GridBracketGameCacheState.Unknown;

    public get IsBroken(): boolean
    {
        return false;
    }

    public Bind(context: JsCtx, appContext: IAppContext): Promise<IBracketGame>
    {
        context;
        appContext;
        throw new Error("GridBracketGameCache.Bind() should never be called.");
    }

    public get State(): GridBracketGameCacheState
    {
        return this.m_state;
    }

    public static createFromBracketGame(bracketGame: IBracketGame): GridBracketGameCache
    {
        if (!bracketGame.IsLinkedToBracket)
            throw new Error("GridBracketGameCache can only be created from a bracket game that is linked");

        const gameCache: GridBracketGameCache = new GridBracketGameCache();

        // if the bracket game is broken, then we don't want to copy the values over because they are not valid
        if (bracketGame.IsBroken)
            return gameCache;

        // populate the static portions of the game (this is what LoadSync populated)
        gameCache.m_gameNum = bracketGame.GameNum;
        gameCache.m_bracketName = bracketGame.BracketName;
        gameCache.m_bracketGameDefinition = bracketGame.BracketGameDefinition;
        gameCache.m_swapTopBottom = bracketGame.SwapTopBottom;
        gameCache.m_startTime = bracketGame.StartTime;
        gameCache.m_field = bracketGame.Field;

        // now set the values that Bind() setup
        gameCache.m_bottomTeamLocation = bracketGame.BottomTeamRange?.clone();
        gameCache.m_topTeamLocation = bracketGame.TopTeamRange?.clone();
        gameCache.m_gameNumberLocation = bracketGame.GameIdRange?.clone();

        // now set the overrides
        gameCache.m_topTeamOverride = bracketGame.TopTeamOverride;
        gameCache.m_topTeamNameValue = bracketGame.TopTeamNameValue;
        gameCache.m_bottomTeamOverride = bracketGame.BottomTeamOverride;
        gameCache.m_bottomTeamNameValue = bracketGame.BottomTeamNameValue;
        gameCache.m_fieldOverride = bracketGame.FieldOverride;
        gameCache.m_timeOverride = bracketGame.TimeOverride;

        gameCache.m_state = GridBracketGameCacheState.Clean;
        return gameCache;
    }

    public static createFromGridItem(gridItem: GridItem): GridBracketGameCache
    {
        if (gridItem.BracketGameCache == null)
            return null;

        const gameCache: GridBracketGameCache = new GridBracketGameCache();

        // populate the static portions of the game (this is what LoadSync populated)
        gameCache.m_gameNum = gridItem.m_bracketGameCache.m_gameNum;
        gameCache.m_bracketName = gridItem.m_bracketGameCache.m_bracketName;
        gameCache.m_bracketGameDefinition = gridItem.m_bracketGameCache.m_bracketGameDefinition;
        gameCache.m_swapTopBottom = gridItem.m_bracketGameCache.m_swapTopBottom;
        gameCache.m_startTime = gridItem.m_bracketGameCache.m_startTime;
        gameCache.m_field = gridItem.m_bracketGameCache.m_field;

        // now set the values that Bind() setup
        gameCache.m_bottomTeamLocation = gridItem.m_bracketGameCache.m_bottomTeamLocation?.clone();
        gameCache.m_topTeamLocation = gridItem.m_bracketGameCache.m_topTeamLocation?.clone();
        gameCache.m_gameNumberLocation = gridItem.m_bracketGameCache.m_gameNumberLocation?.clone();

        // now set the overrides
        gameCache.m_topTeamOverride = gridItem.m_bracketGameCache.m_topTeamOverride;
        gameCache.m_topTeamNameValue = gridItem.m_bracketGameCache.m_topTeamNameValue;
        gameCache.m_bottomTeamOverride = gridItem.m_bracketGameCache.m_bottomTeamOverride;
        gameCache.m_bottomTeamNameValue = gridItem.m_bracketGameCache.m_bottomTeamNameValue;
        gameCache.m_fieldOverride = gridItem.m_bracketGameCache.m_fieldOverride;
        gameCache.m_timeOverride = gridItem.m_bracketGameCache.m_timeOverride;

        gameCache.m_state = GridBracketGameCacheState.Clean;
        return gameCache;
    }

    public static createFromInferedGridItem(gridItem: GridItem, bracketName: string): GridBracketGameCache
    {
        const gameCache: GridBracketGameCache = new GridBracketGameCache();

        gameCache.LoadSync(bracketName, gridItem.GameNumber);

        gameCache.m_swapTopBottom = gridItem.SwapTopBottom;
        gameCache.m_startTime = gridItem.StartTime;
        gameCache.m_field = gridItem.Field;

        // now populate what we can from the inferrred item
        gameCache.m_bottomTeamLocation = gridItem.BottomTeamRange?.clone();
        gameCache.m_topTeamLocation = gridItem.TopTeamRange?.clone();
        gameCache.m_gameNumberLocation = gridItem.GameNumberRange?.clone();

        if (gameCache.SwapTopBottom)
        {
            gameCache.m_topTeamNameValue = gameCache.BracketGameDefinition.bottomSource;
            gameCache.m_bottomTeamNameValue = gameCache.BracketGameDefinition.topSource;
        }
        else
        {
            gameCache.m_topTeamNameValue = gameCache.BracketGameDefinition.topSource;
            gameCache.m_bottomTeamNameValue = gameCache.BracketGameDefinition.bottomSource;
        }

        // we don't match the workbook, so we can't be clean
        gameCache.m_state = GridBracketGameCacheState.Dirty;
        return gameCache;
    }


    public invalidateForGameInternalChange()
    {
        this.m_state = GridBracketGameCacheState.Unknown;
    }

    public updateForEdit(updateFun: (cache: GridBracketGameCache) => void)
    {
        updateFun(this);

        if (this.m_state == GridBracketGameCacheState.Clean)
            this.m_state = GridBracketGameCacheState.Dirty;
    }
}