import * as React from "react";
import * as CSS from "csstype";

import { DefaultButton } from "@fluentui/react";
import { ComboBox, Coachmark, DirectionalHint, TeachingBubbleContent, IButtonProps } from "@fluentui/react";

import { HeroList, HeroListItem, HeroListFormat } from "./HeroList";
import { Progress } from "./Progress";
import { SetupState } from "../../Setup";
import { SetupBook } from "../../Setup";
import { IAppContext, AppContext, TheAppContext } from "../../AppContext";
import { BracketChooser, UpdateBracketChoiceDelegate } from "./BracketChooser";
import { BracketStructureBuilder, BracketOption } from "./../../Brackets/BracketStructureBuilder";
import { GameItem } from "./GameItem";
import { Games } from "./Games";
import { StructureEditor } from "../../BracketEditor/StructureEditor/StructureEditor";
import { IBracketGame, BracketGame } from "../../BracketEditor/BracketGame";
import { BracketDefinition, _bracketManager } from "../../Brackets/BracketDefinitions";
import { RegionSwapper_BottomGame } from "../../BracketEditor/GridAdjusters/RegionSwapper_BottomGame";
import { Adjuster_WantToGrowUpAtTopOfGrid } from "../../BracketEditor/GridAdjusters/Adjuster_WantToGrowUpAtTopOfGrid";
import { TableIO } from "../../Interop/TableIO";
import { Adjuster_SwapGameRegonsForOverlap } from "../../BracketEditor/GridAdjusters/Adjuster_SwapGameRegonsForOverlap";
import { GameMoverTests } from "../../BracketEditor/GameMoverTests";
import { Adjuster_SwapAdjacentGameRegonsForOverlap } from "../../BracketEditor/GridAdjusters/Adjuster_SwapAdjacentGameRegionsForOverlap";
import { Toolbar, ToolbarItem } from "./Toolbar";
import { LogoHeader } from "./LogoHeader";
import { StatusBox } from "./StatusBox";
import { Stack, IStackStyles, IStackItemStyles } from '@fluentui/react';
import { Grid } from "../../BracketEditor/Grid";
import { GameNum } from "../../BracketEditor/GameNum";
import { GridTests } from "../../BracketEditor/GridTests";
import { GridRankerTests } from "../../BracketEditor/GridRankerTests";
import { OADate } from "../../Interop/Dates";
import { TrackingCache } from "../../Interop/TrackingCache";
import { BracketSources } from "../../Brackets/BracketSources";
import { ParserTests } from "../../Interop/Parser";
import { JsCtx } from "../../Interop/JsCtx";
import { FastRangeAreas, FastRangeAreasTest } from "../../Interop/FastRangeAreas";
import { Prioritizer } from "../../BracketEditor/StructureEditor/Prioritizer";
import { s_staticConfig } from "../../StaticConfig";
import { Teachable, TeachableId } from "./Teachable";
import { Coachstate } from "../../Coachstate";
import { CoachTransition } from "../../CoachTransition";
import { HelpLink } from "./HelpLink";

/* global console, Excel, require  */

export interface AppProps
{
    title: string;
    isOfficeInitialized: boolean;
}

export class UnitTestContext
{
    m_testName: string;

    get CurrentTest(): string { return this.m_testName; }

    StartTest(testName: string)
    {
        this.m_testName = testName;
    }
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
    CM:boolean;
}

export default class App extends React.Component<AppProps, AppState>
{
    static version: string = s_staticConfig.version;
    private targetDivRef: React.RefObject<HTMLDivElement> = null;

    m_appContext: AppContext;

    constructor(props, context)
    {
        super(props, context);
        this.state =
        {
            heroList: [],
            heroListFormat: HeroListFormat.Vertical,
            heroTitle: "Setup a new bracket workbook!",
            setupState: SetupState.Unknown,
            errorMessage: "",
            selectedBracket: "T8",
            bracketOptions: BracketStructureBuilder.getStaticAvailableBrackets(),
            games: [],
            mainToolbar: [],
            topToolbar: this.buildTopToolbar(),
            CM: false
        };

        this.m_appContext = new AppContext();
        this.m_appContext.setDelegates(
            null,
            null,
            this.invalidateHeroList.bind(this),
            this.getSelectedBracket.bind(this),
            this.getGames.bind(this));
        this.targetDivRef = React.createRef();
    }

