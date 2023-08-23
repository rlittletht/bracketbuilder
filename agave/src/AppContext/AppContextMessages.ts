import { IHelpInfo } from "../Coaching/HelpInfo";
import { MessageBarType } from '@fluentui/react';

export interface ClearMessageDelegate
{
    (): void;
}

export interface SetMessageDelegate
{
    (message: string[], messageType: MessageBarType, helpInfo?: IHelpInfo, msecVisible?: number): void;
}


export interface IAppContextMessages
{
    // message and error update the MessageBar for the user (with optional
    // timeout to erase them)
    message(message: string[], helpInfo?: IHelpInfo, msecVisible?: number);
    error(message: string[], helpInfo?: IHelpInfo, msecVisible?: number);
    clearMessage();

    setMessageDelegates(setDelegate: SetMessageDelegate, clearDelegate: ClearMessageDelegate): void;
}

export class AppContextMessages implements IAppContextMessages
{
    m_setMessageDelegate: SetMessageDelegate;
    m_clearMessageDelegate: ClearMessageDelegate;

    message(message: string[], helpInfo?: IHelpInfo, msecVisible?: number)
    {
        if (this.m_setMessageDelegate != null)
            this.m_setMessageDelegate(message, MessageBarType.info, helpInfo, msecVisible);
    }

    error(message: string[], helpInfo?: IHelpInfo, msecVisible?: number)
    {
        if (this.m_setMessageDelegate != null)
            this.m_setMessageDelegate(message, MessageBarType.error, helpInfo, msecVisible);
    }

    clearMessage()
    {
        if (this.m_clearMessageDelegate)
            this.m_clearMessageDelegate();
    }

    setMessageDelegates(addMessageDelegate: SetMessageDelegate, clearMessageDelagate: ClearMessageDelegate)
    {
        this.m_setMessageDelegate = addMessageDelegate;
        this.m_clearMessageDelegate = clearMessageDelagate;
    }
}