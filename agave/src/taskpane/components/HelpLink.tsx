import * as React from "react";
import * as CSS from "csstype";

import { IAppContext, TheAppContext } from "../../AppContext/AppContext";
import { Teachable, TeachableId } from "./Teachable";
import { Link } from '@fluentui/react';
import { Coachstate } from "../../Coachstate";
import { s_staticConfig } from "../../StaticConfig";

export interface HelpLinkInfo
{
    nodes?: React.ReactNode;
    display?: string;
    
}
export interface HelpLinkProps
{
    children?: React.ReactNode;
    helpLink: string;
    text?: string;
}

export interface HelpLinkState
{
}

export class HelpLink extends React.Component<HelpLinkProps, HelpLinkState>
{
    context!: IAppContext;
    static contextType = TheAppContext;
    static getHelp = "Click for more information";

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

        const { children, text } = this.props;
        let content;

        if (children)
            content = children;
        else if (text)
            content = (
                <span>
                    {text}
                </span>);
        else
            content = (
                <span>
                    {HelpLink.getHelp}
                </span>
            );

        const full = HelpLink.buildHelpLink(this.props.helpLink);

        return (
            <Link href="{full}" target="_blank" underline>
                {content}
            </Link>
        );
    }
}