import * as React from "react";
import { IAppContext } from "../../AppContext";
import { ActionButton } from "./ActionButton";
import { Stack, Alignment, IStackItemStyles } from '@fluentui/react';
import { Teachable, TeachableProps } from "./Teachable";

export interface ToolbarItem
{
    icon: string;
    primaryText: string;
    cursor: string;
    delegate: (appContext: IAppContext) => Promise<boolean>;
    stateChecker: string;
    teachableProps?: TeachableProps
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

export class Toolbar extends React.Component<ToolbarProps, ToolbarState>
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

        const stackItemStyles: IStackItemStyles = {
            root: {
                alignItems: 'center',
                display: 'flex',
                justifyContent: 'center',
                overflow: 'hidden',
            },
        };

        const ribbonItems = [];

        for (let index = 0; index < items.length; index++)
        {
            const item = items[index];
            if (item.teachableProps)
            {
                ribbonItems.push(
                    (
                        <Stack.Item align="center" key={index} styles={stackItemStyles} >
                            <Teachable
                                id={item.teachableProps.id}
                                title={item.teachableProps.title}
                                text={item.teachableProps.text}
                                visibleDelay={item.teachableProps.visibleDelay}
                                directionalHint={item.teachableProps.directionalHint}
                                isWide={item.teachableProps.isWide}>
                                <ActionButton
                                    icon={item.icon}
                                    tooltip={item.primaryText}
                                    tooltipId={`rid-${i++}`}
                                    appContext={this.props.appContext}
                                    disabled={item.stateChecker && item.stateChecker != null && this.state[item.stateChecker] && this.state[item.stateChecker] == null}
                                    bracketGame={null} delegate={() => item.delegate(this.props.appContext)} />
                            </Teachable>
                        </Stack.Item>
                    ));
            }
            else
            {
                ribbonItems.push(
                    (
                        <Stack.Item align="center" key={index} styles={stackItemStyles} >
                            <ActionButton
                                icon={item.icon}
                                tooltip={item.primaryText}
                                tooltipId={`rid-${i++}`}
                                appContext={this.props.appContext}
                                disabled={item.stateChecker && item.stateChecker != null && this.state[item.stateChecker] && this.state[item.stateChecker] == null}
                                bracketGame={null} delegate={() => item.delegate(this.props.appContext)} />
                        </Stack.Item>
                    ));
            }
        }

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