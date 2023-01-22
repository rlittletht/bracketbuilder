import * as React from "react";
import { IconButton } from "@fluentui/react";
import { IBracketGame } from "../../BracketEditor/BracketGame";
import { StructureEditor } from "../../BracketEditor/StructureEditor/StructureEditor";
import { IAppContext } from "../../AppContext";

export interface InsertButtonProps
{
    bracketGame: IBracketGame;
    appContext: IAppContext;
}

export interface InsertButtonState
{
    bracketGame: IBracketGame;
}

export class InsertButton extends React.Component<InsertButtonProps, InsertButtonState>
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
                iconProps={{ iconName: 'Add' }}
                onClick={() => StructureEditor.insertGameAtSelectionClick(this.props.appContext, this.state.bracketGame)}
            />
        );
    }
}