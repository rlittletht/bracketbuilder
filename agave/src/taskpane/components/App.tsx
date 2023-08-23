import * as CSS from "csstype";
import * as React from "react";

import { DirectionalHint } from "@fluentui/react";

import { IStackItemStyles, IStackStyles, Stack } from '@fluentui/react';
import { AppContext, IAppContext, TheAppContext } from "../../AppContext/AppContext";
import { BracketGame, IBracketGame } from "../../BracketEditor/BracketGame";
import { GameNum } from "../../BracketEditor/GameNum";
import { Grid } from "../../BracketEditor/Grid";
import { Prioritizer } from "../../BracketEditor/StructureEditor/Prioritizer";
import { StructureEditor } from "../../BracketEditor/StructureEditor/StructureEditor";
import { BracketDefinition } from "../../Brackets/BracketDefinitions";
import { _bracketManager } from "../../Brackets/BracketManager";
import { Coachstate } from "../../Coaching/Coachstate";
import { CoachTransition } from "../../Coaching/CoachTransition";
import { FastFormulaAreas } from "../../Interop/FastFormulaAreas";
import { IntentionsTest } from "../../Interop/Intentions/IntentionsTest";
import { JsCtx } from "../../Interop/JsCtx";
import { RangeCaches } from "../../Interop/RangeCaches";
import { TableIO } from "../../Interop/TableIO";
import { _TimerStack } from "../../PerfTimer";
import { SetupBook, SetupState } from "../../Setup";
import { s_staticConfig } from "../../StaticConfig";
import { StreamWriter } from "../../Support/StreamWriter";
import { UnitTests } from "../../Tests/UnitTests";
import { BracketOption, BracketStructureBuilder } from "./../../Brackets/BracketStructureBuilder";
import { About } from "./About";
import { BracketChooser } from "./BracketChooser";
import { Games } from "./Games";
import { HelpLink } from "./HelpLink";
import { HeroList, HeroListFormat, HeroListItem } from "./HeroList";
import { LogoHeader } from "./LogoHeader";
import { Progress } from "./Progress";
import { StatusBox } from "./StatusBox";
import { Teachable, TeachableId } from "./Teachable";
import { Toolbar, ToolbarItem } from "./Toolbar";

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
    debugToolbar: ToolbarItem[];
    mainToolbar: ToolbarItem[];
    aboutShowing: boolean;
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
            debugToolbar: this.buildDebugToolbar(),
            CM: false,
            aboutShowing: false
        };

        this.m_appContext = new AppContext();
        this.m_appContext.setDelegates(
            null,
            null,
            this.rebuildHeroList.bind(this),
            this.getSelectedBracket.bind(this),
            this.getGames.bind(this),
            this.getSetupStateFromState.bind(this));

        this.targetDivRef = React.createRef();
    }

    getSetupStateFromState(): SetupState
    {
        return this.state.setupState;
    }

    static async resetCoachingTips(appContext: IAppContext)
    {
        appContext.Teaching.resetTeachableStates();
        appContext.Messages.message(["All coaching tips have been reset. If you want to see them in this session, right click and select Refresh"], null, 10000);
    }

    static async launchHelp(appContext: IAppContext)
    {
        appContext;
        window.open(HelpLink.buildHelpLink("BracketBuilder-Help.html"));
    }

    static async doIntegrationTests(appContext: IAppContext)
    {
        const results = [];

        const outStream = new StreamWriter((line) => results.push(line));

        try
        {
            await IntentionsTest.runAllTests(appContext, outStream);
        }
        catch (e)
        {
            results.push(`EXCEPTION CAUGHT: ${e}`);
        }

        appContext.Messages.message([...results, "Integration Tests Complete"]);
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
                primaryText: "About traynrex red",
                cursor: "cursorPointer",
                stateChecker: null,
                delegate: async (appContext: IAppContext): Promise<boolean> =>
                {
                    appContext;
                    this.showAboutDialog();
                    return true;
                }
            });
        return listItems;
    }

    buildDebugToolbar(): ToolbarItem[]
    {
        let listItems: ToolbarItem[] = [];

        if (!s_staticConfig.isLocalHost)
            return listItems;

            listItems.push(
                {
                    icon: "LadybugSolid",
                    primaryText: "Run Unit Tests",
                    cursor: "cursorPointer",
                    stateChecker: null,
                    delegate: async (appContext: IAppContext): Promise<boolean> =>
                    {
                        await UnitTests.doUnitTests(appContext);
                        return true;
                    }
                });

            listItems.push(
                {
                    icon: "Bug",
                    primaryText: "Run Integration Tests",
                    cursor: "cursorPointer",
                    stateChecker: null,
                    delegate: async (appContext: IAppContext): Promise<boolean> =>
                    {
                        await App.doIntegrationTests(appContext);
                        return true;
                    }
                });

            listItems.push(
                {
                    icon: "Copy",
                    primaryText: "Copy selected area",
                    cursor: "cursorPointer",
                    stateChecker: null,
                    delegate: async (appContext: IAppContext): Promise<boolean> =>
                    {
                        await StructureEditor.copySelectionToClipboardClick(appContext);
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
        %%Function: App.rebuildHeroList

        Invalidate the top level hero list (and maybe supporting parameters
        below in the UI)
    ----------------------------------------------------------------------------*/
    async rebuildHeroList(context: JsCtx)
    {
        this.m_appContext.setHeroListDirty(false);

        _TimerStack.pushTimer("rebuildHeroList", false);

        const bookmark: string = "rebuildHeroList";
        context.pushTrackingBookmark(bookmark);

        await _TimerStack.timeThisAsync(
            "buildFastFormulaAreas",
            async () =>
            {
                await FastFormulaAreas.populateFastFormulaAreaCachesForAllSheets(context);
            });
        
        AppContext.checkpoint("ihl.1");
        let setupState: SetupState;
        let bracketChoice: string;

        _TimerStack.pushTimer("rebuildHeroList.getSetupState");
        [setupState, bracketChoice] = await (this.getSetupState(context));

        await RangeCaches.PopulateIfNeeded(context, bracketChoice);

        _TimerStack.popTimer();

        AppContext.checkpoint("ihl.2");
        let format: HeroListFormat;
        let list: HeroListItem[];
        let title: string;
        AppContext.checkpoint("ihl.3");
//        let bracketChoice: string = await SetupBook.getBracketChoiceOrNull(context);
        AppContext.checkpoint("ihl.4");
        if (bracketChoice == null)
            bracketChoice = this.state.selectedBracket;

        _TimerStack.pushTimer("getGamesList");

        AppContext.checkpoint("ihl.5");
        let games: IBracketGame[] = await this.getGamesList(context, this.m_appContext, bracketChoice);
        AppContext.checkpoint("ihl.6");
        _TimerStack.popTimer();


        _TimerStack.pushTimer("buildToolbars");

        AppContext.checkpoint("ihl.7");
        [format, title, list] = HeroList.buildHeroList(setupState);
        AppContext.checkpoint("ihl.8");
        let items: ToolbarItem[] = [];


        if (setupState == SetupState.Ready)
        {
            items = this.buildMainToolbar();

            let countGamesLinked = 0;
            let countGamesNeedRepair = 0;
            let countGamesBroken = 0;

            for (let game of games)
            {
                if (game.IsLinkedToBracket)
                {
                    countGamesLinked++;
                }
                if (game.NeedsDataPull)
                {
                    countGamesNeedRepair++;
                }
                if (game.IsBroken)
                {
                    countGamesBroken++;
                }
            }
            if (countGamesBroken > 0)
                this.m_appContext.Teaching.transitionState(CoachTransition.BrokenGameFound);
            else if (countGamesNeedRepair > 0)
                this.m_appContext.Teaching.transitionState(CoachTransition.DirtyGameFound);
            else if (countGamesLinked == games.length)
            {
                if (await (Grid.isFinishingTouchesApplied(context)))
                    this.m_appContext.Teaching.transitionState(CoachTransition.FinishTouches);
                else
                    this.m_appContext.Teaching.transitionState(CoachTransition.AllGamesLinked);
            }
            else if (countGamesLinked == 0)
                this.m_appContext.Teaching.transitionState(CoachTransition.NoGamesLinked);
            else if (countGamesLinked == 1)
                this.m_appContext.Teaching.transitionState(CoachTransition.OneGameLinked);
        }
        _TimerStack.popTimer();        

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
        context.releaseCacheObjectsUntil(bookmark);
        _TimerStack.popTimer();
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

            let gameDefs: any[] = null;

            const { rangeInfo: rangeBracketDataBody, formulaCacheType: rangeBracketCacheType } = RangeCaches.get(RangeCaches.s_bracketDefDataBody);
            const { rangeInfo: rangeBracketHeader } = RangeCaches.get(RangeCaches.s_bracketDefHeader);
            if (rangeBracketDataBody && rangeBracketHeader)
            {
                const areas = FastFormulaAreas.getFastFormulaAreaCacheForType(context, rangeBracketCacheType);

                if (areas)
                {
                    const header = areas.getValuesForRangeInfo(rangeBracketHeader);
                    const dataBody = areas.getValuesForRangeInfo(rangeBracketDataBody);

                    gameDefs = TableIO.readDataFromCachedExcelTable(
                        bracketDef.tableName,
                        header,
                        dataBody,
                        ["Game", "Winner", "Loser", "Top", "Bottom"],
                        true);
                }
            }

            if (!gameDefs)
            {
                gameDefs = await TableIO.readDataFromExcelTable(
                    context,
                    bracketDef.tableName,
                    ["Game", "Winner", "Loser", "Top", "Bottom"],
                    true);
            }

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
        _TimerStack.pushTimer("getGamesList.ensureBracketLoadedFromSheet");
        await this.ensureBracketLoadedFromSheet(context, `${bracket}Bracket`);
        let bracketDef: BracketDefinition = BracketStructureBuilder.getBracketDefinition(`${bracket}Bracket`);

        if (bracketDef == null)
            return [];

        let games: IBracketGame[] = [];
        _TimerStack.popTimer();

        const bookmark: string = "getGamesList";

        context.pushTrackingBookmark(bookmark);

        _TimerStack.pushTimer("getGamesList - inner loop");
        for (let i = 0; i < bracketDef.games.length; i++)
        {
            let temp: IBracketGame = await BracketGame.CreateFromGameNumber(context, appContext, bracket, new GameNum(i));
            games.push(temp);
        }

        context.releaseCacheObjectsUntil(bookmark);
        await context.sync();
        _TimerStack.stopAllAggregatedTimers();
        _TimerStack.popTimer();

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
                context.releaseAllCacheObjects();
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
            this.m_appContext.Teaching.Coachstate = Coachstate.BracketCreation;

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

                    await this.rebuildHeroList(context);
                    context.releaseAllCacheObjects();
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
                context.releaseAllCacheObjects();
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

    hideAboutDialog()
    {
        this.setState({ aboutShowing: false });
    }

    showAboutDialog()
    {
        this.setState({ aboutShowing: true });
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
                          ? (<Games bracketName="T9"/>)
                          : "";

        const maybeToolbar =
            this.state.setupState == SetupState.Ready
                ? (<Toolbar message={""} items={this.state.mainToolbar} alignment="center"/>)
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
        const welcomeItemStyle: IStackItemStyles =
        {
            root: { overflow: 'auto', padding: "1rem" }
        };

        const welcome = this.state.setupState == SetupState.Ready
            ? ""
            : (
                <Stack.Item styles={welcomeItemStyle}>
                    <h1>Welcome!</h1>
                    <p>
                    </p>
                    <p>To get started, choose the size of your bracket above and then click
                        the <em>BuildThisBracket</em> button!</p>
                    <p>For help, click on the ? button on the toolbar, or just hover over a button to get
                        a tip about what it does.
                    </p>
                </Stack.Item>
            );
        const stackStyles: IStackStyles =
        {
            root:
            {
                height: '99vh'
            }
        };

        const debugToolbar = s_staticConfig.isLocalHost
            ? (<Toolbar alignment="start" message={""} items={this.state.debugToolbar} />)
            : (<span />);

        return (
            <div>
                <TheAppContext.Provider value={this.m_appContext}>
                    <About closeDelegate={this.hideAboutDialog.bind(this)} showDialog={this.state.aboutShowing} />
                    <Stack styles={stackStyles}>
                        <Stack.Item styles={headerItemStyle}>
                            <LogoHeader/>
                            <Toolbar alignment="start" message={""} items={this.state.topToolbar} />
                            {debugToolbar}
                        </Stack.Item>
                        <Progress
                            title=""
                            logo={null}
                            message="Working on it..."
                            initialVisibility={false}/>
                        <Stack.Item styles={bodyHeaderItemStyle}>
                            <HeroList message={this.state.heroTitle} items={this.state.heroList} heroListFormat={this.state.heroListFormat}>
                                {insertBracketChooserMaybe()}
                            </HeroList>
                            {maybeToolbar}
                        </Stack.Item>
                        {welcome}
                        <Stack.Item styles={bodyItemStyle}>
                            <div style={ gamesStyle }>
                                {games}
                            </div>
                        </Stack.Item>
                        <Stack.Item styles={footerItemStyle}>
                            <StatusBox/>
                        </Stack.Item>
                    </Stack>
                </TheAppContext.Provider>
            </div>
        );
    }
}