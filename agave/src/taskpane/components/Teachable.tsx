import * as React from "react";

import { IAppContext, TheAppContext } from "../../AppContext/AppContext";
import { ActionButton } from "./ActionButton";
import { SetupState, SetupBook } from "../../Setup";
import { RangeInfo } from "../../Interop/Ranges";
import { Stack, IStackStyles, IStackItemStyles, Coachmark, DirectionalHint, TeachingBubbleContent, IButtonProps } from '@fluentui/react';
import { Coachstate } from "../../Coachstate";

export class TeachableId
{
    static BracketBuilder = "b";
    static AddFirstGame = "a";
    static RemoveGame = "r";
    static Undo = "u";
    static StatusBox = "s";
    static FinishingTouches = "f";
    static Redo = "y";
    static Help = "h";
    static ErrorMessage = "e";
    static DirtyGame = "d";
    static AddGame = "A";

    static toString(): string
    {
        return `${this}`;
    }
}

export interface TeachableActiveDelegate
{
    (): boolean;
}

class TeachableViewDelay
{
    static Auto = 0;
    static Short = 500;
    static Medium = 1500;
    static Long = 3000;
    static LongIdle = 8000;
}

interface TeachableConfig
{
    coachStates: Coachstate[];
    firstViewDelay: TeachableViewDelay;
    viewDelay: TeachableViewDelay;
    sessionCountLimit: number;
    globalCountLimit: number;
}

export interface TeachableProps
{
    id: TeachableId;
    idx?: number;
    title: string;
    text: string;
    visibleDelay: number;
    children?: React.ReactNode;
    directionalHint: DirectionalHint;
    isWide: boolean;

    // isActiveEx is above and beyond the TeachbleID / Coachingstate
    // enabled function
    isActiveEx?: TeachableActiveDelegate;
}

export interface TeachableState
{
    visible: boolean;
}

export class Teachable extends React.Component<TeachableProps, TeachableState>
{
    context!: IAppContext;
    static contextType = TheAppContext;
    private targetDivRef: React.RefObject<HTMLDivElement> = null;

    constructor(props, context)
    {
        super(props, context);

        this.state =
        {
            visible: false
        }
        this.targetDivRef = React.createRef();
    }

    setVisibility(visible: boolean, teachableId: TeachableId)
    {
        if (teachableId == undefined || teachableId == this.props.id)
        {
            if (visible && teachableId !== undefined)
            {
                // when we set to true, we increment the number of times we have shown
                // this teachable

                this.context.Teaching.setTeachableSessionCount(teachableId, this.context.Teaching.getTeachableSessionCount(teachableId) + 1);
                this.context.Teaching.setTeachableGlobalCount(teachableId, this.context.Teaching.getTeachableGlobalCount(teachableId) + 1);
            }
            this.setState({ visible: visible });
        }
    }

    shouldCreateCoachmark(): boolean
    {
        if (this.context.Teaching.getHideThisTeachable(this.props.id)
            || this.context.Teaching.getHideAllTeachables())
        {
            return false;
        }

        const config = Teachable.getConfig(this.props.id);

        const sessionCount = this.context.Teaching.getTeachableSessionCount(this.props.id);
        const globalCount = this.context.Teaching.getTeachableGlobalCount(this.props.id);

        if (config.sessionCountLimit != 0 && sessionCount >= config.sessionCountLimit)
            return false;

        if (config.globalCountLimit != 0
            && (sessionCount >= config.sessionCountLimit
                || sessionCount >= config.globalCountLimit
                || globalCount >= config.globalCountLimit))
        {
            return false;
        }

        return Teachable.logit(`about to check state isActiveEx: id(${this.props.id} idx(${this.props.idx}): ${this.state.visible}`)
            && (this.props.isActiveEx?.() ?? true)
            && Teachable.logit(`about to check TeachableStateActive: id(${this.props.id} idx(${this.props.idx}): ${this.state.visible}`)
            && Teachable.IsTeachableStateActive(this.props.id, this.context.Teaching.Coachstate);
    }

    async componentDidMount()
    {

    }

    hideIt()
    {
        this.setVisibility(false, this.props.id);
    }

