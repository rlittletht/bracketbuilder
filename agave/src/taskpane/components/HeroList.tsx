import * as React from "react";

import { IAppContext, TheAppContext } from "../../AppContext/AppContext";
import { ActionButton } from "./ActionButton";
import { SetupState, SetupBook } from "../../Setup";
import { RangeInfo } from "../../Interop/Ranges";
import { Stack, IStackStyles, IStackItemStyles } from '@fluentui/react';
import { TeachableProps } from "./Teachable";

export interface HeroListItem
{
    icon: string;
    primaryText: string;
    cursor: string;
    delegate: (appContext: IAppContext) => Promise<boolean>;
    stateChecker: string;
}

export declare const enum HeroListFormat
{
    Vertical,
    HorizontalRibbon
}

export interface HeroListProps
{
    message: string;
    items: HeroListItem[];
    heroListFormat: HeroListFormat;
}

export interface HeroListState
{
    rangeForMove: RangeInfo
}
export class HeroList extends React.Component<HeroListProps, HeroListState>
{
    context!: IAppContext;
    static contextType = TheAppContext;

    constructor(props, context)
    {
        super(props, context);

        this.state =
        {
            rangeForMove: null
        }
    }

    /*----------------------------------------------------------------------------
        %%Function: HeroList.buildHeroList

        Build the hero list of commands
    ----------------------------------------------------------------------------*/
    static buildHeroList(setupState: SetupState): [HeroListFormat, string, HeroListItem[]]
    {
        let listItems: HeroListItem[] = [];

        if (setupState == SetupState.Ready)
        {
            // there's nothing in the hero list when we're ready.... the app
            // get's its toolbar and client area.
            return [HeroListFormat.HorizontalRibbon, "Let's place the games", listItems];
        }

        if (setupState == SetupState.NoBracketChoice
            || setupState == SetupState.NoBracketStructure
            || setupState == SetupState.NoBracketData)
        {
            listItems.push(
                {
                    icon: "BuildQueueNew",
                    primaryText: "Build this bracket!",
                    cursor: "cursorPointer",
                    stateChecker: null,
                    delegate: SetupBook.buildSpecificBracket,
                });
        }

        return [HeroListFormat.Vertical, "Let's get started!", listItems];
    }

    buildVerticalList()
    {
        const { children, items, message } = this.props;
        const listItemsVertical = items.map(
            (item, index) => (
                <Stack.Item grow className="{item.cursor} heroItem" align="center" key={index} onClick={() =>
                {
                    item.delegate(this.context)
                }}>
                    <i className={`ms-Icon ms-Icon--${item.icon} ${item.cursor}`}></i>
                    <span className={`ms-font-xl ms-fontWeight-semibold ms-fontColor-neutralPrimary ${item.cursor}`}>{item.primaryText}</span>
                </Stack.Item>
            ));

        return (
            <main className="ms-welcome__main">
                <h2 className="ms-font-xxl ms-fontWeight-semilight ms-fontColor-neutralPrimary ms-u-slideUpIn20">{
                    message}</h2>
                <Stack tokens={{ childrenGap: 20 }}>
                    {listItemsVertical}
                    {children}
                </Stack>
            </main>
        );
    }

    buildRibbonList()
    {
        const { children, items, message } = this.props;
        let i: number = 0;

        const ribbonItems = items.map(
            (item, index) => (
                <Stack.Item grow align="center" key={index}>
                    <ActionButton
                        icon={item.icon}
                        tooltip={item.primaryText}
                        tooltipId={`rid-${i++}`}
                        disabled={item.stateChecker && item.stateChecker != null && this.state[item.stateChecker] && this.state[item.stateChecker] == null}
                        bracketGame={null} delegate={() => item.delegate(this.context)}/>
                </Stack.Item>
            ));

        return (
            <main className="ms-welcome__main">
                <div>
                    <h2 className="ms-font-xl ms-fontWeight-semilight ms-fontColor-neutralPrimary ms-u-slideUpIn20">{
                        message}</h2>
                    <Stack horizontal tokens={{ childrenGap: 10 }}>
                        {ribbonItems}
                    </Stack>
                    {children}
                </div>
            </main>
        );
    }

    render()
    {
        if (this.props.heroListFormat == HeroListFormat.Vertical)
            return this.buildVerticalList();
        else
            return this.buildRibbonList();
    }
}