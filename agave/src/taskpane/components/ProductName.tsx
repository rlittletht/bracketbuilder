import * as CSS from "csstype";
import * as React from "react";

export interface ProductNameProps
{
    isFull?: boolean,
    isBold?: boolean
}

export interface ProductNameState
{
}

export class ProductName extends React.Component<ProductNameProps, ProductNameState>
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
        const weight = { fontWeight: this.props.isBold ? 800 : 400 };
        const full = this.props.isFull ? " BracketBuilder" : "";

        const red: CSS.Properties =
        {
            color: "red"
        };

        return (
            <span style={weight}>
                <b>&gt;traynrex <span style={red}>red</span>&lt;{full}</b>
            </span>)
    }
}