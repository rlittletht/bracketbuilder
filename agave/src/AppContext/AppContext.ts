import * as React from "react";
import { IBracketGame } from "../BracketEditor/BracketGame";
import { PerfTimer } from "../PerfTimer";
import { JsCtx } from "../Interop/JsCtx";
import { DurableState } from "../DurableState";
import { s_staticConfig } from "../StaticConfig";
import { IAppContextMessages, AppContextMessages, SetMessageDelegate, ClearMessageDelegate } from "./AppContextMessages";
import { IAppContextTeaching, AppContextTeaching } from "./AppContextTeaching";
import { SetupState } from "../Setup";


export interface IAppContext
{
    // Log just logs the string to wherever logs are going...
    log(message: string);

    Messages: IAppContextMessages;
    Teaching: IAppContextTeaching;

    setHeroListDirty(isDirty?: boolean);
    /*async*/ rebuildHeroListIfNeeded(context: JsCtx);
    get SelectedBracket(): string;
    set SelectedBracket(bracket: string);
    get WorkbookSetupState(): SetupState;
    set WorkbookSetupState(state: SetupState);

    getGames(): IBracketGame[];
    setProgressVisible(visible: boolean);
    setProgressVisibilityDelegate(del: ProgressVisibilityDelegate);
}

export interface RebuildHeroListDelegate
{
    (context: JsCtx): void
}

export interface GetGamesDelegate
{
    (): IBracketGame[];
}

export interface ProgressVisibilityDelegate
{
    (visible: boolean, teachbleId?: string): void;
}

export interface GetSetupStateDelegate
{
    (): SetupState;
}

export class AppContext implements IAppContext
{
    Messages: AppContextMessages = new AppContextMessages();
    Teaching: AppContextTeaching;

    m_selectedBracket: string = null;
    m_setupState: SetupState = "U";
    m_durableState: DurableState = new DurableState();
    m_heroListNeedsRebuilt: boolean = false;

    m_progressVisibilityDelegate: ProgressVisibilityDelegate;
    m_rebuildHeroListDelegate: RebuildHeroListDelegate;
    m_getGames: GetGamesDelegate;
    m_getSetupStateDelegate: GetSetupStateDelegate;

    m_perfTimer: PerfTimer = new PerfTimer();

    constructor()
    {
        this.m_durableState.load(s_staticConfig.topLevelStateName);
        this.Teaching = new AppContextTeaching(this.m_durableState);
    }

    get WorkbookSetupState(): SetupState
    {
        return this.m_setupState;
    }

    set WorkbookSetupState(state: SetupState)
    {
        this.m_setupState = state;
    }

    async setHeroListDirty(isDirty?: boolean)
    {
        this.m_heroListNeedsRebuilt = isDirty ?? true;
    }

    setProgressVisible(visible: boolean)
    {
        this.m_progressVisibilityDelegate?.(visible);
    }

    log(message: string)
    {
        if (s_staticConfig.globalLogging)
            console.log(message);
    }

    async rebuildHeroListIfNeeded(context: JsCtx)
    {
        if (this.m_heroListNeedsRebuilt)
            await this.m_rebuildHeroListDelegate?.(context);

        this.m_heroListNeedsRebuilt = false;
    }

    get SelectedBracket(): string
    {
        return this.m_selectedBracket;
    }

    set SelectedBracket(bracket: string)
    {
        this.m_selectedBracket = bracket;
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
        invalidateHeroList: RebuildHeroListDelegate,
        getGames: GetGamesDelegate
//        getSetupState: GetSetupStateDelegate
        )
    {
        this.Messages.setMessageDelegates(addMessageDelegate, clearMessageDelegate);
        this.m_rebuildHeroListDelegate = invalidateHeroList;
        this.m_getGames = getGames;
//        this.m_getSetupStateDelegate = getSetupState;
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

    static log(log: string)
    {
        if (s_staticConfig.appLogging)
            console.log(log);
    }

}

export const TheAppContext = React.createContext(null);
