import * as CSS from "csstype";
import * as React from "react";

import '../taskpane.css'

import { DirectionalHint } from "@fluentui/react";

import { IStackItemStyles, IStackStyles, Stack } from '@fluentui/react';
import { AppContext, IAppContext, TheAppContext } from "../../AppContext/AppContext";
import { IAppStateAccess } from "../../AppContext/IAppStateAccess";
import { BracketGame, IBracketGame } from "../../BracketEditor/BracketGame";
import { GameNum } from "../../BracketEditor/GameNum";
import { Grid } from "../../BracketEditor/Grid";
import { Prioritizer } from "../../BracketEditor/StructureEditor/Prioritizer";
import { StructureEditor } from "../../BracketEditor/StructureEditor/StructureEditor";
import { _bracketManager } from "../../Brackets/BracketManager";
import { Coachstate } from "../../Coaching/Coachstate";
import { CoachTransition } from "../../Coaching/CoachTransition";
import { FastFormulaAreas } from "../../Interop/FastFormulaAreas";
import { IntentionsTest } from "../../Interop/Intentions/IntentionsTest";
import { JsCtx } from "../../Interop/JsCtx";
import { RangeCaches, RangeCacheItemType } from "../../Interop/RangeCaches";
import { TableIO } from "../../Interop/TableIO";
import { _TimerStack } from "../../PerfTimer";
import { SetupBook, SetupState } from "../../Setup";
import { s_staticConfig } from "../../StaticConfig";
import { StreamWriter } from "../../Support/StreamWriter";
import { UnitTests } from "../../Tests/UnitTests";
import { BracketOption, BracketDefBuilder } from "../../Brackets/BracketDefBuilder";
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
import { Dispatcher } from "../../BracketEditor/Dispatcher";
import { FreezeDays } from "../../commands/FreezeDays";
import { IBracketDefinitionData } from "../../Brackets/IBracketDefinitionData";

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

    errorMessage: string;
    bracketOptions: BracketOption[];
    customBracketOptions: BracketOption[];
    games: IBracketGame[];
    topToolbar: ToolbarItem[];
    debugToolbar: ToolbarItem[];
    mainToolbar: ToolbarItem[];
    aboutShowing: boolean;
    heroListDirty: boolean;
    bracketMayHaveDirectEdits: boolean;
    rulesMayHaveEdits: boolean;
    sheetsHidden: boolean;
    panesFrozen: boolean;
}

export default class App extends React.Component<AppProps, AppState> implements IAppStateAccess
{
    static version: string = s_staticConfig.version;
    private targetDivRef: React.RefObject<HTMLDivElement> = null;

    m_appContext: AppContext;

    constructor(props, context)
    {
        super(props, context);

        this.m_appContext = new AppContext();
        this.m_appContext.setDelegates(
            null,
            null,
            this.getGames.bind(this),
            this /*IAppStateAccess*/);

        this.state =
        {
            heroList: [],
            heroListFormat: HeroListFormat.Vertical,
            heroTitle: "",
            errorMessage: "",
            bracketOptions: BracketDefBuilder.getStaticAvailableBrackets(),
            customBracketOptions: [],
            games: [],
            mainToolbar: [],
            topToolbar: this.buildTopToolbar(),
            debugToolbar: this.buildDebugToolbar(),
            aboutShowing: false,
            heroListDirty: false,
            bracketMayHaveDirectEdits: false,
            rulesMayHaveEdits: false,
            sheetsHidden: false,
            panesFrozen: false
        };


        this.targetDivRef = React.createRef();
    }

    // IAppStateAccess Implementation
    set HeroListDirty(dirty: boolean)
    {
        this.setState({ heroListDirty: dirty });
    }

    get HeroListDirty(): boolean
    {
        return this.state?.heroListDirty ?? false;;
    }

    set BracketDirtyForBracketEdit(dirty: boolean)
    {
        this.setState({ bracketMayHaveDirectEdits: dirty });
    }

    get BracketDirtyForBracketEdit(): boolean
    {
        return this.state?.bracketMayHaveDirectEdits ?? false;
    }

    set RulesDirtyForRulesEdit(dirty: boolean)
    {
        this.setState({ rulesMayHaveEdits: dirty });
    }

    get RulesDirtyForRulesEdit(): boolean
    {
        return this.state?.rulesMayHaveEdits;
    }

