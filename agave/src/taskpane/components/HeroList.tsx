import * as React from "react";
import { IAppContext } from "../../AppContext";
import { Stack } from "@fluentui/react";
import ActionButton from "./ActionButton";
import { SetupState, SetupBook } from "../../Setup";
import { StructureEditor } from "../../BracketEditor/StructureEditor";
import { Adjuster_WantToGrowUpAtTopOfGrid } from "../../BracketEditor/GridAdjusters/Adjuster_WantToGrowUpAtTopOfGrid";
import { RegionSwapper_BottomGame } from "../../BracketEditor/GridAdjusters/RegionSwapper_BottomGame";
import { IBracketGame } from "../../BracketEditor/BracketGame";

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
    /*----------------------------------------------------------------------------
        %%Function: HeroList.buildHeroList

        Build the hero list of commands
    ----------------------------------------------------------------------------*/
    static buildHeroList(setupState: SetupState): [HeroListFormat, string, HeroListItem[]]
    {
        let listItems: HeroListItem[] = [];

        if (setupState == SetupState.Ready)
        {
            listItems.push(
                {
                    icon: "Undo",
                    primaryText: "Undo last operation",
                    cursor: "cursorPointer",
                    delegate: async (appContext: IAppContext): Promise<boolean> =>
                    {
                        await StructureEditor.undoClick(appContext);
                        return true;
                    }
                });
            listItems.push(
                {
                    icon: "Redo",
                    primaryText: "Redo last undone operation",
                    cursor: "cursorPointer",
                    delegate: async (appContext: IAppContext): Promise<boolean> =>
                    {
                        await StructureEditor.redoClick(appContext);
                        return true;
                    }
                });
            /*
                        listItems.push(
                            {
                                icon: "Sync",
                                primaryText: "Swap top/bottom teams",
                                cursor: "cursorPointer",
                                delegate: null
                            });
                        listItems.push(
                            {
                                icon: "Spacer",
                                primaryText: "Stretch or shrink game",
                                cursor: "cursorPointer",
                                delegate: null
                            });
                            */
            listItems.push(
                {
                    icon: "RemoveEvent",
                    primaryText: "Remove Game from bracket",
                    cursor: "cursorPointer",
                    delegate: async (appContext: IAppContext): Promise<boolean> =>
                    {
                        await StructureEditor.removeGameAtSelectionClick(appContext);
                        return true;
                    }
                });
            listItems.push(
                {
                    icon: "Repair",
                    primaryText: "Repair the current game",
                    cursor: "cursorPointer",
                    delegate: async (appContext: IAppContext): Promise<boolean> =>
                    {
                        await StructureEditor.repairGameAtSelectionClick(appContext);
                        return true;
                    }
                });
            return [HeroListFormat.HorizontalRibbon, "Build your bracket!", listItems];
        }

        if (setupState == SetupState.NoBracketChoice
            || setupState == SetupState.NoBracketStructure
            || setupState == SetupState.NoBracketData)
        {
            listItems.push(
                {
                    icon: "Ribbon",
                    primaryText: "Build a bracket",
                    cursor: "cursorPointer",
                    delegate: SetupBook.buildSpecificBracket,
                });
        }

        return [HeroListFormat.Vertical, "Setup your bracket workbook!", listItems];
    }

    buildVerticalList()
    {
        const { children, items, message } = this.props;
        const listItemsVertical = items.map(
            (item, index) => (
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
        let i: number = 0;

        const ribbonItems = items.map(
            (item, index) => (
                <Stack.Item grow align="center" key={index}>
                    <ActionButton
                        icon={item.icon}
                        tooltip={item.primaryText}
                        tooltipId={`rid-${i++}`}
                        appContext={this.props.appContext}
                        bracketGame={null} delegate={() => item.delegate(this.props.appContext)}/>
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