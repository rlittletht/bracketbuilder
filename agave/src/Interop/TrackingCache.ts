import { JsCtx } from "./JsCtx";

export interface PopulateCacheDelegate
{
    (context: JsCtx): Promise<any>;
}

export class TrackingCache
{
    m_trackedItems: Map<string, any> = new Map<string, any>();
    m_order: string[] = [];

    pushBookmark(bookmark: string)
    {
        this.m_order.push(`__bkmk:${bookmark}`);
    }

    addTrackedItem(context: JsCtx, key: string, item: any)
    {
//        if (this.m_trackedItems.has(key))
//        {
//            console.log(`tracking an item already tracked: [${key}]->${item}`)
//        }

//        console.log(`adding tracked item key ${key}, type ${typeof (item)}`);
        try
        {
            context.Ctx.trackedObjects.add(item);
        }
        catch (e)
        {
            console.log(`caught ${e} trying to track ${key}`);
            return; // don't record this as tracked...'
        }
        this.m_trackedItems.set(key, item);
        this.m_order.push(key);
    }

    releaseUntil(context: JsCtx, bookmark: string)
    {
        bookmark = `__bkmk:${bookmark}`;

        while (this.m_order.length > 0)
        {
            const key: string = this.m_order.pop();

            if (bookmark != null && bookmark == key)
                return;

            if (key.startsWith("__bkmk"))
            {
//                console.log(`skipping bookmark: ${key}`);
                continue;
            }

            const item: any = this.m_trackedItems.get(key);

//            console.log(`releasing tracked item key ${key}, type ${typeof (item)}`);
            context.Ctx.trackedObjects.remove(item);
            this.m_trackedItems.set(key, null);
        }

        this.m_trackedItems.clear();
    }

    releaseAll(context: JsCtx)
    {
        this.releaseUntil(context, null);
    }

    getTrackedItemOrNull(key: string): any
    {
        if (this.m_trackedItems.has(key))
            return this.m_trackedItems.get(key);

        return null;
    }

    async getTrackedItem(context: JsCtx, key: string, del: PopulateCacheDelegate): Promise<any>
    {
        let val: any = this.getTrackedItemOrNull(key);

        if (val != null)
            return val;

        val = await del(context);

        if (val != null)
            this.addTrackedItem(context, key, val);

        return val;
    }

    static getTrackedItemOrNullFromCache(cache: TrackingCache, key: string): any
    {
        if (cache == null)
            return null;

        return cache.getTrackedItemOrNull(key);
    }

    static async getTrackedItemFromCache(cache: TrackingCache, context: JsCtx, key: string, del: PopulateCacheDelegate): Promise<any>
    {
        if (cache == null)
            return null;

        return await cache.getTrackedItem(context, key, del);
    }
}