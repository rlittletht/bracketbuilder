import * as React from "react";
import * as CSS from "csstype";
import { Stack, IStackStyles, IStackItemStyles } from '@fluentui/react';

export interface LogoHeaderProps
{
}

export interface LogoHeaderState
{
}

export class LogoHeader extends React.Component<LogoHeaderProps, LogoHeaderState>
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
            textAlign: 'center'
        };

        const red: CSS.Properties =
        {
            color: "red"
        };

        const stackStyles: IStackStyles =
        {
            root:
            {
                width: "100%",
                background: "GhostWhite"
            }
        }

        const stackItemCenter: IStackItemStyles =
        {
            root:
            {
                textAlign: 'center'
            }
        }
        return (
            <div style={headerStyles}>
                <Stack horizontal styles={stackStyles}>
                    <Stack.Item>
                        <img src={require('./../../../assets/ModernTrainWithTRex.png')} height="36" />
                    </Stack.Item>
                    <Stack.Item grow styles={stackItemCenter} align="end">
                        <b>&gt;traynrex <span style={red}>red</span>&lt;</b>
                    </Stack.Item>
                    <Stack.Item>
                        <img src={require('./../../../assets/VintageTrainRTLWithTRex.png')} height="36"/>
                    </Stack.Item>
                </Stack>
            </div>)
    }
}