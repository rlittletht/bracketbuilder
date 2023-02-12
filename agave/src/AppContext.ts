import { IBracketGame } from "./BracketEditor/BracketGame";
import { PerfTimer } from "./PerfTimer";

export interface IAppContext
{
    log(message: string);
    logTimeout(message: string, msecVisible: number);
    logError(message: string, msecVisible: number);
    get Timer(): PerfTimer;
    /*async*/ invalidateHeroList(ctx: any);
    getSelectedBracket();
    getGames();
}

export interface AddLogMessageDelegate
{
    (message: string, msecVisible: number): void;
}

export interface InvalidateHeroListDelegate
{
    (ctx: any): void;
}

export interface GetSelectedBracketDelegate
{
    (): string;
}

export interface GetGamesDelegate
{
    (): IBracketGame[];
}

export class AppContext implements IAppContext
{
    m_addLogMessageDelegate: AddLogMessageDelegate;
    m_invalidateHeroListDelegate: InvalidateHeroListDelegate;
    m_getSelectedBracket: GetSelectedBracketDelegate;
    m_getGames: GetGamesDelegate;
    m_perfTimer: PerfTimer = new PerfTimer();

    get Timer(): PerfTimer { return this.m_perfTimer; }

    log(message: string, msecVisible: number = 0)
    {
        if (this.m_addLogMessageDelegate != null)
            this.m_addLogMessageDelegate(message, msecVisible);
    }

    logTimeout(message: string, msecVisible: number)
    {
        if (this.m_addLogMessageDelegate != null)
            this.m_addLogMessageDelegate(message, msecVisible);
    }

    logError(message: string, msecVisible: number = 0)
    {
        if (this.m_addLogMessageDelegate != null)
            this.m_addLogMessageDelegate(message, msecVisible);
    }

    async invalidateHeroList(ctx: any)
    {
        if (this.m_invalidateHeroListDelegate)
            await this.m_invalidateHeroListDelegate(ctx);
    }

    getSelectedBracket(): string
    {
        if (this.m_getSelectedBracket)
            return this.m_getSelectedBracket();

        return "";
    }

    getGames(): IBracketGame[]
    {
        if (this.m_getGames)
            return this.m_getGames();

        return [];
    }

    setDelegates(
        addMessageDelegate: AddLogMessageDelegate,
        invalidateHeroList: InvalidateHeroListDelegate,
        getSelectedBracket: GetSelectedBracketDelegate,
        getGames: GetGamesDelegate
        )
    {
        this.m_addLogMessageDelegate = addMessageDelegate;
        this.m_invalidateHeroListDelegate = invalidateHeroList;
        this.m_getSelectedBracket = getSelectedBracket;
        this.m_getGames = getGames;
    }

    setLogMessageDelegate(addMessageDelegate: AddLogMessageDelegate)
    {
        this.m_addLogMessageDelegate = addMessageDelegate;
    }

    static checkpoint(log: string)
    {
        log;
        // console.log(log);
    }
}