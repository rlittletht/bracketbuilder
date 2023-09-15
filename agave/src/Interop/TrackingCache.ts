import { s_staticConfig } from "../StaticConfig";
import { JsCtx } from "./JsCtx";

export interface PopulateCacheDelegate
{
    (context: JsCtx): Promise<{ type: ObjectType, o: any }>;
}

export interface PopulateCacheWithArrayDelegate
{
    (context: JsCtx): Promise<{ type: ObjectType, o: any }[]>;
}

export class ObjectType
{
    static Null = null;
    static JsObject = "JS";
    static TrObject = "TR";
}

export class CacheObject
{
    type: ObjectType;
    o: any;

    constructor(type: ObjectType, o: any)
    {
        this.type = type;
        this.o = o;
    }
}

class CacheItem
{
    m_objects: CacheObject[];

    get Objects(): CacheObject[] { return this.m_objects; }

    static CreateFromObject(o: CacheObject): CacheItem
    {
        const cacheItem: CacheItem = new CacheItem();

        cacheItem.m_objects = [o];
        return cacheItem;
    }

    static CreateFromObjects(objects: CacheObject[]): CacheItem
    {
        const cacheItem: CacheItem = new CacheItem();

        cacheItem.m_objects = [...objects];

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
        if (s_staticConfig.logTrackingCache)
            console.log(`push bookmark: ${bkmk}`);
    }

    addCacheObjects(context: JsCtx, key: string, items: CacheObject[])
    {
//        if (this.m_trackedItems.has(key))
//        {
//            console.log(`tracking an item already tracked: [${key}]->${item}`)
//        }

        for (let item of items)
        {
            if (s_staticConfig.logTrackingCache)
                console.log(`adding tracked item key ${key}, type ${typeof (item.o)}`);

            if (item.type != ObjectType.JsObject)
                continue;
            
            try
            {
                context.Ctx.trackedObjects.add(item.o);
            }
            catch (e)
            {
                if (s_staticConfig.logTrackingCache)
                    console.log(`caught ${e} trying to track ${key}`);
                return; // don't record this as tracked...'
            }
        }
        this.m_trackedItems.set(key, CacheItem.CreateFromObjects(items));
        this.m_order.push(key);
    }

    addCacheObject(context: JsCtx, key: string, o: CacheObject)
    {
        this.addCacheObjects(context, key, [o])
    }

    releaseCacheObjects(context: JsCtx, key: string)
    {
        const item: CacheItem = this.m_trackedItems.get(key);

        // item could still be null here -- it might have been released
        if (item == null)
            return;

        if (s_staticConfig.logTrackingCache)
            console.log(`releasing tracked item key ${key}, type ${typeof (item)}`);

        for (let object of item.Objects)
        {
            if (object.type == ObjectType.JsObject)
                context.Ctx.trackedObjects.remove(object.o);
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
                if (s_staticConfig.logTrackingCache)
                    console.log(`released until: ${bookmark}`);
                return;
            }

            if (key.startsWith("__bkmk"))
            {
//                console.log(`skipping bookmark: ${key}`);
                continue;
            }

            this.releaseCacheObjects(context, key);
        }

        this.m_trackedItems.clear();
    }

    releaseAll(context: JsCtx)
    {
        this.releaseUntil(context, null);
    }

    /*----------------------------------------------------------------------------
        %%Function: TrackingCache.getCacheObjectOrNull

        returns a single tracked object. if there are multipe objects associated
        with this key, it will return the first one.
    ----------------------------------------------------------------------------*/
    getCacheObjectOrNull(key: string): CacheObject | null
    {
        if (this.m_trackedItems.has(key))
        {
            const item: CacheItem = this.m_trackedItems.get(key);

            // item could still be null here -- it might have been released
            if (item == null)
                return null;

            return item.Objects[0];
        }

        return null;
    }

    getCacheObjectsOrNull(key: string): CacheObject[] | null
    {
        if (this.m_trackedItems.has(key))
        {
            const item:CacheItem = this.m_trackedItems.get(key);

            // item could still be null here -- it might have been released
            if (item == null)
                return null;

            return item.Objects;
        }

        return null;
    }


    async getCacheItemOrPopulate(context: JsCtx, key: string, del: PopulateCacheDelegate): Promise<CacheObject | null>
    {
        let val: CacheObject = this.getCacheObjectOrNull(key);

        if (val != null)
            return val;

        val = await del(context);

        if (val && val.type != ObjectType.Null)
            this.addCacheObject(context, key, val);

        return val;
    }

    async getCacheObjectsOrPopulate(context: JsCtx, key: string, del: PopulateCacheWithArrayDelegate): Promise<CacheObject[] | null>
    {
        let vals: CacheObject[] = this.getCacheObjectsOrNull(key);

        if (vals != null)
            return vals;

        vals = await del(context);

        if (vals != null)
            this.addCacheObjects(context, key, vals);

        return vals;
    }

    compareKeyOrder(left: string, right: string): number
    {
        let iLeft;
        let iRight;

        for (let i = 0; i < this.m_order.length; i++)
        {
            const check = this.m_order[i];

            if (check == left)
                iLeft = i;
            if (check == right)
                iRight = i;
        }

        if (iLeft == iRight)
            return 0;

        if (iLeft == undefined)
            return -iRight;

        if (iRight == undefined)
            return iLeft;
            
        return iLeft - iRight;
    }
}