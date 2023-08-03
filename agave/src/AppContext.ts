import * as React from "react";
import { IBracketGame } from "./BracketEditor/BracketGame";
import { PerfTimer } from "./PerfTimer";
import { JsCtx } from "./Interop/JsCtx";
import { Coachstate } from "./Coachstate";
import { CoachTransition } from "./CoachTransition";
import { CoachstateTransitions } from "./CoachstateTransitions";
import { MessageBarType } from '@fluentui/react';
import { TeachableId } from "./taskpane/components/Teachable";
import { DurableState } from "./DurableState";
import { s_staticConfig } from "./StaticConfig";

export interface IAppContext
{
    log(message: string);
    logTimeout(message: string, msecVisible: number);
    logError(message: string, msecVisible: number);
    get Timer(): PerfTimer;
    /*async*/ invalidateHeroList(context: JsCtx);
    getSelectedBracket();
    getGames(): IBracketGame[];
    setProgressVisible(visible: boolean);
    clearCoachmarkTimer();
    startCoachmarkTimer(msecDelay: number, visible: boolean, teachableId: TeachableId);
    registerCoachmark(set: CoachmarkVisibilityDelegate);
    isCoachmarkRegistered(): boolean;
    clearCoachmark(teachableId?: string);
    transitionState(transition: CoachTransition);
    get Coachstate(): Coachstate;
    set Coachstate(state: Coachstate);
    pushTempCoachstate(coachstate: Coachstate);
    popTempCoachstateIfNecessary();
    resetTeachableStates();
    getTeachableSessionCount(teachId: TeachableId): number;
    setTeachableSessionCount(teachId: TeachableId, value: number);
    getTeachableGlobalCount(teachId: TeachableId): number;
    setTeachableGlobalCount(teachId: TeachableId, value: number);
    setHideAllTeachables(hide: boolean);
    getHideAllTeachables(): boolean;
    setHideThisTeachable(teachableId: TeachableId, hide: boolean);
    getHideThisTeachable(teachableId: TeachableId): boolean;
}

export interface CoachmarkVisibilityDelegate
{
    (visible: boolean, teachableId: TeachableId): void;
}

export interface AddLogMessageDelegate
{
    (message: string, messageType: MessageBarType, msecVisible: number): void;
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
    m_durableState: DurableState = new DurableState();
    m_teachableSessionCounts: Map<TeachableId, number> = new Map<TeachableId, number>();

    m_coachstate: Coachstate = Coachstate.Unknown;
    m_tempCoachstate: Coachstate[] = [];

    m_coachmarkVisibilitySet: CoachmarkVisibilityDelegate = null;
    m_coachmarkTimer: any = null;
    m_addLogMessageDelegate: AddLogMessageDelegate;
    m_progressVisibilityDelegate: ProgressVisibilityDelegate;
    m_invalidateHeroListDelegate: InvalidateHeroListDelegate;
    m_getSelectedBracket: GetSelectedBracketDelegate;
    m_getGames: GetGamesDelegate;
    m_perfTimer: PerfTimer = new PerfTimer();

    constructor()
    {
        this.m_durableState.load(s_staticConfig.topLevelStateName);
    }

    resetTeachableStates()
    {
        this.m_teachableSessionCounts.clear();
        this.m_durableState.m_data.HideAllTeachables = false;
        this.m_durableState.m_data.TeachableCounts.clear();
        this.m_durableState.m_data.TeachableHides.clear();
        this.m_durableState.save(s_staticConfig.topLevelStateName);
    }

    transitionState(transition: CoachTransition)
    {
        this.m_coachstate = CoachstateTransitions.GetNextState(this.m_coachstate, transition);
    }

    pushTempCoachstate(coachstate: Coachstate)
    {
        this.m_tempCoachstate.push(coachstate);
    }

    popTempCoachstateIfNecessary()
    {
        if (this.m_tempCoachstate.length > 0)
            this.m_tempCoachstate.pop();
    }

    getTeachableSessionCount(teachId: TeachableId): number
    {
        return this.m_teachableSessionCounts.get(teachId) ?? 0;
    }

    setTeachableSessionCount(teachId: TeachableId, value: number)
    {
        this.m_teachableSessionCounts.set(teachId, value);
    }

    getTeachableGlobalCount(teachId: TeachableId): number
    {
        return this.m_durableState.State.TeachableCounts.get(teachId) ?? 0;
    }

