import * as React from "react";
import { DefaultButton } from "@fluentui/react";
import Header from "./Header";
import HeroList, { HeroListItem} from "./HeroList";
import Progress from "./Progress";
import { SetupState } from "../../setup";
import { SetupBook } from "../../setup";
import { IAppContext, AppContext } from "../../AppContext";

/* global console, Excel, require  */

export interface AppProps
{
    title: string;
    isOfficeInitialized: boolean;
}

export interface AppState
{
    listItems: HeroListItem[];
//    setupState: SetupState;
    errorMessage: string;
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
//            setupState: SetupState.NoBracketData,
            errorMessage: "",
        };

        this.m_appContext = new AppContext();
        this.m_appContext.setDelegates(
            this.addLogMessage.bind(this),
            this.invalidateHeroList.bind(this));
    }

    addLogMessage(message: string)
    {
        this.setState({ errorMessage: message });
    }
    
    async invalidateHeroList(ctx: any)
    {
        this.setState({ listItems: await this.buildHeroList(ctx) });
    }

    async buildHeroList(ctx: any): Promise<HeroListItem[]>
    {
        let listItems: HeroListItem[] = [];
        let setupState: SetupState;

        if (ctx != null)
            setupState = await SetupBook.getWorkbookSetupState(ctx);
        else
            setupState = await Excel.run(async (context) => SetupBook.getWorkbookSetupState(context));

        if (setupState == SetupState.NoBracketData)
        {
            listItems.push(
                {
                    icon: "Ribbon",
                    primaryText: "Initialize Brackets",
                    cursor: "cursorPointer",
                    delegate: SetupBook.buildBracketWorkbook,
                });
        }

        return listItems;
    }

    async componentDidMount()
    {
        // figure out our top level menu.... Setup, or bracket editing
        this.setState(
            {
                listItems: await this.buildHeroList(null),
                 /*
listItems: [
                                    {
                                        icon: "Ribbon",
                                        primaryText: "Achieve more with Office integration",
                                        delegate: null
                                    },
                                    {
                                        icon: "Unlock",
                                        primaryText: "Unlock features and functionality",
                                        delegate: null
                                    },
                                    {
                                        icon: "Design",
                                        primaryText: "Create and visualize like a pro",
                                        delegate: null
                                    },
                                ],
                            */
//                setupState: setupState,
            });
    }

    click = async () =>
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

                // Update the fill color
                range.format.fill.color = "blue";

                await context.sync();
                console.log(`The range address was ${range.address}.`);
            });
            
        }
        catch (error)
        {
            console.error(error);
        }
    };

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

        return (
            <div className="ms-welcome">
                <Header logo={require("./../../../assets/logo-filled.png")} title={this.props.title} message="Hiya"/>
                <HeroList message="Setup a new bracket workbook!" items={this.state.listItems} appContext={this.m_appContext}>
                    <p className="ms-font-l">
                        Modify the source files, then click <b>Run</b>.
                    </p>
                    <DefaultButton className="ms-welcome__action" iconProps={{ iconName: "ChevronRight" }} onClick={
this.click}>
                        Run
                    </DefaultButton>
                </HeroList>
                <div>
                    {this.state.errorMessage}
                </div>
            </div>
        );
    }
}