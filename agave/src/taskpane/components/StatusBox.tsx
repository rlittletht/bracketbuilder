import * as React from "react";
import * as CSS from "csstype";

import { IAppContext, TheAppContext } from "../../AppContext";
import { Teachable, TeachableId } from "./Teachable";
import { DirectionalHint } from '@fluentui/react';
import { Coachstate } from "../../Coachstate";

export interface StatusBoxProps
{
    appContext: IAppContext;
}

export interface StatusBoxState
{
    message: string
}

export class StatusBox extends React.Component<StatusBoxProps, StatusBoxState>
{
    context!: IAppContext;
    static contextType = TheAppContext;

    clearCount: number = 0;
    m_pendingTimer: any;

    delayClearMessage()
    {
        this.setState({ message: "" });
        this.m_pendingTimer = null;
    }


    constructor(props, context)
    {
        super(props, context);

        this.state =
        {
            message: ""
        }

        props.appContext.setLogMessageDelegate(this.addLogMessage.bind(this), this.delayClearMessage.bind(this));
    }

    /*----------------------------------------------------------------------------
        %%Function: App.addLogMessage

        Add a log message to the UI

    ----------------------------------------------------------------------------*/
    addLogMessage(message: string, msecVisible: number = 0)
    {
        this.setState({ message: message });
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

        if (this.context.Coachstate == Coachstate.AfterInsertGameFailed)
        {
            title = "Insert failed";
            text = "The details will often suggest what you need to do to fix it. Try clicking in another column and add the game again";
        }

        return (
            <Teachable
                id={TeachableId.ErrorMessage}
                title={title}
                text={text}
                visibleDelay={500}
                directionalHint={DirectionalHint.bottomRightEdge}
                isWide={true}>
            <div style={styles}>
                {this.state.message}
                </div>
            </Teachable>
        );
    }
}