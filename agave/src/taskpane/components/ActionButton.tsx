import * as React from "react";
import { IconButton } from "@fluentui/react";
import { IBracketGame } from "../../BracketEditor/BracketGame";
import { StructureEditor } from "../../BracketEditor/StructureEditor";
import { IAppContext } from "../../AppContext";

export interface ActionButtonProps
{
    bracketGame: IBracketGame;
    appContext: IAppContext;
    icon: string;
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
            <IconButton
                iconProps={{ iconName: this.props.icon }}
                onClick={() => this.props.delegate(this.props.appContext, this.state.bracketGame)}
            />
        );
    }
}