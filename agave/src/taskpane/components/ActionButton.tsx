import * as React from "react";
import { IconButton } from "@fluentui/react";
import { IBracketGame } from "../../BracketEditor/BracketGame";
import { StructureEditor } from "../../BracketEditor/StructureEditor";
import { IAppContext } from "../../AppContext";
import { useId } from "@fluentui/react-hooks";
import { TooltipHost, ITooltipHostStyles } from "@fluentui/react/lib/Tooltip";

export interface ActionButtonProps
{
    bracketGame: IBracketGame;
    appContext: IAppContext;
    icon: string;
    tooltip: string;
    tooltipId: string;
    delegate: (appContext: IAppContext, game: IBracketGame) => Promise<boolean>;
}

export interface ActionButtonState
{
    bracketGame: IBracketGame;
}

export default class ActionButton extends React.Component<ActionButtonProps, ActionButtonState>
{
    constructor(props, context)
    {
        super(props, context);

        this.state =
        {
            bracketGame: props.bracketGame,
        }
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
                    onClick={async () => await this.props.delegate(this.props.appContext, this.state.bracketGame)}/>
            </TooltipHost>
        );
    }
}