import { IBracketGame } from "./BracketEditor/BracketGame";

export interface IAppContext
{
    log(message: string);
    /*async*/ invalidateHeroList(ctx: any);
    getSelectedBracket();
    getGames();
}

export interface AddLogMessageDelegate
{
    (message: string): void;
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

    log(message: string)
    {
        if (this.m_addLogMessageDelegate != null)
            this.m_addLogMessageDelegate(message);
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
}