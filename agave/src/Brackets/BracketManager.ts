
import { GameId } from "../BracketEditor/GameId";
import { GameResultType, TeamPlacement } from "./BracketDefinitions";
import { JsCtx } from "../Interop/JsCtx";
import { BracketDefBuilder } from "./BracketDefBuilder";
import { RangeCaches, RangeCacheItemType } from "../Interop/RangeCaches";
import { FastFormulaAreas } from "../Interop/FastFormulaAreas/FastFormulaAreas";
import { TableIO } from "../Interop/TableIO";
import { _TimerStack } from "../PerfTimer";
import { HelpTopic } from "../Coaching/HelpInfo";
import { TrError } from "../Exceptions";
import { IBracketDefinitionData } from "./IBracketDefinitionData";
import { IBracketGameDefinition } from "./IBracketGameDefinition";

export class BracketManager
{
    m_bracketsMap: Map<string, IBracketDefinitionData> = new Map<string, IBracketDefinitionData>();

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
    static loadBracketFromValues(bracketName: string, tableName: string, header: any[][], dataBody: any[][], bracketNameValues: any[][]): IBracketDefinitionData
    {
        const bracket: IBracketDefinitionData =
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
            ["Game", "Winner", "Loser", "Top", "Bottom", "TopSeedName", "BottomSeedName"],
            false);

        for (let game of gameDefs)
        {
            bracket.games.push(
                {
                    winner: game.Winner,
                    loser: game.Loser,
                    topSource: game.Top,
                    bottomSource: game.Bottom,
                    topSeed: game.TopSeedName,
                    bottomSeed: game.BottomSeedName
                });
        }
        return bracket;
    }

    /*----------------------------------------------------------------------------
        %%Function: BracketManager.LoadBracketDefinitionDataFromWorkbook

        Load the requested bracket from the workbook -- maybe use the caches, but
        if not present, do it the slow way.
    ----------------------------------------------------------------------------*/
    static async LoadBracketDefinitionDataFromWorkbook(context: JsCtx, bracketName: string, sheetName: string): Promise<IBracketDefinitionData>
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
    async populateBracketsIfNecessary(context: JsCtx, bracket?: string): Promise<IBracketDefinitionData>
    {
        // only repopulate if dirty.
        // NOTE: If you ask for a bracket that we haven't cached yet, but you believe that we
        // have subsequently added to the workbook (because we built the specific bracket), then
        // you MUST dirty the bracket manager first. We won't automatically reload
        if (!this.m_dirty)
            return bracket ? this.GetBracketDefinitionData(bracket) : null;

        this.m_dirty = false;

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
                    const bracketDef = await BracketManager.LoadBracketDefinitionDataFromWorkbook(context, _bracket, BracketDefBuilder.SheetName);

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
        %%Function: BracketManager.GetBracketDefinitionsData
    ----------------------------------------------------------------------------*/
    GetBracketDefinitionsData(): IBracketDefinitionData[]
    {
        const brackets = [];

        for (let key of this.m_bracketsMap.keys())
        {
            brackets.push(this.m_bracketsMap.get(key));
        }

        return brackets;
    }

    /*----------------------------------------------------------------------------
        %%Function: BracketManager.GetBracketDefinitionData
    ----------------------------------------------------------------------------*/
    GetBracketDefinitionData(bracket: string): IBracketDefinitionData
    {
        if (!this.m_bracketsMap.has(bracket))
            return null;

        return this.m_bracketsMap.get(bracket);
    }

    /*----------------------------------------------------------------------------
        %%Function: BracketManager.GameIdFromWinnerLoser

        Get the GameId from the Winner or Loser string ("W1" or "L2", etc)
    ----------------------------------------------------------------------------*/
    static GameIdFromWinnerLoser(winnerLoser: string): GameId
    {
        return new GameId(Number(winnerLoser.substring(1)));
    }

    /*----------------------------------------------------------------------------
        %%Function: BracketManager.GetTeamPlacementFromAdvance

        Figure out if this the advancement string points to the top or bottom
        of a the target game
    ----------------------------------------------------------------------------*/
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

    /*----------------------------------------------------------------------------
        %%Function: BracketManager.GetGameResultTypeFromSource

        Return whether this is result yields a winner or a loser
    ----------------------------------------------------------------------------*/
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

    /*----------------------------------------------------------------------------
        %%Function: BracketManager.IsTeamSourceStatic

        Return whether the source of this game is a static team ("Team 1") or
        is the result of a game ("W1" or "L1").
    ----------------------------------------------------------------------------*/
    static IsTeamSourceStatic(source: string): boolean
    {
        if (source.length > 3 || source.length == 1)
            return true;

        if (source[0] === "W" || source[0] === "L")
            return isNaN(+source.substring(1, source.length - 1));

        return false;
    }

    /*----------------------------------------------------------------------------
        %%Function: BracketManager.IsBracketDefinitionDataDoubleEliminination

        This is a standard double eliminination bracket if the last game in the
        bracket is a what-if game -- the top and bottom sources will come from the
        same game.
    ----------------------------------------------------------------------------*/
    static IsBracketDefinitionDataDoubleEliminination(bracket: IBracketDefinitionData): boolean
    {
        if (bracket.games.length < 2)
            throw new Error("invalid bracket");

        const game: IBracketGameDefinition = bracket.games[bracket.games.length - 2];

        return (this.GameIdFromWinnerLoser(game.topSource).equals(this.GameIdFromWinnerLoser(game.bottomSource)));
    }
}

export let _bracketManager: BracketManager = new BracketManager();