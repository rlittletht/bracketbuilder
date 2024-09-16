import { TourneyGameDef } from "./TourneyGameDef";
import { TourneyRules } from "./TourneyRules";

export class TourneyDef
{
    private m_rules: TourneyRules;
    private m_games: TourneyGameDef[] = [];

    /*----------------------------------------------------------------------------
        %%Function: TourneyDef.AddGame
    ----------------------------------------------------------------------------*/
    AddGame(game: TourneyGameDef)
    {
        this.m_games.push(game);
    }


}