import { IconButton } from "@fluentui/react";
import { TooltipHost } from "@fluentui/react/lib/Tooltip";
import * as React from "react";
import { IAppContext, TheAppContext } from "../../AppContext/AppContext";
import { IBracketGame } from "../../BracketEditor/BracketGame";
import { _TimerStack } from "../../PerfTimer";

export interface ActionButtonProps
{
    bracketGame: IBracketGame;
    icon: string;
    tooltip: string;
    tooltipId: string;
    disabled: boolean;
    delegate: (appContext: IAppContext, game: IBracketGame) => Promise<boolean>;
}

export interface ActionButtonState
{
}

export class ActionButton extends React.Component<ActionButtonProps, ActionButtonState>
{
    context!: IAppContext;
    static contextType = TheAppContext;

    constructor(props, context)
    {
        super(props, context);
    }

    async onButtonClick()
    {
        // don't add things around the delegate without considering race conditions!
        await this.props.delegate(this.context, this.props.bracketGame);
    }

    render()
    {

        return (
            <TooltipHost
                content={this.props.tooltip}
                id={this.props.tooltipId}>
                <IconButton
                    iconProps={{ iconName: this.props.icon }}
                    size={100}
                    disabled={this.props.disabled}
                    onClick={this.onButtonClick.bind(this)}/>
            </TooltipHost>
        );
    }
}