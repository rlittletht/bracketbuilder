import * as React from "react";
import * as CSS from "csstype";

import { IAppContext, TheAppContext } from "../../AppContext/AppContext";
import { Teachable, TeachableId } from "./Teachable";
import { DirectionalHint, MessageBar, MessageBarType } from '@fluentui/react';
import { Coachstate } from "../../Coachstate";
import { HelpLink } from "./HelpLink";
import { IHelpInfo, HelpInfo } from "../../HelpInfo";

export interface StatusBoxProps
{
}

export interface StatusBoxState
{
    message?: string[],
    helpInfo?: IHelpInfo;
    messageType: MessageBarType
}

export class StatusBox extends React.Component<StatusBoxProps, StatusBoxState>
{
    context!: IAppContext;
    static contextType = TheAppContext;

    clearCount: number = 0;
    m_pendingTimer: any;

    delayClearMessage()
    {
        this.clearMessage();
    }

    static linesFromError(error): string[]
    {
        if (error.stack)
            return [
                "Something has gone very wrong.",
                "Its not your fault, its mine.",
                "It would be great if you would report this problem to me via email at red@traynrex.com.",
                "Copy and paste all of the details below.",
                "THANK YOU!",
                "Details:",
                `Exception caught: ${error.message}`,
                ...error.stack.split("\n")];
        else
            return [
                "Something has gone very wrong.",
                "Its not your fault, its mine.",
                "It would be great if you would report this problem to me via email at red@traynrex.com.",
                "Copy and paste all of the details below.",
                "THANK YOU!",
                "Details:",
                `Exception caught: ${error.message}`,
                "BAD DEVELOPER, no stack trace!"];
    }

    constructor(props, context)
    {
        super(props, context);

        this.state =
        {
            message: null,
            messageType: MessageBarType.info
        }

        this.context.Messages.setMessageDelegates(this.setMessage.bind(this), this.clearMessage.bind(this));
    }

    clearMessage()
    {
        this.setState({ message: null, helpInfo: null, messageType: MessageBarType.info });
        this.context.Teaching.clearCoachmark(TeachableId.ErrorMessage);

        if (this.m_pendingTimer != null)
        {
            clearTimeout(this.m_pendingTimer);
            this.m_pendingTimer = null;
        }
    }

    /*----------------------------------------------------------------------------
        %%Function: App.addLogMessage

        Add a log message to the UI

    ----------------------------------------------------------------------------*/
    setMessage(message: string[], messageType: MessageBarType, helpInfo?: IHelpInfo, msecVisible?: number)
    {
        this.setState({ message: message, helpInfo: helpInfo, messageType: messageType });
        this.context.Teaching.clearCoachmark(TeachableId.ErrorMessage);

        if (this.m_pendingTimer != null)
        {
            clearTimeout(this.m_pendingTimer);
            this.m_pendingTimer = null;
        }

        if (msecVisible && msecVisible != 0)
        {
            this.m_pendingTimer = setTimeout(() => this.delayClearMessage(), msecVisible);
        }
    }

    render()
    {
        const styles: CSS.Properties =
        {
            background: '#cccccc',
            textAlign: 'left'
        };

        let title = "Status messages";
        let text = "This is where additional information will show up in response to things you do";
        const lines = this.state.message?.map((line, idx) => (<div key={idx}>{line}</div>));

        if (this.context.Teaching.Coachstate == Coachstate.AfterInsertGameFailed)
        {
            title = "Insert failed";
            text = "The details will often suggest what you need to do to fix it. Try clicking in another column and add the game again";
        }

        const helpLink =
            this.state.helpInfo
                ? HelpLink.buildHelpLink(HelpInfo.BuildHelpLink(this.state.helpInfo.topic))
                : null;

        const help =
            helpLink
                ? (
                    <HelpLink helpLink={helpLink} text={this.state.helpInfo.text}>
                        {this.state.helpInfo.node}
                    </HelpLink>)
                : ( <span/>);

        const messageBar = this.state.message
            ? (
                <MessageBar
                    messageBarType={this.state.messageType}
                    isMultiline={true}
                    onDismiss={()=>this.clearMessage() } >
                    <div>
                        {lines}
                        {help}
                    </div>
                </MessageBar>
            )
            : (<span />);

        return (
            <Teachable
                id={TeachableId.ErrorMessage}
                title={title}
                text={text}
                visibleDelay={500}
                directionalHint={DirectionalHint.bottomRightEdge}
                isWide={true}>
                {messageBar}
            </Teachable>
        );
    }
}