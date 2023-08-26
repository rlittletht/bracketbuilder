
import { GameId } from "../BracketEditor/GameId";
import { BracketDefinition, GameResultType, TeamPlacement } from "./BracketDefinitions";
import { JsCtx } from "../Interop/JsCtx";
import { BracketDefBuilder } from "./BracketDefBuilder";
import { RangeCaches, RangeCacheItemType } from "../Interop/RangeCaches";
import { FastFormulaAreas } from "../Interop/FastFormulaAreas";
import { TableIO } from "../Interop/TableIO";
import { _TimerStack } from "../PerfTimer";
import { HelpTopic } from "../Coaching/HelpInfo";
import { TrError } from "../Exceptions";

export class BracketManager
{
    m_bracketsMap: Map<string, BracketDefinition> = new Map<string, BracketDefinition>();

    m_dirty: boolean = true; // do we need to reload the brackets from the workbook?

    setDirty(dirty: boolean)
    {
        this.m_dirty = dirty;
        this.m_bracketsMap.clear();
    }

    static BracketNameFromBracketChoice(choice: string): string
    {
        return `${choice}Bracket`;
    }

    /*----------------------------------------------------------------------------
        %%Function: BracketManager.loadBracketFromValues

        Load the bracket definition and name from the given read values
    ----------------------------------------------------------------------------*/
    static loadBracketFromValues(bracketName: string, tableName: string, header: any[][], dataBody: any[][], bracketNameValues: any[][]): BracketDefinition
    {
        const bracket: BracketDefinition =
        {
            name: bracketNameValues[0][0],
            teamCount: +bracketName.substring(1),
            tableName: tableName,
            games: []
        };

        const gameDefs = TableIO.readDataFromCachedExcelTable(
            tableName,
            header,
            dataBody,
            ["Game", "Winner", "Loser", "Top", "Bottom"],
            true);

        for (let game of gameDefs)
        {
            bracket.games.push(
                {
                    winner: game.Winner,
                    loser: game.Loser,
                    topSource: game.Top,
                    bottomSource: game.Bottom
                });
        }
        return bracket;
    }

    /*----------------------------------------------------------------------------
        %%Function: BracketManager.loadBracketFromWorkbook

        Load the requested bracket from the workbook -- maybe use the caches, but
        if not present, do it the slow way.
    ----------------------------------------------------------------------------*/
    static async loadBracketFromWorkbook(context: JsCtx, bracketName: string, sheetName: string): Promise<BracketDefinition>
    {
        let values: any[][];
        let header: any[][];
        let bracketNameValues: any[][];

        if (RangeCaches.BracketCached == bracketName)
        {
            const rangeCacheBody = RangeCaches.getCacheByType(RangeCacheItemType.BracketDefBody);
            const rangeCacheHeader = RangeCaches.getCacheByType(RangeCacheItemType.BracketDefHeader);

            if (rangeCacheBody && rangeCacheHeader)
            {
                const areas = FastFormulaAreas.getFastFormulaAreaCacheForType(context, rangeCacheBody.formulaCacheType);

                if (areas)
                {
                    values = areas.getValuesForRangeInfo(rangeCacheBody.rangeInfo);
                    header = areas.getValuesForRangeInfo(rangeCacheHeader.rangeInfo);
                    bracketNameValues = areas.getValuesForRangeInfo(rangeCacheHeader.rangeInfo.offset(-1, 1, 0, rangeCacheHeader.rangeInfo.ColumnCount));
                }
            }
        }

        const defTableName = `${bracketName}Bracket`;
        if (values == null)
        {
            // couldn't find the cache...gotta load the old fashioned way
            const sheet: Excel.Worksheet = context.Ctx.workbook.worksheets.getItem(sheetName);
            const defTable = sheet.tables.getItem(defTableName);
            const defRange: Excel.Range = defTable.getDataBodyRange();
            const defHeader: Excel.Range = defTable.getHeaderRowRange();
            const defBracketName: Excel.Range = defHeader.getOffsetRange(-1, 0);

            // FUTURE: is there any benefit to caching this range? we probably only load all these once...
            defRange.load("values");
            defHeader.load("values");
            defBracketName.load("values");

            await context.sync();
            values = defRange.values;
            header = defHeader.values;
            bracketNameValues = defBracketName.values;
            }

        const bracketDefinition = BracketManager.loadBracketFromValues(bracketName, defTableName, header, values, bracketNameValues);

        try
        {
            BracketDefBuilder.verifyBracketConsistency(bracketDefinition);
        }
        catch (e)
        {
            throw new TrError(
                [
                    `The bracket definition for ${bracketName} is not valid.`,
                    e.message
                ],
                { topic: HelpTopic.FAQ_CustomBrackets });
        }

        return bracketDefinition;
    }

