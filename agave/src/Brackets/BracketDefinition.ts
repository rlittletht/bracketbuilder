import { IBracketDefinitionData } from "./IBracketDefinitionData";
import { GameId } from "../BracketEditor/GameId";
import { IBracketGameDefinition } from "./IBracketGameDefinition";
import { BracketManager } from "./BracketManager";

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

    GetGameDefinitionData(id: GameId): IBracketGameDefinition
    {
        return this.m_definition.games[id.Value];
    }

    /*----------------------------------------------------------------------------
        %%Function: BracketDefinition.GetGameRequirementsForGame
    ----------------------------------------------------------------------------*/
    GetGameRequirementsForGame(id: GameId): GameId[]
    {
        const gameDef: IBracketGameDefinition = this.GetGameDefinitionData(id);

        const predecessors: GameId[] = [];

        if (!BracketManager.IsTeamSourceStatic(gameDef.topSource))
            predecessors.push(BracketManager.GameIdFromWinnerLoser(gameDef.topSource));

        if (!BracketManager.IsTeamSourceStatic(gameDef.bottomSource))
            predecessors.push(BracketManager.GameIdFromWinnerLoser(gameDef.bottomSource));

        return predecessors;
    }
}