    setTeachableGlobalCount(teachId: TeachableId, value: number)
    {
        this.m_durableState.State.TeachableCounts.set(teachId, value);
        this.m_durableState.save(s_staticConfig.topLevelStateName);
    }

    setHideAllTeachables(hide: boolean)
    {
        this.m_durableState.State.HideAllTeachables = hide;
        this.m_durableState.save(s_staticConfig.topLevelStateName);
    }

    getHideAllTeachables(): boolean
    {
        return this.m_durableState.State.HideAllTeachables;
    }

    setHideThisTeachable(teachId: TeachableId, hide: boolean)
    {
        this.m_durableState.State.TeachableHides.set(teachId, hide);
        this.m_durableState.save(s_staticConfig.topLevelStateName);
    }

    getHideThisTeachable(teachId: TeachableId): boolean
    {
        return this.m_durableState.State.TeachableHides.get(teachId) ?? false;
    }


    get Timer(): PerfTimer { return this.m_perfTimer; }

    get Coachstate(): Coachstate
    {
        if (this.m_tempCoachstate.length > 0)
            return this.m_tempCoachstate[this.m_tempCoachstate.length - 1];

        return this.m_coachstate;
    }

    set Coachstate(state: Coachstate)
    {
        this.m_coachstate = state;
    }

    registerCoachmark(fun: CoachmarkVisibilityDelegate)
    {
        this.m_coachmarkVisibilitySet = fun;
    }

    isCoachmarkRegistered(): boolean
    {
        return this.m_coachmarkVisibilitySet != null;
    }

    clearCoachmark(teachableId?: string)
    {
        if (this.m_coachmarkVisibilitySet)
            this.m_coachmarkVisibilitySet(false, teachableId);

        this.m_coachmarkVisibilitySet = null;
        this.clearCoachmarkTimer();
    }

    clearCoachmarkTimer()
    {
        if (this.m_coachmarkTimer != null)
            clearTimeout(this.m_coachmarkTimer);

        this.m_coachmarkTimer = null;
    }

    startCoachmarkTimer(msecDelay: number, visible: boolean, teachableId: TeachableId)
    {
        if (this.m_coachmarkTimer != null)
            this.clearCoachmarkTimer();

        if (this.m_coachmarkVisibilitySet != null)
            this.m_coachmarkTimer = setTimeout(() => this.m_coachmarkVisibilitySet(visible, teachableId), msecDelay);
    }

    setProgressVisible(visible: boolean)
    {
        if (this.m_progressVisibilityDelegate != null)
            this.m_progressVisibilityDelegate(visible);
    }

    log(message: string, msecVisible: number = 0)
    {
        if (this.m_addLogMessageDelegate != null)
            this.m_addLogMessageDelegate(message, MessageBarType.info, msecVisible);
    }

    logTimeout(message: string, msecVisible: number)
    {
        if (this.m_addLogMessageDelegate != null)
            this.m_addLogMessageDelegate(message, MessageBarType.info, msecVisible);
    }

    logError(message: string, msecVisible: number = 0)
    {
        if (this.m_addLogMessageDelegate != null)
            this.m_addLogMessageDelegate(message, MessageBarType.error, msecVisible);
    }

    async invalidateHeroList(context: JsCtx)
    {
        if (this.m_invalidateHeroListDelegate)
            await this.m_invalidateHeroListDelegate(context);
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
        addMessageDelegate: AddLogMessageDelegate,
        invalidateHeroList: InvalidateHeroListDelegate,
        getSelectedBracket: GetSelectedBracketDelegate,
        getGames: GetGamesDelegate
        )
    {
        this.m_addLogMessageDelegate = addMessageDelegate;
        this.m_invalidateHeroListDelegate = invalidateHeroList;
        this.m_getSelectedBracket = getSelectedBracket;
        this.m_getGames = getGames;
    }

    setLogMessageDelegate(addMessageDelegate: AddLogMessageDelegate)
    {
        this.m_addLogMessageDelegate = addMessageDelegate;
    }

    setProgressVisibilityDelegate(progressVisibilityDelegate: ProgressVisibilityDelegate)
    {
        this.m_progressVisibilityDelegate = progressVisibilityDelegate;
    }

    static checkpoint(log: string)
    {
        log;
//        console.log(log);
    }
}

export const TheAppContext = React.createContext(null);
