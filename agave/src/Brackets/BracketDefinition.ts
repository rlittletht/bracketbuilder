import { IBracketDefinitionData } from "./IBracketDefinitionData";

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
}