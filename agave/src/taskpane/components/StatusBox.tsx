import * as React from "react";
import * as CSS from "csstype";

import { IAppContext } from "../../AppContext";

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

        return (
            <div style={styles}>
                {this.state.message}
            </div>);
    }
}