    /*----------------------------------------------------------------------------
        %%Function: BracketManager.getBracketDefsOnSheet

        get all the bracket definitions on the bracketdef sheet
    ----------------------------------------------------------------------------*/
    static async getBracketDefsOnSheet(context: JsCtx, sheetName: string): Promise<string[]>
    {
        const brackets = [];
        const sheet: Excel.Worksheet = context.Ctx.workbook.worksheets.getItem(sheetName);
        sheet.tables.load("items");

        await context.sync();

        for (let item of sheet.tables.items)
        {
            const bracketName = item.name.toUpperCase();

            if (bracketName.endsWith("BRACKET")
                && bracketName.startsWith("T"))
            {
                brackets.push(bracketName.substring(0, bracketName.length - "BRACKET".length));
            }
        }

        return brackets;
    }

    /*----------------------------------------------------------------------------
        %%Function: BracketManager.populateStaticBracketsForTests

        only for unit tests -- populates all the static brackets
    ----------------------------------------------------------------------------*/
    populateStaticBracketsForTests()
    {
        const brackets = BracketDefBuilder.getStaticBrackets();

        for (let _bracket of brackets)
            this.m_bracketsMap.set(`T${_bracket.teamCount}`, _bracket);
    }

    /*----------------------------------------------------------------------------
        %%Function: BracketManager.populateBracketsIfNecessary

        Populate the given bracket (or all brackets) if necessary. If a specific
        bracket was requested, then return that bracket's definition
    ----------------------------------------------------------------------------*/
    async populateBracketsIfNecessary(context: JsCtx, bracket?: string): Promise<BracketDefinition>
    {
        // only repopulate if not dirty.
        // NOTE: If you ask for a bracket that we haven't cached yet, but you believe that we
        // have subsequently added to the workbook (because we built the specific bracket), then
        // you MUST dirty the bracket manager first. We won't automatically reload
        if (!this.m_dirty)
            return bracket ? this.getBracket(bracket) : null;

        await _TimerStack.timeThisAsync(
            "populateBracketsIfNecessary",
            async () =>
            {
                const brackets = [];

                if (!bracket)
                    brackets.push(...await BracketManager.getBracketDefsOnSheet(context, BracketDefBuilder.SheetName));
                else
                    brackets.push(bracket);

                // brackets is the list of brackets to populate
                for (let _bracket of brackets)
                {
                    const bracketDef = await BracketManager.loadBracketFromWorkbook(context, _bracket, BracketDefBuilder.SheetName);

                    if (bracketDef)
                        this.m_bracketsMap.set(_bracket, bracketDef)
                }
            });

        // we don't have the definition for this bracket
        if (bracket)
            return this.m_bracketsMap.has(bracket) ? this.m_bracketsMap.get(bracket) : null;

        return null;
    }

    /*----------------------------------------------------------------------------
        %%Function: BracketManager.getBrackets
    ----------------------------------------------------------------------------*/
    getBrackets(): BracketDefinition[]
    {
        const brackets = [];

        for (let key of this.m_bracketsMap.keys())
        {
            brackets.push(this.m_bracketsMap.get(key));
        }

        return brackets;
    }

    /*----------------------------------------------------------------------------
        %%Function: BracketManager.getBracket
    ----------------------------------------------------------------------------*/
    getBracket(bracket: string)
    {
        if (!this.m_bracketsMap.has(bracket))
            return null;

        return this.m_bracketsMap.get(bracket);
    }

    static GameIdFromWinnerLoser(winnerLoser: string): GameId
    {
        return new GameId(Number(winnerLoser.substring(1)));
    }

    static GetTeamPlacementFromAdvance(advance: string): TeamPlacement
    {
        const placement = advance.substring(0, 1);

        switch (placement.toUpperCase())
        {
            case "T":
                return TeamPlacement.Top;
            case "B":
                return TeamPlacement.Bottom;
        }
        throw new Error("bad team placement string - corrupt internal bracket");
    }

    static GetGameResultTypeFromSource(source: string): GameResultType
    {
        const result = source.substring(0, 1);

        switch (result.toUpperCase())
        {
            case "W":
                return GameResultType.Winner;
            case "L":
                return GameResultType.Loser;
        }
        throw new Error("bad game result type string - corrupt internal bracket");
    }

    static IsTeamSourceStatic(source: string): boolean
    {
        if (source.length > 3 || source.length == 1)
            return true;

        if (source[0] === "W" || source[0] === "L")
            return isNaN(+source.substring(1, source.length - 1));

        return false;
    }
}

export let _bracketManager: BracketManager = new BracketManager();