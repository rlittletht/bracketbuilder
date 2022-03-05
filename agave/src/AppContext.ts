
export interface IAppContext
{
    log(message: string);
    invalidateHeroList(ctx: any);
    getSelectedBracket();
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

export class AppContext implements IAppContext
{
    m_addLogMessageDelegate: AddLogMessageDelegate;
    m_invalidateHeroListDelegate: InvalidateHeroListDelegate;
    m_getSelectedBracket: GetSelectedBracketDelegate;

    log(message: string)
    {
        if (this.m_addLogMessageDelegate != null)
            this.m_addLogMessageDelegate(message);
    }

    invalidateHeroList(ctx: any)
    {
        if (this.m_invalidateHeroListDelegate)
            this.m_invalidateHeroListDelegate(ctx);
    }

    getSelectedBracket(): string
    {
        if (this.m_getSelectedBracket)
            return this.m_getSelectedBracket();

        return "";
    }

    setDelegates(
        addMessageDelegate: AddLogMessageDelegate,
        invalidateHeroList: InvalidateHeroListDelegate,
        getSelectedBracket: GetSelectedBracketDelegate
        )
    {
        this.m_addLogMessageDelegate = addMessageDelegate;
        this.m_invalidateHeroListDelegate = invalidateHeroList;
        this.m_getSelectedBracket = getSelectedBracket;
    }
}