    static s_mapTeachableCoachstates = new Map<TeachableId, TeachableConfig>(
        [
            [
                TeachableId.BracketBuilder,
                { coachStates: [Coachstate.InitialState], firstViewDelay: TeachableViewDelay.Short, viewDelay: TeachableViewDelay.LongIdle, sessionCountLimit: 1, globalCountLimit: 3 }
            ],
            [
                TeachableId.AddFirstGame,
                { coachStates: [Coachstate.AddFirstGame], firstViewDelay: TeachableViewDelay.Short, viewDelay: TeachableViewDelay.LongIdle, sessionCountLimit: 1, globalCountLimit: 3 }
            ],
            [
                TeachableId.AddGame,
                { coachStates: [Coachstate.AfterFirstAdd], firstViewDelay: TeachableViewDelay.Short, viewDelay: TeachableViewDelay.LongIdle, sessionCountLimit: 1, globalCountLimit: 3 }
            ],
            [
                TeachableId.RemoveGame,
                { coachStates: [], firstViewDelay: TeachableViewDelay.Short, viewDelay: TeachableViewDelay.LongIdle, sessionCountLimit: 1, globalCountLimit: 3 }
            ],
            [
                TeachableId.Undo,
                { coachStates: [Coachstate.AfterInsertGameFailedOverlapping], firstViewDelay: TeachableViewDelay.Short, viewDelay: TeachableViewDelay.LongIdle, sessionCountLimit: 1, globalCountLimit: 3 }
            ],
            [
                TeachableId.StatusBox,
                { coachStates: [], firstViewDelay: TeachableViewDelay.Short, viewDelay: TeachableViewDelay.LongIdle, sessionCountLimit: 1, globalCountLimit: 3 }
            ],
            [
                TeachableId.FinishingTouches,
                { coachStates: [Coachstate.AllGamesPlaced], firstViewDelay: TeachableViewDelay.Short, viewDelay: TeachableViewDelay.LongIdle, sessionCountLimit: 1, globalCountLimit: 3 }
            ],
            [
                TeachableId.Redo,
                { coachStates: [], firstViewDelay: TeachableViewDelay.Short, viewDelay: TeachableViewDelay.LongIdle, sessionCountLimit: 1, globalCountLimit: 3 }
            ],
            [
                TeachableId.Help,
                { coachStates: [], firstViewDelay: TeachableViewDelay.Short, viewDelay: TeachableViewDelay.LongIdle, sessionCountLimit: 1, globalCountLimit: 3 }
            ],
            [
                TeachableId.ErrorMessage,
                { coachStates: [Coachstate.AfterInsertGameFailed], firstViewDelay: TeachableViewDelay.Short, viewDelay: TeachableViewDelay.LongIdle, sessionCountLimit: 1, globalCountLimit: 3 }
            ],
            [
                TeachableId.DirtyGame,
                { coachStates: [Coachstate.GameDirty], firstViewDelay: TeachableViewDelay.Short, viewDelay: TeachableViewDelay.LongIdle, sessionCountLimit: 1, globalCountLimit: 3 }
            ]
        ]);

    static getConfig(type: TeachableId): TeachableConfig
    {
        return this.s_mapTeachableCoachstates.get(type);
    }

    static IsTeachableStateActive(type: TeachableId, currentState: Coachstate): boolean
    {
        const teachableConfig = this.getConfig(type) ?? { coachStates: [] };

        for (let state of teachableConfig.coachStates)
            if (state == currentState)
                return true;
        
        return false;
    }

    static logit(s: string): boolean
    {
        console.log(s);
        return true;
    }

    render()
    {
        if (!this.context.Teaching.isCoachmarkRegistered())
        {
            if (this.shouldCreateCoachmark())
            {
                this.context.Teaching.registerCoachmark(this.setVisibility.bind(this));
                let delay: TeachableViewDelay = this.props.visibleDelay;

                if (delay == TeachableViewDelay.Auto)
                {
                    const config = Teachable.getConfig(this.props.id);

                    if (this.context.Teaching.getTeachableSessionCount(this.props.id) > 0)
                        delay = config.firstViewDelay;
                    else
                        delay = config.viewDelay;
                }
                if (delay > 0)
                    this.context.Teaching.startCoachmarkTimer(Number(delay), true, this.props.id);
            }
        }

        const positioningContainerProps = {
            directionalHint: this.props.directionalHint,
            doNotLayer: false,
        };
        const buttonProps: IButtonProps = {
            text: 'Got it!',
            onClick: () => this.setVisibility(false, this.props.id)
        };


        const { children } = this.props;

        return (
            <div>
                <div ref={this.targetDivRef}>
                    {children}
                </div>
                {(
                    Teachable.logit(`about to check state isActiveEx: id(${this.props.id} idx(${this.props.idx}): ${this.state.visible}`)
                    && (this.props.isActiveEx?.() ?? true)
                    && Teachable.logit(`about to check TeachableStateActive: id(${this.props.id} idx(${this.props.idx}): ${this.state.visible}`)
                    && Teachable.IsTeachableStateActive(this.props.id, this.context.Teaching.Coachstate)
                    && Teachable.logit(`about to check state visible id(${this.props.id} idx(${this.props.idx}): ${this.state.visible}`)
                    && this.state.visible)
                    && (<Coachmark
                    target={this.targetDivRef}
                    isPositionForced={true}
                            positioningContainerProps={positioningContainerProps}>
                            <TeachingBubbleContent
                        headline={this.props.title}
                        hasCloseButton
                        closeButtonAriaLabel="Close"
                                primaryButtonProps={buttonProps}
                        isWide={true}
                                onDismiss={() => this.setVisibility(false, this.props.id)}>
                                {this.props.text}
                            </TeachingBubbleContent>
                        </Coachmark>)}
            </div>);
    }
}