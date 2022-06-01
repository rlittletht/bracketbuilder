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

export interface ToolbarItem
{
    icon: string;
    primaryText: string;
    cursor: string;
    delegate: (appContext: IAppContext) => Promise<boolean>;
    stateChecker: string;
}

export interface ToolbarProps
{
    message: string;
    alignment: Alignment;
    items: ToolbarItem[];
    appContext: IAppContext;
}

export interface ToolbarState
{
}

export default class Toolbar extends React.Component<ToolbarProps, ToolbarState>
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
        const { children, items, message } = this.props;
        let i: number = 0;

        const stackStyles: IStackItemStyles = {
            root: {
                alignItems: 'center',
                display: 'flex',
                justifyContent: 'center',
                overflow: 'hidden',
            },
        };

        const ribbonItems = items.map(
            (item, index) => (
                <Stack.Item align="center" key={index} styles={stackStyles} >
                    <ActionButton
                        icon={item.icon}
                        tooltip={item.primaryText}
                        tooltipId={`rid-${i++}`}
                        appContext={this.props.appContext}
                        disabled={item.stateChecker && item.stateChecker != null && this.state[item.stateChecker] && this.state[item.stateChecker] == null}
                        bracketGame={null} delegate={() => item.delegate(this.props.appContext)}/>
                </Stack.Item>
            ));

        return (
            <div>
                <Stack horizontal tokens={
                       {
                        childrenGap: 10,
                       }} horizontalAlign={this.props.alignment} className="toolbar">
                    {ribbonItems}
                </Stack>
                {children}
            </div>
        );
    }
}