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
            //background: '#cccccc',
            textAlign: 'center'
        };

        const stackStyles: IStackStyles =
        {
            root:
            {
                width: "100%"
            }
        }

        const stackItemCenter: IStackStyles =
        {
            root:
            {
                textAlign: 'center'
            }
        }
        return (
            <div style={headerStyles}>
                <Stack horizontal>
                    <Stack.Item>
                        <img src={require('./../../../assets/ModernTrainLTR.png')} height="24" />
                    </Stack.Item>
                    <Stack.Item grow>
                        <b>&gt;trainwreck&lt;</b>
                    </Stack.Item>
                    <Stack.Item>
                        <img src={require('./../../../assets/VintageTrainRTL.png')} height="24"/>
                    </Stack.Item>
                </Stack>
            </div>)
    }
}