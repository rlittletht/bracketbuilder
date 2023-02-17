import { JsCtx } from "./JsCtx";

export interface PopulateCacheDelegate
{
    (context: JsCtx): Promise<any>;
}

export interface PopulateCacheWithArrayDelegate
{
    (context: JsCtx): Promise<any[]>;
}

class CacheItem
{
    m_objects: any[];

    get Objects(): any[] { return this.m_objects; }

    static CreateFromObject(object: any): CacheItem
    {
        const cacheItem: CacheItem = new CacheItem();

        cacheItem.m_objects = [object];
        return cacheItem;
    }

    static CreateFromObjects(objects: any[]): CacheItem
    {
        const cacheItem: CacheItem = new CacheItem();

        cacheItem.m_objects = [];
        for (let object of objects)
            cacheItem.m_objects.push(object);

        return cacheItem;
    }
}

export class TrackingCache
{
    m_trackedItems: Map<string, any> = new Map<string, CacheItem>();
    m_order: string[] = [];

    pushBookmark(bookmark: string)
    {
        const bkmk: string = `__bkmk:${bookmark}`;

        this.m_order.push(bkmk);
        console.log(`push bookmark: ${bkmk}`);
    }

    addTrackedItems(context: JsCtx, key: string, items: any[])
    {
//        if (this.m_trackedItems.has(key))
//        {
//            console.log(`tracking an item already tracked: [${key}]->${item}`)
//        }

//        console.log(`adding tracked item key ${key}, type ${typeof (item)}`);
        for (let item of items)
        {
            try
            {
                context.Ctx.trackedObjects.add(item);
            }
            catch (e)
            {
                console.log(`caught ${e} trying to track ${key}`);
                return; // don't record this as tracked...'
            }
        }
        this.m_trackedItems.set(key, CacheItem.CreateFromObjects(items));
        this.m_order.push(key);
    }

    addTrackedItem(context: JsCtx, key: string, item: any)
    {
        this.addTrackedItems(context, key, [item])
    }

    releaseItems(context: JsCtx, key: string)
    {
        const item: CacheItem = this.m_trackedItems.get(key);

        //            console.log(`releasing tracked item key ${key}, type ${typeof (item)}`);
        for (let object of item.Objects)
        {
            context.Ctx.trackedObjects.remove(object);
        }

        this.m_trackedItems.set(key, null);
    }

    releaseUntil(context: JsCtx, bookmark: string)
    {
        bookmark = `__bkmk:${bookmark}`;

        while (this.m_order.length > 0)
        {
            const key: string = this.m_order.pop();

            if (bookmark != null && bookmark == key)
            {
                console.log(`released until: ${bookmark}`);
                return;
            }

            if (key.startsWith("__bkmk"))
            {
//                console.log(`skipping bookmark: ${key}`);
                continue;
            }

            this.releaseItems(context, key);
        }

        this.m_trackedItems.clear();
    }

    releaseAll(context: JsCtx)
    {
        this.releaseUntil(context, null);
    }

    /*----------------------------------------------------------------------------
        %%Function: TrackingCache.getTrackedItemOrNull

        returns a single tracked object. if there are multipe objects associated
        with this key, it will return the first one.
    ----------------------------------------------------------------------------*/
    getTrackedItemOrNull(key: string): any
    {
        if (this.m_trackedItems.has(key))
        {
            const item: CacheItem = this.m_trackedItems.get(key);

            if (item == null)
                return null;

            return item.Objects[0];
        }

        return null;
    }

    getTrackedItemsOrNull(key: string): any[]
    {
        if (this.m_trackedItems.has(key))
        {
            const item:CacheItem = this.m_trackedItems.get(key);

            if (item == null)
                return null;

            return item.Objects;
        }
            
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

    async getTrackedItems(context: JsCtx, key: string, del: PopulateCacheWithArrayDelegate): Promise<any[]>
    {
        let val: any[] = this.getTrackedItemsOrNull(key);

        if (val != null)
            return val;

        const vals: any[] = await del(context);

        if (vals != null)
            this.addTrackedItems(context, key, vals);

        return val;
    }
}