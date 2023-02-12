
export interface PopulateCacheDelegate
{
    (ctx: any): Promise<any>;
}

export class TrackingCache
{
    m_trackedItems: Map<string, any> = new Map<string, any>();
    m_order: string[] = [];

    AddTrackedItem(ctx: any, key: string, item: any)
    {
        ctx.trackedObjects.add(item);
        this.m_trackedItems.set(key, item);
        this.m_order.push(key);
    }

    ReleaseAll(ctx: any)
    {
        while (this.m_order.length > 0)
        {
            const key: string = this.m_order.pop();
            ctx.trackedObjects.remove(this.m_trackedItems.get(key));
        }

        this.m_trackedItems.clear();
    }

    getTrackedItemOrNull(key: string): any
    {
        if (this.m_trackedItems.has(key))
            return this.m_trackedItems.get(key);

        return null;
    }

    async getTrackedItem(ctx: any, key: string, del: PopulateCacheDelegate): Promise<any>
    {
        let val: any = this.getTrackedItemOrNull(key);

        if (val != null)
            return val;

        val = await del(ctx);

        if (val != null)
            this.AddTrackedItem(ctx, key, val);

        return val;
    }

    static getTrackedItemOrNullFromCache(cache: TrackingCache, key: string): any
    {
        if (cache == null)
            return null;

        return cache.getTrackedItemOrNull(key);
    }

    static async getTrackedItemFromCache(cache: TrackingCache, ctx: any, key: string, del: PopulateCacheDelegate): Promise<any>
    {
        if (cache == null)
            return null;

        return await cache.getTrackedItem(ctx, key, del);
    }
}