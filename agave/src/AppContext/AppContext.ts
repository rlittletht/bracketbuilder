import * as React from "react";
import { IBracketGame } from "../BracketEditor/BracketGame";
import { PerfTimer } from "../PerfTimer";
import { JsCtx } from "../Interop/JsCtx";
import { DurableState } from "../DurableState";
import { s_staticConfig } from "../StaticConfig";
import { IAppContextMessages, AppContextMessages, SetMessageDelegate, ClearMessageDelegate } from "./AppContextMessages";
import { IAppContextTeaching, AppContextTeaching } from "./AppContextTeaching";

export interface IAppContext
{
    // Log just logs the string to wherever logs are going...
    log(message: string);

    Messages: IAppContextMessages;
    Teaching: IAppContextTeaching;

    get Timer(): PerfTimer;
    /*async*/ invalidateHeroList(context: JsCtx);
    getSelectedBracket();
    getGames(): IBracketGame[];
    setProgressVisible(visible: boolean);
    setProgressVisibilityDelegate(del: ProgressVisibilityDelegate);
}

export interface InvalidateHeroListDelegate
{
    (context: JsCtx): void
}

export interface GetSelectedBracketDelegate
{
    (): string;
}

export interface GetGamesDelegate
{
    (): IBracketGame[];
}

export interface ProgressVisibilityDelegate
{
    (visible: boolean, teachbleId?: string): void;
}

export class AppContext implements IAppContext
{
    Messages: AppContextMessages = new AppContextMessages();
    Teaching: AppContextTeaching;

    m_durableState: DurableState = new DurableState();

    m_progressVisibilityDelegate: ProgressVisibilityDelegate;
    m_invalidateHeroListDelegate: InvalidateHeroListDelegate;
    m_getSelectedBracket: GetSelectedBracketDelegate;
    m_getGames: GetGamesDelegate;
    m_perfTimer: PerfTimer = new PerfTimer();

    constructor()
    {
        this.m_durableState.load(s_staticConfig.topLevelStateName);
        this.Teaching = new AppContextTeaching(this.m_durableState);
    }


    get Timer(): PerfTimer { return this.m_perfTimer; }

    setProgressVisible(visible: boolean)
    {
        this.m_progressVisibilityDelegate?.(visible);
    }

    log(message: string)
    {
        if (s_staticConfig.globalLogging)
            console.log(message);
    }

    async invalidateHeroList(context: JsCtx)
    {
        await this.m_invalidateHeroListDelegate?.(context);
    }

    getSelectedBracket(): string
    {
        if (this.m_getSelectedBracket)
            return this.m_getSelectedBracket();

        return "";
    }

    getGames(): IBracketGame[]
    {
        if (this.m_getGames)
            return this.m_getGames();

        return [];
    }

    setDelegates(
        addMessageDelegate: SetMessageDelegate,
        clearMessageDelegate: ClearMessageDelegate,
        invalidateHeroList: InvalidateHeroListDelegate,
        getSelectedBracket: GetSelectedBracketDelegate,
        getGames: GetGamesDelegate
        )
    {
        this.Messages.setMessageDelegates(addMessageDelegate, clearMessageDelegate);
        this.m_invalidateHeroListDelegate = invalidateHeroList;
        this.m_getSelectedBracket = getSelectedBracket;
        this.m_getGames = getGames;
    }

    setProgressVisibilityDelegate(progressVisibilityDelegate: ProgressVisibilityDelegate)
    {
        this.m_progressVisibilityDelegate = progressVisibilityDelegate;
    }

    static checkpoint(log: string)
    {
        if (s_staticConfig.logCheckpoints)
            console.log(log);
    }
}

export const TheAppContext = React.createContext(null);
