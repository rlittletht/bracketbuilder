import * as React from "react";
import * as CSS from "csstype";

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

        return (
            <div style={headerStyles}>
                <img src={require('./../../../assets/ModernTrainLTR.png')} height="24"/><b>&gt;trainwreck&lt;</b>
                <img src={require('./../../../assets/VintageTrainRTL.png')} height="24"/>
            </div>)
    }
}