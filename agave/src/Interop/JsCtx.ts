
export class JsCtx
{
    m_ctx: any;

    constructor(ctx: any)
    {
        this.m_ctx = ctx;
    }

    get Ctx(): any { return this.m_ctx; }

    async sync()
    {
        await this.m_ctx.sync();
    }
}

    