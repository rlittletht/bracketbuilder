import { _TimerStack } from "../PerfTimer";
import { s_staticConfig } from "../StaticConfig";
import { CacheObject, PopulateCacheDelegate, PopulateCacheWithArrayDelegate, TrackingCache } from "./TrackingCache";

export class JsCtx
{
    m_ctx: any;
    m_cache: TrackingCache;

    constructor(ctx: any)
    {
        this.m_ctx = ctx;
        this.m_cache = new TrackingCache();
        if (s_staticConfig.logTrackingCache)
            console.log("------ New context");
    }

    get Ctx(): any { return this.m_ctx; }

    async sync(name?: string)
    {
        // this is an explicit if to allow easier breakpoints
        if (name == undefined || name == null)
            name = "";

        _TimerStack.pushTimer(`context.sync(${name})`);
        await this.m_ctx.sync();
        _TimerStack.popTimer();
    }

    pushTrackingBookmark(bookmark: string)
    {
        this.m_cache.pushBookmark(bookmark);
    }

    addCacheObject(key: string, item: CacheObject)
    {
        this.m_cache.addCacheObject(this, key, item);
    }

    addCacheObjects(key: string, items: CacheObject[])
    {
        this.m_cache.addCacheObjects(this, key, items);
    }

    releaseCacheObjectsUntil(bookmark: string)
    {
        this.m_cache.releaseUntil(this, bookmark);
    }

    releaseAllCacheObjects()
    {
        this.m_cache.releaseAll(this);
    }

    async getTrackedItemOrPopulate(key: string, del: PopulateCacheDelegate): Promise<any>
    {
        const obj: CacheObject = await this.m_cache.getCacheItemOrPopulate(this, key, del);

        if (obj == null)
            return null;

        return obj.o;
    }

    async getTrackedItemsOrPopulate(key: string, del: PopulateCacheWithArrayDelegate): Promise<any[]>
    {
        const objs = await this.m_cache.getCacheObjectsOrPopulate(this, key, del);

        if (objs == null || objs.length == 0)
            return null;

        return objs.map((_obj) => _obj.o);
    }

    getTrackedItemOrNull(key: string): any
    {
        const obj: CacheObject = this.m_cache.getCacheObjectOrNull(key);

        if (obj == null)
            return null;

        return obj.o;
    }

    /*----------------------------------------------------------------------------
        %%Function: JsCtx.isKeyMoreRecent

        Is the left key more recent than the right key?
    ----------------------------------------------------------------------------*/
    compareKeyOrder(left: string, right: string): number
    {
        return this.m_cache.compareKeyOrder(left, right);
    }

    getTrackedItemsOrNull(key: string): any[]
    {
        const objs: CacheObject[] = this.m_cache.getCacheObjectsOrNull(key);

        if (objs == null || objs.length == 0)
            return null;

        return objs.map((_obj) => _obj.o);
    }
}

    