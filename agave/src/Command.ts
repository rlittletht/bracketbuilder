import { IAppContext } from "./AppContext/AppContext";
import { IBracketGame } from "./BracketEditor/BracketGame";

export interface CommandDelegate
{
    (appContext: IAppContext, game: IBracketGame): Promise<boolean>;
}

// this is a top level command
export class Command
{
    m_appContext: IAppContext;
    m_delegate: CommandDelegate;
    m_game: IBracketGame;

    constructor(appContext: IAppContext, delegate: CommandDelegate, game: IBracketGame)
    {
        this.m_appContext = appContext;
        this.m_delegate = delegate;
        this.m_game = game;
    }

    async execute()
    {
        this.m_delegate(this.m_appContext, this.m_game);
    }
}