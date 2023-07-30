import * as React from "react";

import { IAppContext, TheAppContext } from "../../AppContext";
import { ActionButton } from "./ActionButton";
import { SetupState, SetupBook } from "../../Setup";
import { RangeInfo } from "../../Interop/Ranges";
import { Stack, IStackStyles, IStackItemStyles, Coachmark, DirectionalHint, TeachingBubbleContent, IButtonProps } from '@fluentui/react';

export interface CoachedControlProps
{
    title: string;
    text: string;
    visibleDelay: number;
    children: React.ReactNode;
    directionalHint: DirectionalHint;
    dormant: boolean;
    isWide: boolean;
}

export interface CoachedControlState
{
    visible: boolean;
}

export class Teachable extends React.Component<CoachedControlProps, CoachedControlState>
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

    async componentDidMount()
    {
        this.context.registerCoachmark(this.setVisibility.bind(this));
        if (this.props.visibleDelay > 0)
            this.context.startCoachmarkTimer(this.props.visibleDelay, true);
    }

    hideIt()
    {
        this.setVisibility(false);
    }

    render()
    {
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
                {this.state.visible && !this.props.dormant
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