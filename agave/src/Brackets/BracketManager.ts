
import { GameId } from "../BracketEditor/GameId";
import { BracketDefinition, GameResultType, TeamPlacement } from "./BracketDefinitions";

export class BracketManager
{
    m_bracket: BracketDefinition = null;

    IsCached(bracketTableName: string): boolean
    {
        return this.m_bracket != null && this.m_bracket.tableName == bracketTableName;
    }

    setCache(bracket: BracketDefinition)
    {
        this.m_bracket = bracket;
    }

    get Bracket(): BracketDefinition
    {
        return this.m_bracket;
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