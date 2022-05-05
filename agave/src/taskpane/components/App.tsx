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
import { BracketDefinition } from "../../Brackets/BracketDefinitions";

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
}

export default class App extends React.Component<AppProps, AppState>
{
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
    };

        this.m_appContext = new AppContext();
        this.m_appContext.setDelegates(
            this.addLogMessage.bind(this),
            this.invalidateHeroList.bind(this),
            this.getSelectedBracket.bind(this),
            this.getGames.bind(this));
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
        [format, title, list] = this.buildHeroList(setupState);
        AppContext.checkpoint("ihl.8");

        // update the games list

        AppContext.checkpoint("ihl.9");
        this.setState({
            heroList: list,
            heroListFormat: format,
            heroTitle: title,
            setupState: setupState,
            games: games,
            selectedBracket: bracketChoice });
    }

    // now have to have the hero list get the games from here as a param, and use that in populating the games.
    async getGamesList(ctx: any, bracket: string): Promise<IBracketGame[]>
    {
        let bracketDef: BracketDefinition = BracketStructureBuilder.getBracketDefinition(`${bracket}Bracket`);

        if (bracketDef == null)
            return [];

        let games: IBracketGame[] = [];

        for (let i = 0; i < bracketDef.games.length; i++)
        {
            let temp: IBracketGame = await BracketGame.CreateFromGame(ctx, bracket, i);
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

    /*----------------------------------------------------------------------------
        %%Function: App.buildHeroList

        Build the hero list of commands
    ----------------------------------------------------------------------------*/
    buildHeroList(setupState: SetupState): [HeroListFormat, string, HeroListItem[]]
    {
        let listItems: HeroListItem[] = [];

        if (setupState == SetupState.Ready)
        {
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
            listItems.push(
                {
                    icon: "RemoveEvent",
                    primaryText: "Remove Game from bracket",
                    cursor: "cursorPointer",
                    delegate: null
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
            listItems.push(
                {
                    icon: "AlertSolid",
                    primaryText: "Test Grid",
                    cursor: "cursorPointer",
                    delegate: async (appContext: IAppContext): Promise<boolean> =>
                    {
                        await StructureEditor.testGridClick(appContext);
                        return true;
                    }
                });
            return [HeroListFormat.HorizontalRibbon, "Build your bracket!", listItems];
        }

        if (setupState == SetupState.NoBracketStructure)
        {
            listItems.push(
                {
                    icon: "Ribbon",
                    primaryText: "Initialize Brackets",
                    cursor: "cursorPointer",
                    delegate: SetupBook.buildBracketStructureWorksheet,
                });
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

    async componentDidMount()
    {
        let setupState: SetupState = await (this.getSetupState(null));
        let format: HeroListFormat;
        let list: HeroListItem[];
        let title: string;

        [format, title, list] = this.buildHeroList(setupState);
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
                    logo={require("./../../../assets/logo-filled.png")}
                    message="Please sideload your addin to see app body."/>
            );
        }

        let insertBracketChooserMaybe = () =>
        {
            if (this.state.setupState == SetupState.NoBracketChoice ||
                this.state.setupState == SetupState.NoBracketStructure)
            {
                return (
                    <BracketChooser
                        updateBracketChoiceDelegate={this.updateSelectedBracketChoice.bind(this)}
                        bracketOptions={this.state.bracketOptions}/>
                );
            }
            else
                return (<span/>);
        }

        const games = this.state.setupState == SetupState.Ready
                          ? (<Games appContext={this.m_appContext} bracketName="T9"/>)
                          : "";

        return (
            <div className="ms-welcome">
                <div>
                    {this.state.errorMessage}
                </div>
                <HeroList message={this.state.heroTitle} items={this.state.heroList} appContext={this.m_appContext} heroListFormat={this.state.heroListFormat}>
                    {insertBracketChooserMaybe()}
                </HeroList>
                {games}
                <p className="ms-font-l">
                    Modify the source files, then click <b>Run</b>.
                </p>
                <DefaultButton className="ms-welcome__action" iconProps={{ iconName: "ChevronRight" }} onClick={
                    this.click}>
                    Run
                </DefaultButton>
            </div>
        );
    }
}