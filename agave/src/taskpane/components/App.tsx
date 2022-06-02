import * as React from "react";
import { DefaultButton } from "@fluentui/react";
import { ComboBox } from "@fluentui/react";

import Header from "./Header";
import HeroList, { HeroListItem, HeroListFormat } from "./HeroList";
import Progress from "./Progress";
import { SetupState } from "../../Setup";
import { SetupBook } from "../../Setup";
import { IAppContext, AppContext } from "../../AppContext";
import BracketChooser, { UpdateBracketChoiceDelegate } from "./BracketChooser";
import { BracketStructureBuilder, BracketOption } from "./../../Brackets/BracketStructureBuilder";
import GameItem from "./GameItem";
import Games from "./Games";
import { StructureEditor } from "../../BracketEditor/StructureEditor";
import { RangeInfo, Ranges } from "../../Interop/Ranges";
import { IBracketGame, BracketGame } from "../../BracketEditor/BracketGame";
import { BracketDefinition, _bracketManager } from "../../Brackets/BracketDefinitions";
import { RegionSwapper_BottomGame } from "../../BracketEditor/GridAdjusters/RegionSwapper_BottomGame";
import { Adjuster_WantToGrowUpAtTopOfGrid } from "../../BracketEditor/GridAdjusters/Adjuster_WantToGrowUpAtTopOfGrid";
import { TableIO } from "../../Interop/TableIO";
import ActionButton from "./ActionButton";
import { Adjuster_SwapGameRegonsForOverlap } from "../../BracketEditor/GridAdjusters/Adjuster_SwapGameRegonsForOverlap";
import { GameMoverTests } from "../../BracketEditor/GameMoverTests";
import { Adjuster_SwapAdjacentGameRegonsForOverlap } from "../../BracketEditor/GridAdjusters/Adjuster_SwapAdjacentGameRegionsForOverlap";
import Toolbar, { ToolbarItem } from "./Toolbar";
import * as CSS from "csstype";
import LogoHeader from "./LogoHeader";
import StatusBox from "./StatusBox";
import { Alignment, DefaultPalette, Slider, Stack, IStackStyles, IStackTokens, IStackItemStyles } from '@fluentui/react';

/* global console, Excel, require  */

export interface AppProps
{
    title: string;
    isOfficeInitialized: boolean;
}

export interface AppState
{
    heroList: HeroListItem[];
    heroListFormat: HeroListFormat;
    heroTitle: string;

    setupState: SetupState;
    errorMessage: string;
    selectedBracket: string;
    bracketOptions: BracketOption[];
    games: IBracketGame[];
    topToolbar: ToolbarItem[];
    mainToolbar: ToolbarItem[];
}

export default class App extends React.Component<AppProps, AppState>
{
    static version: string = "1.0.0.12";

    m_appContext: AppContext;

    constructor(props, context)
    {
        super(props, context);
        this.state =
        {
            heroList: [],
            heroListFormat: HeroListFormat.Vertical,
            heroTitle: "Setup a new bracket workbook!",
            setupState: SetupState.NoBracketStructure,
            errorMessage: "",
            selectedBracket: "",
            bracketOptions: BracketStructureBuilder.getStaticAvailableBrackets(),
            games: [],
            mainToolbar: [],
            topToolbar: this.buildTopToolbar(),
    };

        this.m_appContext = new AppContext();
        this.m_appContext.setDelegates(
            this.addLogMessage.bind(this),
            this.invalidateHeroList.bind(this),
            this.getSelectedBracket.bind(this),
            this.getGames.bind(this));
    }

    static async doUnitTests(appContext: IAppContext)
    {
        try
        {
            RegionSwapper_BottomGame.testRegionSwap1(appContext);
            Adjuster_WantToGrowUpAtTopOfGrid.testInsertSpaceAtTopOfGrid(appContext);
            Adjuster_SwapGameRegonsForOverlap.testSwapRegionsForGameOverlap(appContext);
            Adjuster_SwapAdjacentGameRegonsForOverlap.testSwapAdjacentRegionsForGameOverlap(appContext);
            //GameMoverTests.testMoveItemDownPushingOneGameDownMaintainBuffer(appContext);
            //GameMoverTests.testMoveItemUpPushingOneGameUpMaintainBuffer(appContext);
            //await StructureEditor.testGridClick(appContext);

            appContext.logTimeout("tests complete", 5000);
        }
        catch (e)
        {
            appContext.log(`caught error; ${e}`);
        }
    }

    buildTopToolbar(): ToolbarItem[]
    {
        let listItems: ToolbarItem[] = [];

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

        listItems.push(
            {
                icon: "AlertSolid",
                primaryText: "Run Unit Tests",
                cursor: "cursorPointer",
                stateChecker: null,
                delegate: async (appContext: IAppContext): Promise<boolean> =>
                {
                    await App.doUnitTests(appContext);
                    return true;
                }
            });

        return listItems;
    }

