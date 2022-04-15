import * as React from "react";
import { DefaultButton } from "@fluentui/react";
import { ComboBox } from "@fluentui/react";

import Header from "./Header";
import HeroList, { HeroListItem } from "./HeroList";
import Progress from "./Progress";
import { SetupState } from "../../Setup";
import { SetupBook } from "../../Setup";
import { IAppContext, AppContext } from "../../AppContext";
import BracketChooser, { UpdateBracketChoiceDelegate } from "./BracketChooser";
import { BracketStructureBuilder, BracketOption } from "./../../Brackets/BracketStructureBuilder";
import GameItem from "./GameItem";
import Games from "./Games";
import { StructureEditor } from "../../BracketEditor/StructureEditor";

/* global console, Excel, require  */

export interface AppProps
{
    title: string;
    isOfficeInitialized: boolean;
}

export interface AppState
{
    listItems: HeroListItem[];
    setupState: SetupState;
    errorMessage: string;
    selectedBracket: string;
    bracketOptions: BracketOption[];
}

export default class App extends React.Component<AppProps, AppState>
{
    m_appContext: AppContext;

    constructor(props, context)
    {
        super(props, context);
        this.state =
        {
            listItems: [],
            setupState: SetupState.NoBracketStructure,
            errorMessage: "",
            selectedBracket: "",
            bracketOptions: BracketStructureBuilder.getStaticAvailableBrackets(),
        };

        this.m_appContext = new AppContext();
        this.m_appContext.setDelegates(
            this.addLogMessage.bind(this),
            this.invalidateHeroList.bind(this),
            this.getSelectedBracket.bind(this));
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
        let setupState: SetupState = await(this.getSetupState(ctx));

        this.setState({
            listItems: this.buildHeroList(setupState),
            setupState: setupState
        });
    }

    /*----------------------------------------------------------------------------
        %%Function: App.getSetupState

        Get the setup state of the workbook
    ----------------------------------------------------------------------------*/
    async getSetupState(ctx: any): Promise<SetupState>
    {
        let setupState: SetupState;

        if (ctx != null)
            setupState = await SetupBook.getWorkbookSetupState(ctx);
        else
            setupState = await Excel.run(async (context) => SetupBook.getWorkbookSetupState(context));

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
    buildHeroList(setupState: SetupState): HeroListItem[]
    {
        let listItems: HeroListItem[] = [];

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

        if (setupState == SetupState.NoBracketChoice ||
            setupState == SetupState.NoBracketStructure ||
            setupState == SetupState.NoBracketData)
        {
            listItems.push(
                {
                    icon: "Ribbon",
                    primaryText: "Build a bracket",
                    cursor: "cursorPointer",
                    delegate: SetupBook.buildSpecificBracket,
                });
        }

        return listItems;
    }

    async componentDidMount()
    {
        let setupState: SetupState = await (this.getSetupState(null));

        // figure out our top level menu.... Setup, or bracket editing
        this.setState(
            {
                listItems: await this.buildHeroList(setupState),
                selectedBracket: "",
                setupState: setupState,
            });
    }

    async click()
    {
        try
        {
            console.log("testing");
            await Excel.run(async (context) =>
            {
                console.log("state: " + await(SetupBook.getWorkbookSetupState(context)));
                /**
                 * Insert your Excel code here
                 */
                const range = context.workbook.getSelectedRange();

                // Read the range address
                range.load("address");
                range.format.fill.load("color");
                await context.sync();
                console.log(`The color is ${range.format.fill.color}.`);


                // Update the fill color
//                range.format.fill.color = "blue";
                StructureEditor.formatConnectingLineRange(context, range);

                await context.sync();
                console.log(`The range address was ${range.address}.`);
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
                <Header logo={require("./../../../assets/logo-filled.png")} title={this.props.title} message="Hiya"/>
                <div>
                    {this.state.errorMessage}
                </div>
                <HeroList message="Setup a new bracket workbook!" items={this.state.listItems} appContext={this.m_appContext}>
                    <p className="ms-font-l">
                        Modify the source files, then click <b>Run</b>.
                    </p>
                    <DefaultButton className="ms-welcome__action" iconProps={{ iconName: "ChevronRight" }} onClick={
this.click}>
                        Run
                    </DefaultButton>
                    {insertBracketChooserMaybe()}
                </HeroList>
                {games}
            </div>
        );
    }
}