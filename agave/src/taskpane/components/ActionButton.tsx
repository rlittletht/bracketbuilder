import * as React from "react";
import { IconButton } from "@fluentui/react";
import { IBracketGame } from "../../BracketEditor/BracketGame";
import { StructureEditor } from "../../BracketEditor/StructureEditor";
import { IAppContext } from "../../AppContext";
// import { useId } from 'react';

export interface ActionButtonProps
{
    bracketGame: IBracketGame;
    appContext: IAppContext;
    icon: string;
    tooltip: string;
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
        //const tooltipId = useId('tooltip');

        return (
//            <TooltipHost
                //content={this.props.tooltip}
                //callout
            <IconButton
                iconProps={{ iconName: this.props.icon }}
                onClick={() => this.props.delegate(this.props.appContext, this.state.bracketGame)}
            />
        );
    }
}