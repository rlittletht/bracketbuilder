import * as React from "react";
import { IconButton } from "@fluentui/react";
import { IBracketGame } from "../../BracketEditor/BracketGame";
import { StructureEditor } from "../../BracketEditor/StructureEditor/StructureEditor";
import { IAppContext, TheAppContext } from "../../AppContext/AppContext";

export interface InsertButtonProps
{
    bracketGame: IBracketGame;
}

export interface InsertButtonState
{
    bracketGame: IBracketGame;
}

export class InsertButton extends React.Component<InsertButtonProps, InsertButtonState>
{
    context!: IAppContext;
    static contextType = TheAppContext;

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
                onClick={() => StructureEditor.insertGameAtSelectionClick(this.context, this.state.bracketGame)}
            />
        );
    }
}