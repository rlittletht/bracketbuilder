
import { Mutex, MutexInterface, Semaphore, SemaphoreInterface, withTimeout } from 'async-mutex';
import { IAppContext } from "../AppContext/AppContext";
import { JsCtx } from "../Interop/JsCtx";
import { HelpTopic } from "../HelpInfo";
import { StatusBox } from "../taskpane/components/StatusBox";
import { TrError } from "../Exceptions";


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

                        context.releaseAllTrackedItems();
                    })
            });
    }

}