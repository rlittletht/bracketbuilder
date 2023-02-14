
import { Mutex, MutexInterface, Semaphore, SemaphoreInterface, withTimeout } from 'async-mutex';
import { IAppContext } from "../AppContext";
import { JsCtx } from "../Interop/JsCtx";


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
            await delegate(context);
        }
        catch (error)
        {
            appContext.log(`Caught: ${error}`);
        }
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