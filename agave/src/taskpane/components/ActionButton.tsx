import {IconButton, IContextualMenuProps, IContextualMenuItem } from "@fluentui/react";
import { TooltipHost } from "@fluentui/react/lib/Tooltip";
import * as React from "react";
import { IAppContext, TheAppContext } from "../../AppContext/AppContext";
import { IBracketGame } from "../../BracketEditor/BracketGame";
import { _TimerStack } from "../../PerfTimer";

export interface ActionButtonMenuItemProps
{
    icon: string;
    text: string;
    title: string,
    delegate: (appContext: IAppContext, game: IBracketGame) => Promise<boolean>;
}

export interface ActionButtonProps
{
    bracketGame: IBracketGame;
    icon: string;
    tooltip: string;
    tooltipId: string;
    disabled: boolean;
    delegate: (appContext: IAppContext, game: IBracketGame) => Promise<boolean>;
    menuItems?: ActionButtonMenuItemProps[];
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

    onButtonClick(menuIndex?: number)
    {
        if (menuIndex != null && this.props.menuItems && menuIndex < this.props.menuItems.length)
        {
            const menuItem = this.props.menuItems[menuIndex];
            menuItem.delegate(this.context, this.props.bracketGame);
            return;
        }

        // don't add things around the delegate without considering race conditions!
        this.props.delegate(this.context, this.props.bracketGame);
    }

    buildIconButton(buttonProps: ActionButtonProps)
    {
        if (buttonProps.menuItems && buttonProps.menuItems.length > 0)
        {
            const menuProps: IContextualMenuProps = { items: [] };

            for (let idx = 0; idx < buttonProps.menuItems.length; idx++)
            {
                const menuItem = buttonProps.menuItems[idx];
                const item: IContextualMenuItem =
                {
                    key: "" + idx,
                    text: menuItem.text,
                    title: menuItem.title,
                    iconProps: { iconName: menuItem.icon },
                    onClick: () => this.onButtonClick(idx)
                };

                menuProps.items.push(item);
            }

            return (
                <IconButton
                    iconProps={{ iconName: buttonProps.icon }}
                    size={100}
                    disabled={buttonProps.disabled}
                    menuProps={menuProps}/>
            );
        }

        return (
            <IconButton
                iconProps={{ iconName: buttonProps.icon }}
                size={100}
                disabled={buttonProps.disabled}
                onClick={() => this.onButtonClick()}/>
        );
    }

    render()
    {
        const iconButton = this.buildIconButton(this.props);

        return (
            <TooltipHost
                content={this.props.tooltip}
                id={this.props.tooltipId}>
                {iconButton}
            </TooltipHost>
        );
    }
}