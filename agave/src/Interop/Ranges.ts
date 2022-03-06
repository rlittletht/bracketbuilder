

export class Ranges
{
    static addressFromCoordinates_1Based(addrFrom: [number, number], addrTo: [number, number]): string
    {
        let cols: string = "ABCDEFGHIJKLMNOPQRSTUVWX";

        if (addrFrom[1] > 25 || (addrTo != null && addrTo[1] > 25))
            throw "cannot handle columns > Z";

        if (addrFrom[1] <= 0 || (addrTo != null && addrTo[1] <= 0))
            throw "row/column addresses are 1-based";

        let addrFinal: string = cols.substring(addrFrom[1] - 1, addrFrom[1])
            .concat(addrFrom[0].toString());

        if (addrTo == null)
        {
            return addrFinal;
        }
        addrFinal = addrFinal.concat(":", cols.substring(addrTo[1] - 1, addrTo[1]), addrTo[0].toString());

        return addrFinal;
    }


    static addressFromCoordinates(addrFrom: [number, number], addrTo: [number, number]): string
    {
        return this.addressFromCoordinates_1Based([addrFrom[0] + 1, addrFrom[1] + 1], addrTo == null ? null : [addrTo[0] + 1, addrTo[1] + 1]);
    }


    static async ensureGlobalNameDeleted(ctx: any, name: string)
    {
        const nameObject: Excel.NamedItem = ctx.workbook.names.getItemOrNullObject(name);
        await ctx.sync();

        if (nameObject.isNullObject)
            return;

        nameObject.delete();
        await ctx.sync();
    }


    static async createOrReplaceNamedRange(ctx: any, name: string, rng: Excel.Range)
    {
        await Ranges.ensureGlobalNameDeleted(ctx, name);
        ctx.workbook.names.add(name, rng);
        await ctx.sync();
    }


    static async createOrReplaceNamedRangeByIndex(
        ctx: any,
        sheet: Excel.Worksheet,
        name: string,
        from: [number, number],
        to?: [number, number])
    {
        const rows: number = to ? to[0] - from[0] + 1 : 1;
        const cols: number = to ? to[1] - from[1] + 1 : 1;

        let rng: Excel.Range = sheet.getRangeByIndexes(from[0], from[1], rows, cols);
        await this.createOrReplaceNamedRange(ctx, name, rng);
    }
}