    buildMainToolbar(): ToolbarItem[]
    {
        let listItems: ToolbarItem[] = [];

        listItems.push(
            {
                icon: "Upload",
                primaryText: "Pick up game for move",
                cursor: "cursorPointer",
                stateChecker: null,
                delegate: async (appContext: IAppContext): Promise<boolean> => {
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
                delegate: async (appContext: IAppContext): Promise<boolean> => {
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
                delegate: async (appContext: IAppContext): Promise<boolean> => {
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
                delegate: async (appContext: IAppContext): Promise<boolean> => {
                    await StructureEditor.repairGameAtSelectionClick(appContext);
                    return true;
                }
            });
        listItems.push(
            {
                icon: "Hide3",
                primaryText: "Toggle showing data sheets",
                cursor: "cursorPointer",
                stateChecker: null,
                delegate: async (appContext: IAppContext): Promise<boolean> => {
                    await StructureEditor.toggleShowDataSheetsClick(appContext);
                    return true;
                }
            });
        listItems.push(
            {
                icon: "CompletedSolid",
                primaryText: "Apply the finishing touches",
                cursor: "cursorPointer",
                stateChecker: null,
                delegate: async (appContext: IAppContext): Promise<boolean> => {
                    await StructureEditor.finalizeClick(appContext);
                    return true;
                }
            });

        return listItems;
    }

    getGames(): IBracketGame[]
    {
        return this.state.games;
    }


    /*----------------------------------------------------------------------------
        %%Function: App.addLogMessage

        Add a log message to the UI
    ----------------------------------------------------------------------------*/
    addLogMessage(message: string)
    {
        this.setState({ errorMessage: message });
    }

    /*----------------------------------------------------------------------------
        %%Function: App.invalidateHeroList

        Invalidate the top level hero list (and maybe supporting parameters
        below in the UI)
    ----------------------------------------------------------------------------*/
    async invalidateHeroList(ctx: any)
    {
        AppContext.checkpoint("ihl.1");
        let setupState: SetupState = await(this.getSetupState(ctx));
        AppContext.checkpoint("ihl.2");
        let format: HeroListFormat;
        let list: HeroListItem[];
        let title: string;
        AppContext.checkpoint("ihl.3");
        let bracketChoice: string = await SetupBook.getBracketChoiceOrNull(ctx);
        AppContext.checkpoint("ihl.4");
        if (bracketChoice == null)
            bracketChoice = this.state.selectedBracket;

        AppContext.checkpoint("ihl.5");
        let games: IBracketGame[] = await this.getGamesList(ctx, bracketChoice);
        AppContext.checkpoint("ihl.6");


        AppContext.checkpoint("ihl.7");
        [format, title, list] = HeroList.buildHeroList(setupState);
        AppContext.checkpoint("ihl.8");
        let items: ToolbarItem[] = [];

        if (setupState == SetupState.Ready)
        {
            items = this.buildMainToolbar();
        }

        // update the games list

        AppContext.checkpoint("ihl.9");
        this.setState(
            {
                heroList: list,
                heroListFormat: format,
                heroTitle: title,
                setupState: setupState,
                games: games,
                selectedBracket: bracketChoice,
                mainToolbar: items
            });
    }

    async ensureBracketLoadedFromSheet(ctx: any, bracketTableName: string)
    {
        if (!_bracketManager.IsCached(bracketTableName))
        {
            let bracketDef: BracketDefinition = BracketStructureBuilder.getBracketDefinition(bracketTableName);
            let loading: BracketDefinition =
            {
                name: bracketDef.name,
                teamCount: bracketDef.teamCount,
                tableName: bracketDef.tableName,
                games: []
            };

            let gameDefs: any[] = await TableIO.readDataFromExcelTable(
                ctx,
                bracketDef.tableName,
                ["Game", "Winner", "Loser", "Top", "Bottom"],
                true);

            for (let game of gameDefs)
            {
                loading.games.push(
                    {
                        winner: game.Winner,
                        loser: game.Loser,
                        topSource: game.Top,
                        bottomSource: game.Bottom
                    });
            }
            _bracketManager.setCache(loading);
        }
    }

    // now have to have the hero list get the games from here as a param, and use that in populating the games.
    async getGamesList(ctx: any, bracket: string): Promise<IBracketGame[]>
    {
        await this.ensureBracketLoadedFromSheet(ctx, `${bracket}Bracket`);
        let bracketDef: BracketDefinition = BracketStructureBuilder.getBracketDefinition(`${bracket}Bracket`);

        if (bracketDef == null)
            return [];

        let games: IBracketGame[] = [];

        for (let i = 0; i < bracketDef.games.length; i++)
        {
            let temp: IBracketGame = await BracketGame.CreateFromGameNumber(ctx, bracket, i);
            games.push(temp);
        }

        return games;
    }

    /*----------------------------------------------------------------------------
        %%Function: App.getSetupState

        Get the setup state of the workbook
    ----------------------------------------------------------------------------*/
    async getSetupState(ctx: any): Promise<SetupState>
    {
        AppContext.checkpoint("gss.1");
        let setupState: SetupState;

        if (ctx != null)
            setupState = await SetupBook.getWorkbookSetupState(ctx);
        else
            setupState = await Excel.run(async (context) => SetupBook.getWorkbookSetupState(context));
        AppContext.checkpoint("gss.2");

        return setupState;
    }

    /*----------------------------------------------------------------------------
        %%Function: App.getSelectedBracket

        Get the bracket the user has selected
    ----------------------------------------------------------------------------*/
    getSelectedBracket(): string
    {
        return this.state.selectedBracket;
    }

    async componentDidMount()
    {
        let setupState: SetupState = await (this.getSetupState(null));
        let format: HeroListFormat;
        let list: HeroListItem[];
        let title: string;

        [format, title, list] = HeroList.buildHeroList(setupState);
        // figure out our top level menu.... Setup, or bracket editing
        this.setState(
            {
                heroListFormat: format,
                heroList: list,
                heroTitle: title,
                selectedBracket: "",
                setupState: setupState,
                games: []
            });

        // now grab the games async and have it update
        Excel.run(
            async (context) =>
            {
                await this.invalidateHeroList(context);
            });
    }

    async click()
    {
        try
        {
            AppContext.checkpoint("testing");
            await Excel.run(async (context) =>
            {
                AppContext.checkpoint("state: " + await(SetupBook.getWorkbookSetupState(context)));
                /**
                 * Insert your Excel code here
                 */
                const range = context.workbook.getSelectedRange();

                // Read the range address
                range.load("address");
                range.format.fill.load("color");
                await context.sync();
                AppContext.checkpoint(`The color is ${range.format.fill.color}.`);


                // Update the fill color
//                range.format.fill.color = "#FFFFFF";
                range.format.fill.clear();
//                StructureEditor.formatConnectingLineRange(context, range);

                await context.sync();
                AppContext.checkpoint(`The range address was ${range.address}.`);
            });
        }
        catch (error)
        {
            console.error(error);
        }
    };

    /*----------------------------------------------------------------------------
        %%Function: App.updateSelectedBracketChoice

        delegate to update our top level state on the selected choice
        (this is passed to the bracket chooser component)
    ----------------------------------------------------------------------------*/
    updateSelectedBracketChoice(selectedBracket: string)
    {
        this.setState({
            selectedBracket: selectedBracket
        });
    }

    render()
    {
        const { title, isOfficeInitialized } = this.props;

        if (!isOfficeInitialized)
        {
            return (
                <Progress
                    title={title}
                    logo={require("./../../../assets/TW-Logo.png")}
                    message="Please sideload your addin to see app body."/>
            );
        }

        let insertBracketChooserMaybe = () =>
        {
            if (this.state.setupState == SetupState.NoBracketChoice ||
                this.state.setupState == SetupState.NoBracketStructure)
            {
                return (
                    <BracketChooser alignment="center"
                        updateBracketChoiceDelegate={this.updateSelectedBracketChoice.bind(this)}
                            bracketOptions={this.state.bracketOptions} />
                );
            }
            else
                return (<span/>);
        }

        const games = this.state.setupState == SetupState.Ready
                          ? (<Games appContext={this.m_appContext} bracketName="T9"/>)
                          : "";

        const maybeToolbar =
            this.state.setupState == SetupState.Ready
                ? (<Toolbar message={""} appContext={this.m_appContext} items={this.state.mainToolbar} alignment="center"/>)
                : "";
        const versionLabelProps: CSS.Properties =
        {
            textAlign: 'right'
        };

        const gamesStyle: CSS.Properties = { };
        const headerItemStyle: IStackItemStyles = { };
        const bodyHeaderItemStyle: IStackItemStyles = { };
        const footerItemStyle: IStackItemStyles =
        {
            root: { textAlign: 'start' }
        };
        const bodyItemStyle: IStackItemStyles =
        {
            root: { overflow: 'auto' }
        };

        const stackStyles: IStackStyles =
        {
            root:
            {
                height: '99vh'
            }
        };

        return (
            <div>
                <Stack styles={stackStyles}>
                    <Stack.Item styles={headerItemStyle}>
                        <LogoHeader/>
                        <Toolbar alignment="start" message={""} appContext={this.m_appContext} items={this.state.topToolbar}/>
                    </Stack.Item>
                    <Stack.Item styles={bodyHeaderItemStyle}>
                        <HeroList message={this.state.heroTitle} items={this.state.heroList} appContext={this.m_appContext} heroListFormat={this.state.heroListFormat}>
                            {insertBracketChooserMaybe()}
                        </HeroList>
                        {maybeToolbar}
                    </Stack.Item>
                    <Stack.Item styles={bodyItemStyle}>
                        <div style={ gamesStyle }>
                            {games}
                        </div>
                    </Stack.Item>
                    <Stack.Item styles={footerItemStyle}>
                        <StatusBox appContext={this.m_appContext}/>
                        <div style={versionLabelProps}>
                            {App.version}
                        </div>
                    </Stack.Item>
                </Stack>
            </div>
        );
    }
}