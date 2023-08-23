
import { TeachableId } from "../taskpane/components/Teachable";
import { CoachTransition } from "../Coaching/CoachTransition";
import { Coachstate } from "../Coaching/Coachstate";
import { s_staticConfig } from "../StaticConfig";
import { CoachstateTransitions } from "../Coaching/CoachstateTransitions";
import { IDurableState } from "../DurableState";


export interface CoachmarkVisibilityDelegate
{
    (visible: boolean, teachableId: TeachableId): void;
}

export interface IAppContextTeaching
{
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

export class AppContextTeaching implements IAppContextTeaching
{
    m_teachableSessionCounts: Map<TeachableId, number> = new Map<TeachableId, number>();
    m_idurableState: IDurableState;

    constructor(iDurableState: IDurableState)
    {
        this.m_idurableState = iDurableState;
    }

    m_coachstate: Coachstate = Coachstate.Unknown;
    m_tempCoachstate: Coachstate[] = [];

    m_coachmarkVisibilitySet: CoachmarkVisibilityDelegate = null;
    m_coachmarkTimer: any = null;

    resetTeachableStates()
    {
        this.m_teachableSessionCounts.clear();
        this.m_idurableState.State.HideAllTeachables = false;
        this.m_idurableState.State.TeachableCounts.clear();
        this.m_idurableState.State.TeachableHides.clear();
        this.m_idurableState.save(s_staticConfig.topLevelStateName);
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
        return this.m_idurableState.State.TeachableCounts.get(teachId) ?? 0;
    }

    setTeachableGlobalCount(teachId: TeachableId, value: number)
    {
        this.m_idurableState.State.TeachableCounts.set(teachId, value);
        this.m_idurableState.save(s_staticConfig.topLevelStateName);
    }

    setHideAllTeachables(hide: boolean)
    {
        this.m_idurableState.State.HideAllTeachables = hide;
        this.m_idurableState.save(s_staticConfig.topLevelStateName);
    }

    getHideAllTeachables(): boolean
    {
        return this.m_idurableState.State.HideAllTeachables;
    }

    setHideThisTeachable(teachId: TeachableId, hide: boolean)
    {
        this.m_idurableState.State.TeachableHides.set(teachId, hide);
        this.m_idurableState.save(s_staticConfig.topLevelStateName);
    }

    getHideThisTeachable(teachId: TeachableId): boolean
    {
        return this.m_idurableState.State.TeachableHides.get(teachId) ?? false;
    }

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
}