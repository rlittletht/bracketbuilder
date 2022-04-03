import * as React from "react";
import { IconButton } from "@fluentui/react";

export interface InsertButtonProps
{
    gameNum: number;
    bracketName: string;
}

export interface InsertButtonState
{
}

export default class InsertButton extends React.Component<InsertButtonProps, InsertButtonState>
{
    constructor(props, context)
    {
        super(props, context);
    }

    render()
    {
        return (
            <IconButton iconProps={{ iconName: 'Add' }} />
        );
    }
}