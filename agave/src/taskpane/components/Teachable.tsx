import * as React from "react";

import { IAppContext, TheAppContext } from "../../AppContext";
import { ActionButton } from "./ActionButton";
import { SetupState, SetupBook } from "../../Setup";
import { RangeInfo } from "../../Interop/Ranges";
import { Stack, IStackStyles, IStackItemStyles, Coachmark, DirectionalHint, TeachingBubbleContent, IButtonProps } from '@fluentui/react';
import { Coachstate } from "../../Coachstate";

export class TeachableId
{
    static BracketBuilder = "b";
    static AddGame = "a";
    static RemoveGame = "r";
    static Undo = "u";
    static StatusBox = "s";
    static FinishingTouches = "f";
    static Redo = "y";
    static Help = "h";
    static ErrorMessage = "e";
    static DirtyGame = "d";
}

export interface TeachableActiveDelegate
{
    (): boolean;
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

    setVisibility(visible: boolean)
    {
        this.setState({ visible: visible });
    }

    shouldCreateCoachmark(): boolean
    {
        return Teachable.logit(`about to check state isActiveEx: id(${this.props.id} idx(${this.props.idx}): ${this.state.visible}`)
            && (this.props.isActiveEx?.() ?? true)
            && Teachable.logit(`about to check TeachableStateActive: id(${this.props.id} idx(${this.props.idx}): ${this.state.visible}`)
            && Teachable.IsTeachableStateActive(this.props.id, this.context.Coachstate);
    }

    async componentDidMount()
    {

    }

    hideIt()
    {
        this.setVisibility(false);
    }

    static s_mapTeachableCoachstates = new Map<TeachableId, Coachstate[]>(
        [
            [TeachableId.BracketBuilder, [Coachstate.InitialState]],
            [TeachableId.AddGame, [Coachstate.AddFirstGame, Coachstate.AfterFirstAdd]],
            [TeachableId.RemoveGame, []],
            [TeachableId.Undo, [Coachstate.AfterInsertGameFailedOverlapping]],
            [TeachableId.StatusBox, []],
            [TeachableId.FinishingTouches, [Coachstate.AllGamesPlaced]],
            [TeachableId.Redo, []],
            [TeachableId.Help, []],
            [TeachableId.ErrorMessage, [[Coachstate.AfterInsertGameFailed]]],
            [TeachableId.DirtyGame, [[Coachstate.GameDirty]]]
        ]);
        
    static IsTeachableStateActive(type: TeachableId, currentState: Coachstate): boolean
    {
        const validStates = this.s_mapTeachableCoachstates.get(type) ?? [];

        for (let state of validStates)
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
        if (!this.context.isCoachmarkRegistered())
        {
            if (this.shouldCreateCoachmark())
            {
                this.context.registerCoachmark(this.setVisibility.bind(this));
                if (this.props.visibleDelay > 0)
                    this.context.startCoachmarkTimer(this.props.visibleDelay, true);
            }
        }

        const positioningContainerProps = {
            directionalHint: this.props.directionalHint,
            doNotLayer: false,
        };
        const buttonProps: IButtonProps = {
            text: 'Got it!',
            onClick: () => this.setVisibility(false)
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
                    && Teachable.IsTeachableStateActive(this.props.id, this.context.Coachstate)
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
                                onDismiss={() => this.setVisibility(false)}>
                                {this.props.text}
                            </TeachingBubbleContent>
                        </Coachmark>)}
            </div>);
    }
}