    static async resetCoachingTips(appContext: IAppContext)
    {
        appContext.resetTeachableStates();
        appContext.message(["All coaching tips have been reset. If you want to see them in this session, right click and select Refresh"], null, 10000);
    }

    static async launchHelp(appContext: IAppContext)
    {
        appContext;
        window.open(HelpLink.buildHelpLink("BracketBuilder-Help.html"));
    }
    static async doUnitTests(appContext: IAppContext)
    {
        let curTest = "";
        const testContext: UnitTestContext = new UnitTestContext();

        try
        {
            FastRangeAreasTest.buildCellListForRangeInfoTests();
            ParserTests.testParseStringTests();
            ParserTests.testParseExcelColumnRowReferenceTests();
            ParserTests.testParseExcelAddressTests();
            OADate.TestFromOADateTests();


            // first, dump the grid for the current sheet. this is handy if you are building
            // unit tests since it gives you a way to generate a grid...
            await Excel.run(
                async (ctx) =>
                {
                    const context: JsCtx = new JsCtx(ctx);
                    const grid: Grid = await Grid.createGridFromBracket(context, appContext.getSelectedBracket());

                    grid.logGridCondensed();
                    context.releaseAllTrackedItems();
                });


            OADate.TestMinutesFromTimeStringTests();

            GridRankerTests.test_danglingFeeder_vs_swappedGame(appContext, testContext);
            GameMoverTests.test_ItemMovedOutgoingFeederRequiresHomeAwaySwap(appContext, testContext);

            GridTests.test_getConnectedGridItemForGameResult_ConnectedByLine(appContext, testContext);
            GridTests.test_getConnectedGridItemForGameResult_ConnectedAdjacent(appContext, testContext);
            GridTests.test_getConnectedGridItemForGameResult_NotConnected(appContext, testContext);

            GameMoverTests.test_GrowItemAtTop_DragTopFeedConnectedGameUp_GrowConnectedGameByTop(appContext, testContext);

            RegionSwapper_BottomGame.testRegionSwap1(appContext, testContext);
            Adjuster_WantToGrowUpAtTopOfGrid.testInsertSpaceAtTopOfGrid(appContext, testContext);
            Adjuster_SwapGameRegonsForOverlap.testSwapRegionsForGameOverlap(appContext, testContext);
            Adjuster_SwapAdjacentGameRegonsForOverlap.testSwapAdjacentRegionsForGameOverlap(appContext, testContext);

            GameMoverTests.test_GrowItemDown_DragOutgoingFeederDown_DontAdjustAdjacentCollision(appContext, testContext);

            GameMoverTests.test_ShrinkItemAtTop_DragTopFeedConnectedGameDown_GrowConnectedGameDown_RoomToGrow_ButFavorHomogeneity(appContext, testContext);
            GameMoverTests.test_ShrinkItemAtTop_DragTopFeedConnectedGameDown_GrowConnectedGameDown_RoomToGrow(appContext, testContext);
            GameMoverTests.test_ShrinkItemAtTop_DragTopFeedConnectedGameDown_ShiftConnectedGameDown(appContext, testContext);
            GameMoverTests.test_GrowItemAtTop_DragTopFeedConnectedGameUp_GrowConnectedGameByTop_ButFavorHomogeneity(appContext, testContext);
            GameMoverTests.test_GrowItemAtTop_DragTopFeedConnectedGameUp_GrowConnectedGameByTop(appContext, testContext);
            GameMoverTests.test_GrowItemAtTop_DragTopFeedConnectedGameAndLineUp_ButFavorHomogeneity(appContext, testContext);
//FAIL            GameMoverTests.test_GrowItemAtTop_DragTopFeedConnectedGameAndLineUp(appContext, testContext);

            GameMoverTests.test_GrowItemAtBottom_DragBottomFeedConnectedGameDown(appContext, testContext);
            GameMoverTests.test_GrowItemAtBottom_DragBottomFeedConnectedGameAndLineDown(appContext, testContext);
            GameMoverTests.test_GrowItemAtBottom_DragBottomFeedConnected_ShrinkConnectedGame_BlockedByGameBelow(appContext, testContext);
            GameMoverTests.test_GrowItemAtBottom_DragBottomFeedConnected_ShrinkConnectedGame(appContext, testContext);

            GameMoverTests.test_ShrinkItemAtBottom_DragBottomFeedConnectedGameUp_GameTooSmallToShrink_ShiftGameUp(appContext, testContext);
            GameMoverTests.test_ShrinkItemAtBottom_DragBottomFeedConnectedGameUp_RoomToGrow_ShrinkConnectedGame(appContext, testContext);
            GameMoverTests.test_ShrinkItemAtBottom_DragBottomFeedConnectedGameUp_NoRoomToGrow_ShrinkConnectedGame(appContext, testContext);

            GameMoverTests.test_GrowItemAtBottom_DragOutgoingConnectedGameAndLineDown(appContext, testContext);
            GameMoverTests.test_GrowItemAtBottom_DragOutgoingConnectedGameDown(appContext, testContext);

            GameMoverTests.test_GrowItemDown_FitInAvailableSpace(appContext, testContext);

            GameMoverTests.test_ShiftItemDown_MaintainBuffer_PushGameDown(appContext, testContext);
            GameMoverTests.test_ShiftItemUp_AllowBufferShrink_FavorLessSparsity(appContext, testContext);
            GameMoverTests.test_ShiftItemUp_MaintainBufferPushGameUp(appContext, testContext);

            GameMoverTests.test_GrowItemDown_PushColumnAdjacentItemDown(appContext, testContext);

            GameMoverTests.test_DropItemToSwapHomeAway_Swapped(appContext, testContext);
            GameMoverTests.test_DropItemToSwapHomeAwayWithConnectedSources_Swapped(appContext, testContext);
            GameMoverTests.test_ItemMovedOutgoingFeederRequiresHomeAwaySwap(appContext, testContext);

//FAIL            GameMoverTests.test_DropItemToSwapHomeAwayWithConnectedOutgoingMultipleLevels_Swapped(appContext, testContext);
            GameMoverTests.test_MoveItemWithConnectedTopFeeder_ShiftByNegativeConnectedItem(appContext, testContext);
            GameMoverTests.test_MoveItemWithConnectedTopFeeder_MoveConnectedItem(appContext, testContext);
            GameMoverTests.test_MoveItemWithConnectedBottomFeederAndConnectedOutgoing_RecurseWillCauseOverlap_SimpleShiftAllGames(appContext, testContext);

            // GameMoverTests.test_GrowItemDown_PushColumnAdjacentItemDown(appContext, testContext);
            //await StructureEditor.testGridClick(appContext);

            appContext.message(["tests complete"], null, 5000);
        }
        catch (e)
        {
            appContext.error(
                [`TEST FAILURE: ${testContext.CurrentTest} (${e})`]);
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
                },
                teachableProps:
                {
                    id: TeachableId.Undo,
                    title: "Undo",
                    text: "Sometimes if you get stuck, you have to undo a couple of steps and try adding games in a different order or by selecting a different location to add the game",
                    visibleDelay: 500,
                    directionalHint: DirectionalHint.bottomAutoEdge,
                    isWide: true
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
                icon: "BranchMerge",
                primaryText: "Update brackets with changes",
                cursor: "cursorPointer",
                stateChecker: null,
                delegate: async (appContext: IAppContext): Promise<boolean> =>
                {
                    await StructureEditor.syncBracketChangesFromGameSheetClick(appContext);
                    appContext;
                    return true;
                }
            });
        listItems.push(
            {
                icon: "Brush",
                primaryText: "Shade games by priority",
                cursor: "cursorPointer",
                stateChecker: null,
                delegate: async (appContext: IAppContext): Promise<boolean> =>
                {
                    await Prioritizer.shadeGamesByPriorityClick(appContext);
                    appContext;
                    return true;
                }
            });
        listItems.push(
            {
                icon: "Hide3",
                primaryText: "Toggle showing data sheets",
                cursor: "cursorPointer",
                stateChecker: null,
                delegate: async (appContext: IAppContext): Promise<boolean> =>
                {
                    await StructureEditor.toggleShowDataSheetsClick(appContext);
                    return true;
                }
            });
        listItems.push(
            {
                icon: "ActionCenter",
                primaryText: "Reset Coaching Tips",
                cursor: "cursorPointer",
                stateChecker: null,
                delegate: async (appContext: IAppContext): Promise<boolean> =>
                {
                    await App.resetCoachingTips(appContext);
                    return true;
                }
            });
        if (s_staticConfig.isLocalHost)
        {
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
        }
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
                },
                teachableProps:
                {
                    id: TeachableId.FinishingTouches,
                    title: "Finish Up",
                    text:
                        "Congratulations! All your games are in the bracket. Now its time to apply the finishing touches. This will set the print area, format the titles to appear above the bracket, and hide the bracket sheets. The tournament data will still be on the left of the bracket, but don't worry, it won't print or show up on a PDF you create.",
                    visibleDelay: 500,
                    directionalHint: DirectionalHint.bottomRightEdge,
                    isWide: true
                }
            });

        listItems.push(
            {
                icon: "Help",
                primaryText: "Get help on the web",
                cursor: "cursorPointer",
                stateChecker: null,
                delegate: async (appContext: IAppContext): Promise<boolean> =>
                {
                    await App.launchHelp(appContext);
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

    /*----------------------------------------------------------------------------
        %%Function: App.invalidateHeroList

        Invalidate the top level hero list (and maybe supporting parameters
        below in the UI)
    ----------------------------------------------------------------------------*/
    async invalidateHeroList(context: JsCtx)
    {
        AppContext.checkpoint("ihl.1");
        let setupState: SetupState;
        let bracketChoice: string;

        [setupState, bracketChoice] = await (this.getSetupState(context));
        AppContext.checkpoint("ihl.2");
        let format: HeroListFormat;
        let list: HeroListItem[];
        let title: string;
        AppContext.checkpoint("ihl.3");
//        let bracketChoice: string = await SetupBook.getBracketChoiceOrNull(context);
        AppContext.checkpoint("ihl.4");
        if (bracketChoice == null)
            bracketChoice = this.state.selectedBracket;

        AppContext.checkpoint("ihl.5");
        let games: IBracketGame[] = await this.getGamesList(context, this.m_appContext, bracketChoice);
        AppContext.checkpoint("ihl.6");


        AppContext.checkpoint("ihl.7");
        [format, title, list] = HeroList.buildHeroList(setupState);
        AppContext.checkpoint("ihl.8");
        let items: ToolbarItem[] = [];

        if (setupState == SetupState.Ready)
        {
            items = this.buildMainToolbar();

            let countGamesLinked = 0;
            let countGamesNeedRepair = 0;
            for (let game of games)
            {
                if (game.IsLinkedToBracket)
                {
                    countGamesLinked++;
                }
                if (game.NeedsRepair)
                {
                    countGamesNeedRepair++;
                }
            }
            if (countGamesNeedRepair > 0)
                this.m_appContext.transitionState(CoachTransition.DirtyGameFound);
            else if (countGamesLinked == games.length)
            {
                if (await (Grid.isFinishingTouchesApplied(context)))
                    this.m_appContext.transitionState(CoachTransition.FinishTouches);
                else
                    this.m_appContext.transitionState(CoachTransition.AllGamesLinked);
            }
            else if (countGamesLinked == 0)
                this.m_appContext.transitionState(CoachTransition.NoGamesLinked);
            else if (countGamesLinked == 1)
                this.m_appContext.transitionState(CoachTransition.OneGameLinked);
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

    async ensureBracketLoadedFromSheet(context: JsCtx, bracketTableName: string)
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
                context,
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
    async getGamesList(context: JsCtx, appContext: IAppContext, bracket: string): Promise<IBracketGame[]>
    {
        await this.ensureBracketLoadedFromSheet(context, `${bracket}Bracket`);
        let bracketDef: BracketDefinition = BracketStructureBuilder.getBracketDefinition(`${bracket}Bracket`);

        if (bracketDef == null)
            return [];

        let games: IBracketGame[] = [];

        const bookmark: string = "getGamesList";

        context.pushTrackingBookmark(bookmark);

        appContext.Timer.pushTimer("getGamesList - inner loop");
        for (let i = 0; i < bracketDef.games.length; i++)
        {
            let temp: IBracketGame = await BracketGame.CreateFromGameNumber(context, appContext, bracket, new GameNum(i));
            games.push(temp);
        }

        context.releaseTrackedItemsUntil(bookmark);
        await context.sync();
        appContext.Timer.stopAllAggregatedTimers();
        appContext.Timer.popTimer();

        return games;
    }

    /*----------------------------------------------------------------------------
        %%Function: App.getSetupState

        Get the setup state of the workbook and opportunistically return the
        bracket choice as well
    ----------------------------------------------------------------------------*/
    async getSetupState(context: JsCtx): Promise<[SetupState, string]>
    {
        AppContext.checkpoint("gss.1");
        let setupState: SetupState;
        let bracketChoice: string;

        if (context != null)
            [setupState, bracketChoice] = await SetupBook.getWorkbookSetupState(context);
        else
            await Excel.run(async (ctx) =>
            {
                const context: JsCtx = new JsCtx(ctx);

                [setupState, bracketChoice] = await SetupBook.getWorkbookSetupState(context)
                context.releaseAllTrackedItems();
            });
        AppContext.checkpoint("gss.2");

        return [setupState, bracketChoice];
    }

    /*----------------------------------------------------------------------------
        %%Function: App.getSelectedBracket

        Get the bracket the user has selected
    ----------------------------------------------------------------------------*/
    getSelectedBracket(): string
    {
        return this.state.selectedBracket;
    }

    // setup the initial state as well as the initial coaching state
    // (this is our opportunity to figure out what state the workbook
    // is in when the addin is initialized)
    async componentDidMount()
    {
        let setupState: SetupState;
        let bracketChoice: string;

        [setupState, bracketChoice] = await (this.getSetupState(null));
        if (setupState != SetupState.Ready)
            this.m_appContext.Coachstate = Coachstate.BracketCreation;

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
                setupState: setupState,
                games: []
            });

        // now grab the games async and have it update
        Excel.run(
            async (ctx) =>
            {
                this.m_appContext.setProgressVisible(true);
                try
                {
                    const context: JsCtx = new JsCtx(ctx);

                    await this.invalidateHeroList(context);
                    context.releaseAllTrackedItems();
                }
                catch (e)
                {

                }
                this.m_appContext.setProgressVisible(false);
            });
    }

    async click()
    {
        try
        {
            AppContext.checkpoint("testing");
            await Excel.run(async (ctx) =>
            {
                const context: JsCtx = new JsCtx(ctx);

                AppContext.checkpoint("state: " + await SetupBook.getWorkbookSetupState(context));
                /**
                 * Insert your Excel code here
                 */
                const range = context.Ctx.workbook.getSelectedRange();

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
                context.releaseAllTrackedItems();
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

    showCM()
    {
        this.setState(
            {
                CM: true
            });
    }

    hideCM()
    {
        this.setState(
            {
                CM: false
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
                    message="Please sideload your addin to see app body."
                    appContext={this.m_appContext}
                    initialVisibility={true}/>
            );
        }

        let insertBracketChooserMaybe = () =>
        {
            if (this.state.setupState == SetupState.NoBracketChoice ||
                this.state.setupState == SetupState.NoBracketStructure)
            {
                return (
                    <div>
                        <Teachable
                            isWide={true}
                            id={TeachableId.BracketBuilder }
                            title="Get started here"
                            text="Choose the number of teams in the tournament and then click on Build this bracket!"
                            visibleDelay={1000}
                            directionalHint={DirectionalHint.bottomLeftEdge}>
                            <BracketChooser alignment="center"
                                            updateBracketChoiceDelegate={this.updateSelectedBracketChoice.bind(this)}
                                            bracketOptions={this.state.bracketOptions} initialBracket={this.state.selectedBracket}/>
                        </Teachable>

                    </div>
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
                <TheAppContext.Provider value={this.m_appContext}>
                    <Stack styles={stackStyles}>
                        <Stack.Item styles={headerItemStyle}>
                            <LogoHeader/>
                            <Toolbar alignment="start" message={""} appContext={this.m_appContext} items={this.state.topToolbar}/>
                        </Stack.Item>
                        <Progress
                            title=""
                            logo={null}
                            message="Working on it..."
                            initialVisibility={false}
                            appContext={this.m_appContext}/>
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
                            <StatusBox/>
                            <div style={versionLabelProps}>
                                {App.version}
                            </div>
                        </Stack.Item>
                    </Stack>
                </TheAppContext.Provider>
            </div>
        );
    }
}