import { IBracketDefinitionData } from "./IBracketDefinitionData";
import { GameId } from "../BracketEditor/GameId";
import { IBracketGameDefinition } from "./IBracketGameDefinition";
import { BracketManager } from "./BracketManager";
import { GameNum } from "../BracketEditor/GameNum";

/*----------------------------------------------------------------------------
    %%Class: BracketDefinition.BracketDefinition

    An instance of a specific bracket definition
----------------------------------------------------------------------------*/
export class BracketDefinition
{
    private m_definition: IBracketDefinitionData;

    constructor(definition: IBracketDefinitionData)
    {
        this.m_definition = definition;
    }

    get BracketSize(): number
    {
        return this.m_definition.games.length;
    }

    GetGameDefinitionData(num: GameNum): IBracketGameDefinition
    {
        return this.m_definition.games[num.Value];
    }

    /*----------------------------------------------------------------------------
        %%Function: BracketDefinition.GetGameRequirementsForGame
    ----------------------------------------------------------------------------*/
    GetGameRequirementsForGame(num: GameNum): GameNum[]
    {
        const gameDef: IBracketGameDefinition = this.GetGameDefinitionData(num);

        const predecessors: GameNum[] = [];

        if (!BracketManager.IsTeamSourceStatic(gameDef.topSource))
            predecessors.push(BracketManager.GameIdFromWinnerLoser(gameDef.topSource).GameNum);

        if (!BracketManager.IsTeamSourceStatic(gameDef.bottomSource) && gameDef.bottomSource !== "")
            predecessors.push(BracketManager.GameIdFromWinnerLoser(gameDef.bottomSource).GameNum);

        return predecessors;
    }

    /*----------------------------------------------------------------------------
        %%Function: BracketDefinition.GetFirstRoundGames

        Get all the games that are in the first round (i.e. have a static
        team source)
    ----------------------------------------------------------------------------*/
    GetFirstRoundGames(): GameNum[]
    {
        const games: GameNum[] = [];

        for (let gameNum = 0; gameNum < this.m_definition.games.length; gameNum++)
        {
            const def = this.m_definition.games[gameNum];

            if (BracketManager.IsTeamSourceStatic(def.topSource)
                || BracketManager.IsTeamSourceStatic(def.topSource))
            {
                games.push(new GameNum(gameNum));
            }
        }

        return games;
    }
}