    set SheetsHidden(hidden: boolean)
    {
        this.setState({ sheetsHidden: hidden });
    }

    get SheetsHidden(): boolean
    {
        return this.state?.sheetsHidden ?? false;
    }

    set DaysFrozen(frozen: boolean)
    {
        this.setState({ panesFrozen: frozen });
    }

    get DaysFrozen(): boolean
    {
        return this.state?.panesFrozen ?? false;
    }

    static async resetCoachingTips(appContext: IAppContext)
    {
        appContext.Teaching.resetTeachableStates();
        appContext.Messages.message(["All coaching tips have been reset. If you want to see them in this session, right click and select Refresh"], null, 10000);
    }

    static async launchHelp(appContext: IAppContext)
    {
        appContext;
        window.open(HelpLink.buildHelpLink("BracketBuilder.html"));
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

    setSheetsHidden(hidden: boolean)
    {
        this.setState({
            sheetsHidden: hidden
        });
    }

    setPanesFrozen(frozen: boolean)
    {
        this.setState({
            panesFrozen: frozen
        });
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
                },
//                teachableProps:
//                {
//                    id: TeachableId.DirtyGame,
//                    isWide: true,
//                    title: "Needs updated",
//                    text: "Some part of this game was directly edited, like team name, field, or time. Update the bracket data by clicking on the \"Update Brackets\" button on the top toolbar.",
//                    visibleDelay: 1000,
//                    directionalHint: DirectionalHint.bottomAutoEdge,
//                }
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
                icon: this.m_appContext.AppStateAccess.SheetsHidden ? "View" : "Hide3",
                primaryText: this.m_appContext.AppStateAccess.SheetsHidden ? "Unhide data sheets" : "Hide bracket data sheets",
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
                icon: this.m_appContext.AppStateAccess.DaysFrozen ? "Unlock" : "Lock",
                primaryText: this.m_appContext.AppStateAccess.DaysFrozen ? "Unfreeze days of the week" : "Freeze days of the week rows",
                cursor: "cursorPointer",
                stateChecker: null,
                delegate: async (appContext: IAppContext): Promise<boolean> =>
                {
                    await FreezeDays.toggleDayFreezeClick(appContext);
                    return true;
                }
            });
        listItems.push(
            {
                icon: "Rain",
                primaryText: "Push all games today to the next day (insert a day into the bracket)",
                cursor: "cursorPointer",
                stateChecker: null,
                delegate: async (appContext: IAppContext): Promise<boolean> =>
                {
                    await StructureEditor.insertGameDayForSchedulePushClick(appContext);
                    return true;
                }
            });

        listItems.push(
            {
                icon: "DeleteRows",
                primaryText: "Convert this bracket to a modified double elimination bracket",
                cursor: "cursorPointer",
                stateChecker: null,
                delegate: async (appContext: IAppContext): Promise<boolean> =>
                {
                    await StructureEditor.convertBracketToModifiedDoubleEliminationClick(appContext);
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
                icon: "Play",
                primaryText: "Lucky One Game",
                cursor: "cursorPointer",
                stateChecker: null,
                delegate: async (appContext: IAppContext): Promise<boolean> =>
                {
                    await StructureEditor.luckyOneGame(appContext);
                    return true;
                }
            });

        listItems.push(
            {
                icon: "FastForward",
                primaryText: "Lucky Whole Schedule",
                cursor: "cursorPointer",
                stateChecker: null,
                delegate: async (appContext: IAppContext): Promise<boolean> =>
                {
                    await StructureEditor.luckyWholeSchedule(appContext);
                    return true;
                }
            });

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

    mergeBracketOptions(customOptions: BracketOption[])
    {
        const builtinOptions = BracketDefBuilder.getStaticAvailableBrackets();
        const map = new Map<string, BracketOption>();

        for (let _o of builtinOptions)
            map.set(_o.key, _o);

        for (let _o of customOptions)
            map.set(_o.key, _o);

        const newOptions = [];

        for (let key of map.keys())
            newOptions.push(map.get(key));

        this.setState(
            {
                bracketOptions: newOptions,
                customBracketOptions: customOptions
            }
        );
    }

    componentDidUpdate(prevProps: AppProps, prevState: AppState)
    {
        prevProps;

        if ((this.state.bracketMayHaveDirectEdits || this.state.heroListDirty)
            && !(prevState.bracketMayHaveDirectEdits || prevState.heroListDirty))
        {
            this.postHeroListRebuild();
        }

        if (this.state.rulesMayHaveEdits && !prevState.rulesMayHaveEdits)
        {
            RangeCaches.SetDirty(true);
            this.setState(
                {
                    rulesMayHaveEdits: false
                });
        }

        if ((this.state.panesFrozen != prevState.panesFrozen)
            || (this.state.sheetsHidden != prevState.sheetsHidden))
        {
            this.postUpdateTopToolbar();
        }
    }

    postUpdateTopToolbar()
    {
        this.setState(
            {
                topToolbar: this.buildTopToolbar()
            });
    }

    async postHeroListRebuild()
    {
        await Excel.run(async (ctx) =>
        {
            const context: JsCtx = new JsCtx(ctx);

            await this.rebuildHeroList(context);
        });
    }

    /*----------------------------------------------------------------------------
        %%Function: App.addLogMessage

        Add a log message to the UI
    ----------------------------------------------------------------------------*/

    async rebuildHeroList(context: JsCtx)
    {
        await Dispatcher.ExclusiveDispatchSilent(
            async (ctx) => { await this.rebuildHeroListWork(ctx) }, context);
    }

    /*----------------------------------------------------------------------------
        %%Function: App.rebuildHeroList

        Invalidate the top level hero list (and maybe supporting parameters
        below in the UI)
    ----------------------------------------------------------------------------*/
    async rebuildHeroListWork(context: JsCtx)
    {
        const topLevelTimerName = "rebuildHeroList";

        console.log("RHL: resetting dirty state");
        _TimerStack.pushTimer(topLevelTimerName, true);
        try
        {
            this.setState(
                {
                    bracketMayHaveDirectEdits: false,
                    heroListDirty: false
                });

            const bookmark: string = "rebuildHeroList";
            context.pushTrackingBookmark(bookmark);

            await _TimerStack.timeThisAsync(
                "buildFastFormulaAreas",
                async () =>
                {
                    await FastFormulaAreas.populateAllCaches(context, true);
                });

            await _TimerStack.timeThisAsync(
                "populateBracketManager",
                async () =>
                {
                    await _bracketManager.populateBracketsIfNecessary(context);
                });

            await _TimerStack.timeThisAsync(
                "populateRangeCaches",
                async () =>
                {
                    await RangeCaches.PopulateIfNeeded(context, this.m_appContext.SelectedBracket);
                });

            let format: HeroListFormat;
            let list: HeroListItem[];
            let title: string;

            let games: IBracketGame[];
            await _TimerStack.timeThisAsync(
                "getGamesList",
                async () =>
                {
                    games = await this.getGamesList(context, this.m_appContext, this.m_appContext.SelectedBracket);
                });

            let items: ToolbarItem[] = [];

            await _TimerStack.timeThisAsync(
                "buildToolbars",
                async () =>
                {
                    [format, title, list] = HeroList.buildHeroList(this.m_appContext.WorkbookSetupState, this.mergeBracketOptions.bind(this), this.state.customBracketOptions.length > 0);

                    if (this.m_appContext.WorkbookSetupState == SetupState.Ready)
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
                });

            // update the games list in the state

            AppContext.checkpoint("ihl.9");
            this.setState(
                {
                    heroList: list,
                    heroListFormat: format,
                    heroTitle: title,
                    games: games,
                    mainToolbar: items
                });

            context.releaseCacheObjectsUntil(bookmark);
        }
        catch (e)
        {
            console.log(`rebuildHeroListWork caught: ${e.message}`);
        }
        finally
        {
            _TimerStack.popTimersUntil(topLevelTimerName);
            console.log("RHL: finishing RHL");
        }
    }


    // now have to have the hero list get the games from here as a param, and use that in populating the games.
    async getGamesList(context: JsCtx, appContext: IAppContext, bracket: string): Promise<IBracketGame[]>
    {
        _TimerStack.pushTimer("getGamesList.GetBracketDefinitionData");
        let bracketDef: IBracketDefinitionData = _bracketManager.GetBracketDefinitionData(bracket);

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

    // setup the initial state as well as the initial coaching state
    // (this is our opportunity to figure out what state the workbook
    // is in when the addin is initialized)
    async componentDidMount()
    {
        let setupState: SetupState;
        let bracketChoice: string;

        // now grab the games async and have it update
        await Excel.run(
            async (ctx) =>
            {
                const context = new JsCtx(ctx);

                const customBracketOptions = await SetupBook.getCustomBracketOptions(context, this.m_appContext);
                this.mergeBracketOptions(customBracketOptions);

                [setupState, bracketChoice] = await SetupBook.getSetupState(context);
                if (setupState != SetupState.Ready)
                    this.m_appContext.Teaching.Coachstate = Coachstate.BracketCreation;

                this.m_appContext.SelectedBracket = bracketChoice;
                this.m_appContext.WorkbookSetupState = setupState;

                await RangeCaches.PopulateIfNeeded(context, bracketChoice);

                // set the initial state for frozen and hidden
                const sheet: Excel.Worksheet = context.Ctx.workbook.worksheets.getActiveWorksheet();
                const locationFroze = sheet.freezePanes.getLocationOrNullObject();
                const defSheet = context.Ctx.workbook.worksheets.getItemOrNullObject(BracketDefBuilder.SheetName);
                defSheet.load("visibility");

                await context.sync("freeze and hidden check");
                const frozen = !locationFroze.isNullObject;
                const hidden = !(defSheet.isNullObject || (defSheet.visibility === Excel.SheetVisibility.visible));

                if (this.m_appContext.SelectedBracket == null)
                    this.m_appContext.SelectedBracket = "T8";

                let format: HeroListFormat;
                let list: HeroListItem[];
                let title: string;
        
                [format, title, list] = HeroList.buildHeroList(setupState, this.mergeBracketOptions.bind(this), customBracketOptions.length > 0);
                // figure out our top level menu.... Setup, or bracket editing
                this.setState(
                    {
                        heroListFormat: format,
                        heroList: list,
                        heroTitle: title,
                        games: [],
                        panesFrozen: frozen,
                        sheetsHidden: hidden
                    });

                this.m_appContext.setProgressVisible(true);
                try
                {
                    const context: JsCtx = new JsCtx(ctx);

                    // this is the only blocking wait for rebuildHeroList. BE CAREFUL not to add
                    // more -- they would likely deadlock!
                    await this.rebuildHeroList(context);
                    context.releaseAllCacheObjects();
                }
                catch (e)
                {

                }
                await SetupBook.registerBindingsForEdits(context, this.m_appContext);
                this.m_appContext.setProgressVisible(false);
            });
    }

    /*----------------------------------------------------------------------------
        %%Function: App.updateSelectedBracketChoice

        delegate to update our top level state on the selected choice
        (this is passed to the bracket chooser component)
    ----------------------------------------------------------------------------*/
    updateSelectedBracketChoice(selectedBracket: string)
    {
        this.m_appContext.SelectedBracket = selectedBracket;
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
            if (this.m_appContext.WorkbookSetupState == SetupState.NoBracketChoice
                || this.m_appContext.WorkbookSetupState == SetupState.NoBracketStructure
                || this.m_appContext.WorkbookSetupState == SetupState.NoBracketData)
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
                                            bracketOptions={this.state.bracketOptions} initialBracket={this.m_appContext.SelectedBracket}/>
                        </Teachable>

                    </div>
                );
            }
            else
                return (<span/>);
        }

        const games = this.m_appContext.WorkbookSetupState == SetupState.Ready
                          ? (<Games />)
                          : "";

        const maybeToolbar =
            this.m_appContext.WorkbookSetupState == SetupState.Ready
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



        const customOptionText =
            this.state.customBracketOptions.length > 0
                ? (<p>If you want to use a custom-built bracket, you can load the bracket by clicking on <em>Load Custom Brackets</em></p>)
                : (<span />);

        const welcome = this.m_appContext.WorkbookSetupState == SetupState.Ready || this.m_appContext.WorkbookSetupState == "U"
            ? ""
            : (
                <Stack.Item styles={welcomeItemStyle}>
                    <h1>Welcome!</h1>
                    <p>
                    </p>
                    <p>To get started, choose the size of your bracket above and then click
                        the <em>Build This Bracket!</em> button!</p>
                    {customOptionText}
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