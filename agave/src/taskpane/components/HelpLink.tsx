import * as React from "react";
import * as CSS from "csstype";

import { IAppContext, TheAppContext } from "../../AppContext";
import { Teachable, TeachableId } from "./Teachable";
import { DirectionalHint, MessageBar, MessageBarType } from '@fluentui/react';
import { Coachstate } from "../../Coachstate";
import { s_staticConfig } from "../../StaticConfig";

export interface HelpLinkProps
{
    children?: React.ReactNode;
}

export interface HelpLinkState
{
}

export class HelpLink extends React.Component<HelpLinkProps, HelpLinkState>
{
    context!: IAppContext;
    static contextType = TheAppContext;

    constructor(props, context)
    {
        super(props, context);

        this.state =
        {
        }
    }

    static buildHelpLink(relative: string): string
    {
        return `${s_staticConfig.cdnRoot}/help/${relative}`;

    }

    render()
    {
        const styles: CSS.Properties =
        {
            textDecoration: "underline",
            color: "blue"
        };

        return (
            <span style={styles}>{this.props.children}
            </span>
        );
    }
}