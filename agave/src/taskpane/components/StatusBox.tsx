import * as React from "react";
import { IAppContext } from "../../AppContext";
import ActionButton from "./ActionButton";
import { SetupState, SetupBook } from "../../Setup";
import { StructureEditor } from "../../BracketEditor/StructureEditor";
import { Adjuster_WantToGrowUpAtTopOfGrid } from "../../BracketEditor/GridAdjusters/Adjuster_WantToGrowUpAtTopOfGrid";
import { RegionSwapper_BottomGame } from "../../BracketEditor/GridAdjusters/RegionSwapper_BottomGame";
import { IBracketGame } from "../../BracketEditor/BracketGame";
import { RangeInfo } from "../../Interop/Ranges";
import { Alignment, DefaultPalette, Slider, Stack, IStackStyles, IStackTokens, IStackItemStyles } from '@fluentui/react';
import * as CSS from "csstype";

export interface StatusBoxProps
{
    appContext: IAppContext;
}

export interface StatusBoxState
{
    message: string
}

export default class StatusBox extends React.Component<StatusBoxProps, StatusBoxState>
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