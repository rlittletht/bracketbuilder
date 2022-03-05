
export interface ILogging
{
    log(message: string);
}

export interface AddLogMessageDelegate
{
    (message: string): void;
}

export class Logging implements ILogging
{
    m_addLogMessageDelegate: AddLogMessageDelegate;

    log(message: string)
    {
        if (this.m_addLogMessageDelegate != null)
            this.m_addLogMessageDelegate(message);
    }

    setDelegate(addMessageDelegate: AddLogMessageDelegate)
    {
        this.m_addLogMessageDelegate = addMessageDelegate;
    }
}