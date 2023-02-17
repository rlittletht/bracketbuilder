import { TrackingCache, PopulateCacheDelegate, PopulateCacheWithArrayDelegate } from "./TrackingCache";

export class JsCtx
{
    m_ctx: any;
    m_cache: TrackingCache;

    constructor(ctx: any)
    {
        this.m_ctx = ctx;
        this.m_cache = new TrackingCache();
        console.log("------ New context");
    }

    get Ctx(): any { return this.m_ctx; }

    async sync()
    {
        await this.m_ctx.sync();
    }

    pushTrackingBookmark(bookmark: string)
    {
        this.m_cache.pushBookmark(bookmark);
    }

    addTrackedItem(key: string, item: any)
    {
        this.m_cache.addTrackedItem(this, key, item);
    }

    addTrackedItems(key: string, items: any[])
    {
        this.m_cache.addTrackedItems(this, key, items);
    }

    releaseTrackedItemsUntil(bookmark: string)
    {
        this.m_cache.releaseUntil(this, bookmark);
    }

    releaseAllTrackedItems()
    {
        this.m_cache.releaseAll(this);
    }

    async getTrackedItem(key: string, del: PopulateCacheDelegate): Promise<any>
    {
        return await this.m_cache.getTrackedItem(this, key, del);
    }

    async getTrackedItems(key: string, del: PopulateCacheWithArrayDelegate): Promise<any[]>
    {
        return await this.m_cache.getTrackedItems(this, key, del);
    }

    getTrackedItemOrNull(key: string): any
    {
        return this.m_cache.getTrackedItemOrNull(key);
    }

    getTrackedItemsOrNull(key: string): any[]
    {
        return this.m_cache.getTrackedItemsOrNull(key);
    }
}

    