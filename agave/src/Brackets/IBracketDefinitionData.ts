import { IBracketGameDefinition } from "./IBracketGameDefinition";

export interface IBracketDefinitionData
{
    name: string,
    teamCount: number,
    tableName: string,
    games: IBracketGameDefinition[];
}