
export class GameFormatting
{
    /*----------------------------------------------------------------------------
        %%Function: GameFormatting.formatTeamNameRange
    ----------------------------------------------------------------------------*/
    static async formatTeamNameRange(ctx: any, teamNameRange: Excel.Range) {
        teamNameRange.format.font.name = "Arial Black";
        teamNameRange.format.font.size = 9;
        teamNameRange.format.horizontalAlignment = Excel.HorizontalAlignment.center;
        teamNameRange.format.verticalAlignment = Excel.VerticalAlignment.center;

        await ctx.sync();
    }

    /*----------------------------------------------------------------------------
        %%Function: GameFormatting.formatConnectingLineRange
    ----------------------------------------------------------------------------*/
    static async formatConnectingLineRange(ctx: any, lineRange: Excel.Range) {
        lineRange.format.fill.color = "black";

        await ctx.sync();
    }

    /*----------------------------------------------------------------------------
        %%Function: GameFormatting.formatGameInfoBodyText
    ----------------------------------------------------------------------------*/
    static async formatGameInfoBodyText(ctx: any, range: Excel.Range) {
        range.format.font.name = "Calibri";
        range.format.font.size = 9;
        range.format.horizontalAlignment = Excel.HorizontalAlignment.center;
        range.format.verticalAlignment = Excel.VerticalAlignment.top;

        await ctx.sync();
    }

    /*----------------------------------------------------------------------------
        %%Function: GameFormatting.formatGameInfoTimeText
    ----------------------------------------------------------------------------*/
    static async formatGameInfoTimeText(ctx: any, range: Excel.Range) {
        range.format.font.name = "Calibri";
        range.format.font.size = 9;
        range.format.horizontalAlignment = Excel.HorizontalAlignment.center;
        range.format.verticalAlignment = Excel.VerticalAlignment.bottom;
        range.numberFormat = [["h:mm AM/PM"]];

        await ctx.sync();
    }

    /*----------------------------------------------------------------------------
        %%Function: GameFormatting.formatGameInfoAdvanceToText
    ----------------------------------------------------------------------------*/
    static async formatGameInfoAdvanceToText(ctx: any, range: Excel.Range) {
        range.format.font.name = "Calibri";
        range.format.font.size = 6;
        range.format.horizontalAlignment = Excel.HorizontalAlignment.center;
        range.format.verticalAlignment = Excel.VerticalAlignment.top;

        await ctx.sync();
    }

    /*----------------------------------------------------------------------------
        %%Function: GameFormatting.formatGameInfoGameNumber
    ----------------------------------------------------------------------------*/
    static async formatGameInfoGameNumber(ctx: any, range: Excel.Range) {
        range.format.font.name = "Calibri";
        range.format.font.size = 8;
        range.format.font.bold = true;
        range.format.horizontalAlignment = Excel.HorizontalAlignment.right;
        range.format.verticalAlignment = Excel.VerticalAlignment.center;
        range.merge(false);

        await ctx.sync();
    }


    /*----------------------------------------------------------------------------
        %%Function: GameFormatting.formatRangeNormal
    ----------------------------------------------------------------------------*/
    static async formatRangeNormal(ctx: any, range: Excel.Range) {
        range.format.fill.clear();
        range.format.font.name = "Calibri";
        range.format.font.size = 11;
        range.format.horizontalAlignment = Excel.HorizontalAlignment.left;
        range.format.verticalAlignment = Excel.VerticalAlignment.top;

        await ctx.sync();
    }

    /*----------------------------------------------------------------------------
        %%Function: GameFormatting.isCellInLineRow
    ----------------------------------------------------------------------------*/
    static async isCellInLineRow(ctx: any, range: Excel.Range): Promise<boolean> {
        range.load("height");
        range.load("address");
        await ctx.sync();

        return range.height <= 1;
    }

    /*----------------------------------------------------------------------------
        %%Function: GameFormatting.isCellInLineColumn
    ----------------------------------------------------------------------------*/
    static async isCellInLineColumn(ctx: any, range: Excel.Range): Promise<boolean> {
        range.load("width");
        await ctx.sync();

        return range.width < 5;
    }

    /*----------------------------------------------------------------------------
        %%Function: GameFormatting.isCellInGameTitleColumn
    ----------------------------------------------------------------------------*/
    static async isCellInGameTitleColumn(ctx: any, range: Excel.Range): Promise<boolean> {
        range.load("width");
        await ctx.sync();

        return range.width > 20;
    }

    /*----------------------------------------------------------------------------
        %%Function: GameFormatting.isCellInGameScoreColumn
    ----------------------------------------------------------------------------*/
    static async isCellInGameScoreColumn(ctx: any, range: Excel.Range): Promise<boolean> {
        range.load("width");
        await ctx.sync();

        return range.width <= 20;
    }

    /*----------------------------------------------------------------------------
        %%Function: GameFormatting.removeAllGameFormatting
    ----------------------------------------------------------------------------*/
    static removeAllGameFormatting(range: Excel.Range)
    {
        if (range == null)
            return;

        range.clear();
        //range.format.font.name = "Calibri";
        //range.format.font.size = 11;
        //range.format.font.bold = false;
        //range.format.horizontalAlignment = Excel.HorizontalAlignment.left;
        //range.format.verticalAlignment = Excel.VerticalAlignment.top;
        //range.format.fill.clear();
        //await ctx.sync();
    }
}