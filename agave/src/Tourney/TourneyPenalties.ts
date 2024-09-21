import { TourneyGameDef } from "./TourneyGameDef";
import { TourneyDef } from "./TourneyDef";
import { IBracketGameDefinition } from "../Brackets/IBracketGameDefinition";
import { DateWithoutTime } from "../Support/DateWithoutTime";

export class TourneyPenalties
{
    // we would like every team to play before any team is eliminated
    static s_penaltyEarlyEliminiation = 100;

    // maybe the last team is playing at the same time as the first elimination game? not as bad...
    static s_penaltySimultaneousElimination = 50;

    // max penalty - can't play this game next
    static s_penaltyMax = 65535;

    /*----------------------------------------------------------------------------
        %%Function: TourneyPenalties.CalculateTourneyPenalty

        for now, the length of the tournament is the penalty
    ----------------------------------------------------------------------------*/
    static CalculateTourneyPenalty(tourney: TourneyDef): number
    {
        const lastGameNumber = tourney.Bracket.BracketDefinitionData.games.length - 1;

        const championshipGame = tourney.Games.get(lastGameNumber);

        return championshipGame.GameDate.GetDaysSinceEpoch() - tourney.FirstGameDate.GetDaysSinceEpoch();
    }

    /*----------------------------------------------------------------------------
        %%Function: TourneyPenalties.CalculateDatePenalty
    ----------------------------------------------------------------------------*/
    static CalculateDatePenalty(tourney: TourneyDef, gameDef: IBracketGameDefinition, newGame: TourneyGameDef): number
    {
        gameDef;

        return newGame.GameDate.GetDaysSinceEpoch() - tourney.FirstGameDate.GetDaysSinceEpoch();
    }

    /*----------------------------------------------------------------------------
        %%Function: TourneyPenalties.CalculateEliminationPenalty
    ----------------------------------------------------------------------------*/
    static CalculateEliminationPenalty(tourney: TourneyDef, gameDef: IBracketGameDefinition, newGame: TourneyGameDef): number
    {
        if (gameDef.loser == "")
        {
            // this is an elimination game. has every team played at least once?
            for (const check of tourney.Bracket.GetFirstRoundGames())
            {
                if (check.Value == newGame.GameNum.Value)
                    continue;

                if (!tourney.Games.has(check.Value))
                // we don't have this game scheduled
                    return this.s_penaltyEarlyEliminiation;

                const gameCheck = tourney.Games.get(check.Value);

                // see if this first-round game is played before this game
                const daysDelta = gameCheck.GameDate.GetDaysSinceEpoch() - newGame.GameDate.GetDaysSinceEpoch();

                if (daysDelta < 0)
                    continue;
                else if (daysDelta > 0)
                    return this.s_penaltyEarlyEliminiation;
                else
                {
                    const timeDelta = gameCheck.Slot.End.Value - newGame.Slot.End.Value;

                    if (timeDelta > 0)
                        return this.s_penaltyEarlyEliminiation;
                    else if (timeDelta == 0)
                        return this.s_penaltySimultaneousElimination;
                    break;
                }
            }
        }

        return 0;
    }
}