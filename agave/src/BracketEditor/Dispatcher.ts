
import { Mutex } from 'async-mutex';
import { IAppContext } from "../AppContext/AppContext";
import { HelpTopic } from "../Coaching/HelpInfo";
import { TrError } from "../Exceptions";
import { JsCtx } from "../Interop/JsCtx";
import { SetupState } from "../Setup";
import { StatusBox } from "../taskpane/components/StatusBox";


// NOTE on mutex use. Most of the stuff we do is asynchronous, and while
// javascript only runs on one thread, that doesn't save us from threading
// issues. Every time we await something, we are waiting for a signal to
// wake us up again. While we are waiting, the user could click another
// button and start another command. That means that we could start an
// undo operation WHILE another undo operation is running (because the
// first undo hit an await and is waiting to be signalled)

// to prevent this problem, we use a mutex to prevent multiple commands
// from running at the same time.
export const _mutex = new Mutex();

export interface DispatchWithCatchDelegate
{
    (context: JsCtx): void;
}

export class Dispatcher
{
    static RequireBracketReady(appContext: IAppContext): boolean
    {
        if (appContext.WorkbookSetupState == SetupState.Ready)
            return true;

        appContext.Messages.error(
            [
                "I'm sorry, this command isn't available until the Bracket has been created",
                "To get started, choose the number of teams in your tournament and then click the 'Build This Bracket' button"
            ],
            { topic: HelpTopic.FAQ_BracketNotReady });

        return false;
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.DispatchWithCatch

        This dispatches the given delegate and catches any exceptions, then
        reports them in the log (or output)
    ----------------------------------------------------------------------------*/
    static async DispatchWithCatch(delegate: DispatchWithCatchDelegate, appContext: IAppContext, context: JsCtx)
    {
        try
        {
            appContext.setProgressVisible(true);
            await delegate(context);
        }
        catch (error)
        {
            if (error instanceof TrError)
            {
                appContext.Messages.error(error._Messages, { topic: error._HelpInfo});
            }
            else
            {
                appContext.Messages.error(StatusBox.linesFromError(error), { topic: HelpTopic.FAQ_Exceptions });
            }
        }

        appContext.setProgressVisible(false);
    }

    /*----------------------------------------------------------------------------
        %%Function: StructureEditor.ExclusiveDispatchWithCatch

        This will dispatch the given delegate in the context of Excel.run,
        and it will catch any exceptions.

        If any other dispatches are already happening, then this will wait for
        them to finish first.
    ----------------------------------------------------------------------------*/
    static async ExclusiveDispatchWithCatch(
        delegate: DispatchWithCatchDelegate,
        appContext: IAppContext)
    {
        await _mutex.runExclusive(
            async () =>
            {
                await Excel.run(
                    async (ctx) =>
                    {
                        appContext.Messages.clearMessage();
                        appContext.Teaching.popTempCoachstateIfNecessary();
                        appContext.Teaching.clearCoachmark();

                        const context: JsCtx = new JsCtx(ctx);

                        await this.DispatchWithCatch(
                            delegate,
                            appContext,
                            context);

                        context.releaseAllCacheObjects();
                    })
            });
    }

    /*----------------------------------------------------------------------------
        %%Function: Dispatcher.ExclusiveDispatchSilent

        Same as ExclusiveDispatchWithCatch, but doesn't clear coach
        states/messages
    ----------------------------------------------------------------------------*/
    static async ExclusiveDispatchSilent(delegate: DispatchWithCatchDelegate, context: JsCtx)
    {
        console.log("before exclusive");
        try
        {
            await _mutex.runExclusive(
                async () =>
                {
                    console.log("inside exclusive");
                    await delegate(context);
                });
        }
        catch (e)
        {
            console.log(`caught: ${e.message}`);
        }

        console.log("after exclusive");
    }
}