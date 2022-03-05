
export interface IAppContext
{
    log(message: string);
    invalidateHeroList(ctx: any);
}

export interface AddLogMessageDelegate
{
    (message: string): void;
}

export interface InvalidateHeroListDelegate
{
    (ctx: any): void;
}

export class AppContext implements IAppContext
{
    m_addLogMessageDelegate: AddLogMessageDelegate;
    m_invalidateHeroListDelegate: InvalidateHeroListDelegate;

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

    setDelegates(
        addMessageDelegate: AddLogMessageDelegate,
        invalidateHeroList: InvalidateHeroListDelegate)
    {
        this.m_addLogMessageDelegate = addMessageDelegate;
        this.m_invalidateHeroListDelegate = invalidateHeroList;
    }
}