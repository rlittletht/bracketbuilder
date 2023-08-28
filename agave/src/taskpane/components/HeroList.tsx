import * as React from "react";
import * as CSS from "csstype";

import { Stack } from '@fluentui/react';
import { IAppContext, TheAppContext } from "../../AppContext/AppContext";
import { RangeInfo } from "../../Interop/Ranges";
import { SetupBook, SetupState } from "../../Setup";
import { ActionButton } from "./ActionButton";
import { BracketOption } from "../../Brackets/BracketDefBuilder";

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

export interface SetBracketOptionsDelegate
{
    (options: BracketOption[]): void;
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
    static buildHeroList(setupState: SetupState, setBracketOptionsDelegate: SetBracketOptionsDelegate, includeCustomBracketLoadOption: boolean): [HeroListFormat, string, HeroListItem[]]
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
            if (includeCustomBracketLoadOption)
            {
                listItems.push(
                    {
                        icon: "BulkUpload",
                        primaryText: "Load custom brackets",
                        cursor: "cursorPointer",
                        stateChecker: null,
                        delegate: async (appContext: IAppContext) =>
                        {
                            const brackets = await SetupBook.loadCustomBrackets(appContext);
                            const bracketOptions: BracketOption[] = [];

                            for (let _bracket of brackets)
                            {
                                bracketOptions.push(
                                    {
                                        key: _bracket.tableName.substr(0, _bracket.tableName.length - 7),
                                        name: `${_bracket.name}*`
                                    });
                            }
                            setBracketOptionsDelegate(bracketOptions);
                            return false;
                        },
                    });
            }
        }

        return [HeroListFormat.Vertical, "Let's get started!", listItems];
    }

    buildVerticalList()
    {
        const { children, items, message } = this.props;
        const heroStyle: CSS.Properties =
        {
            fontWeight: 600,
            color: "blue"
        };

        const listItemsVertical = items.map(
            (item, index) => (
                <Stack.Item grow className="{item.cursor} heroItem" align="center" key={index} onClick={() =>
                {
                    item.delegate(this.context)
                }}>
                    <i className={`ms-Icon ms-Icon--${item.icon} ${item.cursor}`} style={heroStyle}></i>
                    <span className={`ms-font-xl ms-fontWeight-semibold ms-fontColor-neutralPrimary ${item.cursor}`} style={heroStyle}>
                        {item.primaryText}
                    </span>
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