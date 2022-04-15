import * as React from "react";
import { IAppContext } from "../../AppContext";
import { Stack } from "@fluentui/react";
import ActionButton from "./ActionButton";

export interface HeroListItem
{
    icon: string;
    primaryText: string;
    cursor: string;
    delegate: (appContext: IAppContext) => Promise<boolean>;
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
    appContext: IAppContext;
}

export default class HeroList extends React.Component<HeroListProps>
{
    buildVerticalList()
    {
        const { children, items, message } = this.props;
        const listItemsVertical = items.map((item, index) => (
            <Stack.Item grow className={item.cursor} align="center" key={index} onClick={() =>
                {
                    item.delegate(this.props.appContext)
                }}>
                <i className={`ms-Icon ms-Icon--${item.icon}`}></i>
                <span className="ms-font-m ms-fontColor-neutralPrimary">{item.primaryText}</span>
            </Stack.Item>
        ));

        return (
            <main className="ms-welcome__main">
                <h2 className="ms-font-xl ms-fontWeight-semilight ms-fontColor-neutralPrimary ms-u-slideUpIn20">{
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
        const ribbonItems = items.map((item, index) => (
            <Stack.Item grow align="center" key={index} >
                <ActionButton
                    icon={item.icon}
                    tooltip={item.primaryText}
                    appContext={this.props.appContext}
                    bracketGame={null} delegate={() => item.delegate(this.props.appContext)} />
            </Stack.Item>
        ));

        return (
            <main className="ms-welcome__main">
                <div>
                    <h2 className="ms-font-xl ms-fontWeight-semilight ms-fontColor-neutralPrimary ms-u-slideUpIn20">{
                        message}</h2>
                    <Stack horizontal tokens={{ childrenGap: 20 }}>
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