import * as React from "react";
import { IAppContext } from "../../AppContext";
import { Stack } from "@fluentui/react";
import ActionButton from "./ActionButton";
import { SetupState, SetupBook } from "../../Setup";
import { StructureEditor } from "../../BracketEditor/StructureEditor";
import { Adjuster_WantToGrowUpAtTopOfGrid } from "../../BracketEditor/GridAdjusters/Adjuster_WantToGrowUpAtTopOfGrid";
import { RegionSwapper_BottomGame } from "../../BracketEditor/GridAdjusters/RegionSwapper_BottomGame";
import { IBracketGame } from "../../BracketEditor/BracketGame";
import { RangeInfo } from "../../Interop/Ranges";

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
    appContext: IAppContext;
}

export interface HeroListState
{
    rangeForMove: RangeInfo
}
export default class HeroList extends React.Component<HeroListProps, HeroListState>
{
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
            listItems.push(
                {
                    icon: "Undo",
                    primaryText: "Undo last operation",
                    cursor: "cursorPointer",
                    stateChecker: null,
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
                    stateChecker: null,
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
                            */
            listItems.push(
                {
                    icon: "Upload",
                    primaryText: "Pick up game for move",
                    cursor: "cursorPointer",
                    stateChecker: null,
                    delegate: async (appContext: IAppContext): Promise<boolean> =>
                    {
                        await StructureEditor.captureSelectionForMove(appContext);
                        return true;
                    }
                });
            listItems.push(
                {
                    icon: "Download",
                    primaryText: "Drop game for move",
                    cursor: "cursorPointer",
                    stateChecker: "rangeForMove",
                    delegate: async (appContext: IAppContext): Promise<boolean> =>
                    {
                        await StructureEditor.moveGameAtSelectionClick(appContext);
                        return true;
                    }
                });
            listItems.push(
                {
                    icon: "RemoveEvent",
                    primaryText: "Remove Game from bracket",
                    cursor: "cursorPointer",
                    stateChecker: null,
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
                    stateChecker: null,
                    delegate: async (appContext: IAppContext): Promise<boolean> =>
                    {
                        await StructureEditor.repairGameAtSelectionClick(appContext);
                        return true;
                    }
                });
            listItems.push(
                {
                    icon: "CompletedSolid",
                    primaryText: "Apply the finishing touches",
                    cursor: "cursorPointer",
                    stateChecker: null,
                    delegate: async (appContext: IAppContext): Promise<boolean> =>
                    {
                        await StructureEditor.finalizeClick(appContext);
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
                    stateChecker: null,
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
                        disabled={item.stateChecker && item.stateChecker != null && this.state[item.stateChecker] && this.state[item.stateChecker] == null}
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