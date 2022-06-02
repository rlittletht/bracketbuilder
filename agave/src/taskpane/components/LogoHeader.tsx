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

export interface LogoHeaderProps
{
}

export interface LogoHeaderState
{
}

export default class LogoHeader extends React.Component<LogoHeaderProps, LogoHeaderState>
{
    constructor(props, context)
    {
        super(props, context);

        this.state =
        {
        }
    }

    render()
    {
        const headerStyles: CSS.Properties =
        {
            //background: '#cccccc',
            textAlign: 'center'
        };

        return (
            <div style={headerStyles}>
                <img src={require('./../../../assets/ModernTrainLTR.png')} height="24"/><b>&gt;trainwreck&lt;</b>
                <img src={require('./../../../assets/VintageTrainRTL.png')} height="24"/>
            </div>)
    }
}