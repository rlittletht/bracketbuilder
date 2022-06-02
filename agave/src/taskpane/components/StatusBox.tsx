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
    constructor(props, context)
    {
        super(props, context);

        this.state =
        {
            message: ""
        }

        props.appContext.setLogMessageDelegate(this.addLogMessage.bind(this));
    }

    /*----------------------------------------------------------------------------
        %%Function: App.addLogMessage

        Add a log message to the UI
    ----------------------------------------------------------------------------*/
    addLogMessage(message: string)
    {
        this.setState({ message: message });
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