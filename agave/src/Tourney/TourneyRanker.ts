import { IBracketDefinitionData } from "../Brackets/IBracketDefinitionData";
import { BracketDefinition } from "../Brackets/BracketDefinition";
import { TourneyDef } from "./TourneyDef";
import { TourneyGameDef } from "./TourneyGameDef";

export class TourneyRanker
{
    /*----------------------------------------------------------------------------
        %%Function: TourneyRanker.PushTourneyIfUnique
    ----------------------------------------------------------------------------*/
    static PushTourneyIfUnique(list: TourneyDef[], newTourney: TourneyDef)
    {
        for (const tourney of list)
        {
            if (tourney.Games.size != newTourney.Games.size)
                continue;

            if (tourney.GetHash() === newTourney.GetHash())
                return;
        }

        list.push(newTourney);
    }

    /*----------------------------------------------------------------------------
        %%Function: TourneyRanker.BuildBestRankedScheduleFromExisting
    ----------------------------------------------------------------------------*/
    static BuildBestRankedScheduleFromExisting(tourneyDef: TourneyDef): TourneyDef
    {
        const working: TourneyDef[] = [];
        const finalOptions: TourneyDef[] = [];
        let highest = 0;

        working.push(tourneyDef);

        while (working.length > 0)
        {
            // pull the first tourney
            let starting = working[0];
            working.splice(0, 1);

            const gameOptions: TourneyGameDef[] = starting.GetNextGameOptionsToSchedule();

            if (gameOptions.length == 0)
            {
                finalOptions.push(starting);
            }
            else
            {
                for (let i = 0; i < gameOptions.length; i++)
                {
                    // we have to work on a clone unless we are working on the last option, in which case
                    // we can be destructive with the starting tourney (we removed it from the queue)
                    const newOption: TourneyDef = i == gameOptions.length - 1 ? starting : starting.Clone();

                    newOption.AddGame(gameOptions[i]);

                    // check if this option is already in the list
                    this.PushTourneyIfUnique(working, newOption);
                }
            }
            if (highest < working.length)
                highest = working.length;

            if (working.length > 10000)
            {
                return null;
            }
        }

        console.log(`found ${finalOptions.length} options. high water mark: ${highest}`);

        let best = 0;

        for (let i = 1; i < finalOptions.length; i++)
        {
            if (finalOptions[best].CalculateRankPenalty() > finalOptions[i].CalculateRankPenalty())
                best = i;
        }

        // now rank all the final options
        return finalOptions[best];
    }
}