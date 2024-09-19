import { TourneyGameDef } from "./TourneyGameDef";
import { TourneyRules } from "./TourneyRules";
import { BracketDefinition } from "../Brackets/BracketDefinition";
import { IBracketDefinitionData } from "../Brackets/IBracketDefinitionData";
import { GameId } from "../BracketEditor/GameId";
import { BracketManager, _bracketManager } from "../Brackets/BracketManager";
import { IBracketGameDefinition } from "../Brackets/IBracketGameDefinition";
import { TimeWithoutDate } from "../Support/TimeWithoutDate";
import { TourneyFieldSlot } from "./TourneyFieldSlot";
import { TourneySlotManager } from "./TourneySlotManager";
import { TourneyPenalties } from "./TourneyPenalties";
import { Grid } from "../BracketEditor/Grid";
import { DateWithoutTime } from "../Support/DateWithoutTime";
import { GameNum } from "../BracketEditor/GameNum";

export class TourneyDef
{
    private m_rules: TourneyRules;
    private m_games: Map<number, TourneyGameDef>;
    private m_bracket: BracketDefinition;
    private m_slotManager: TourneySlotManager;

    constructor(bracketDefinitionData: IBracketDefinitionData, rules: TourneyRules)
    {
        this.m_bracket = new BracketDefinition(bracketDefinitionData);
        this.m_rules = rules;
        this.m_games = new Map<number, TourneyGameDef>();
        this.m_slotManager = new TourneySlotManager(this);
    }

    get Rules(): TourneyRules
    {
        return this.m_rules;
    }

    get Games(): Map<number, TourneyGameDef>
    {
        return this.m_games;
    }

    get Bracket(): BracketDefinition
    {
        return this.m_bracket;
    }

    /*----------------------------------------------------------------------------
        %%Function: TourneyDef.AddGame
    ----------------------------------------------------------------------------*/
    AddGame(game: TourneyGameDef)
    {
        if (this.m_games.has(game.GameNum.Value))
            throw new Error(`tourney already has game {game.GameNum.Value} scheduled`);

        this.m_slotManager.Invalidate();
        this.m_games.set(game.GameNum.Value, game);
    }

    /*----------------------------------------------------------------------------
        %%Function: TourneyDef.ScheduleGame

        Figure out when this game can be played based on the rules. This doesn't
        add the game to the tourney -- it just figures out where it would go
        (useful for calculating ranking penalties)

        General approach:

        Schedule games packed together as tightly as possible:

        find the first day the game can be played on (based on prereqs)

        if a game can be played on that day (because there are slots
        available), then play it.

        otherwise, try the next day...rinse and repeat
    ----------------------------------------------------------------------------*/
    ScheduleGame(num: GameNum): TourneyGameDef
    {
        // first, what day can we play this on
        const predecessors = this.m_bracket.GetGameRequirementsForGame(num);

        let firstAvailDate: DateWithoutTime = this.m_rules.StartDate;

        for (const num of predecessors)
        {
            if (!this.m_games.has(num.Value))
                return null;

            const preceding = this.m_games.get(num.Value);

            if (firstAvailDate.GetDaysSinceEpoch() <= preceding.GameDate.GetDaysSinceEpoch())
                firstAvailDate = DateWithoutTime.CreateForEpochDays(preceding.GameDate.GetDaysSinceEpoch() + 1);
        }

        let firstAvailSlot = this.m_slotManager.GetFirstSlotAvailableOrNullForDate(firstAvailDate);
        let tries = 0;

        while (firstAvailSlot == null)
        {
            if (tries > 31)
            {
                // we tried 31 different days and failed. give up
                return null;
            }

            // go to the next date and try again
            firstAvailDate = DateWithoutTime.CreateForEpochDays(firstAvailDate.GetDaysSinceEpoch() + 1);
            firstAvailSlot = this.m_slotManager.GetFirstSlotAvailableOrNullForDate(firstAvailDate);
            tries++;
        }

        return TourneyGameDef.Create(num, firstAvailDate, firstAvailSlot);
    }

    /*----------------------------------------------------------------------------
        %%Function: TourneyDef.CalculateRankPenalty

        Calculate the rank penalty for this game for the current tourney
    ----------------------------------------------------------------------------*/
    CalculateRankPenalty(num: GameNum): { newGame: TourneyGameDef, rank: number }
    {
        let penalty = 0;
        const gameDef: IBracketGameDefinition = this.m_bracket.GetGameDefinitionData(num);

        // are all the predecessor's scheduled?
        const predecessors = this.m_bracket.GetGameRequirementsForGame(num);

        for (const id of predecessors)
        {
            if (!this.m_games.has(id.Value))
                return { newGame: null, rank: TourneyPenalties.s_penaltyMax };
        }

        const newGame = this.ScheduleGame(num);
        if (newGame == null)
            return { newGame: null, rank: TourneyPenalties.s_penaltyMax };

        penalty += TourneyPenalties.CalculateEliminationPenalty(this, gameDef, newGame);

        return { newGame: newGame, rank: penalty };
    }

    /*----------------------------------------------------------------------------
        %%Function: TourneyDef.GetNextGameToSchedule

        Given the current games scheduled in this tourney, what is the next game
        to schedule

        Basically, for every unscheduled game, rank its suitability to schedule
        and take the one with the lowest rank (think of the rank as a penalty)
    ----------------------------------------------------------------------------*/
    GetNextGameToSchedule(): TourneyGameDef
    {
        let bestRank: { newGame: TourneyGameDef, rank: number } = { newGame: null, rank: TourneyPenalties.s_penaltyMax };

        for (let gameNum = 0; gameNum < this.m_bracket.BracketSize; gameNum++)
        {
            if (this.m_games.has(gameNum))
                continue;

            const num = new GameNum(gameNum);
            const thisRank = this.CalculateRankPenalty(num);

            if (thisRank.rank < bestRank.rank)
                bestRank = thisRank;
        }

        return bestRank.newGame;
    }

    /*----------------------------------------------------------------------------
        %%Function: TourneyDef.ScheduleAllRemainingGames
    ----------------------------------------------------------------------------*/
    ScheduleAllRemainingGames()
    {
        let nextGame = this.GetNextGameToSchedule();

        while (nextGame != null)
            this.AddGame(nextGame);
    }

    /*----------------------------------------------------------------------------
        %%Function: TourneyDef.CreateFromGrid
    ----------------------------------------------------------------------------*/
    static CreateFromGrid(grid: Grid, bracketName: string): TourneyDef
    {
        const rules = TourneyRules.Create();

        const startDate = grid.getDateFromGridColumn(grid.FirstGridPattern.FirstColumn);
        
        rules.SetStart(startDate);

        for (const fieldName of grid.getAllAvailableFields())
        {
            rules.AddField(fieldName, false, 180);
        }

        rules.AddDefaultFieldRestrictions();

        const tourney = new TourneyDef(_bracketManager.GetBracketDefinitionData(bracketName), rules);

        grid.enumerateMatching(
            (item) =>
            {
                const num = item.GameNumber;
                const date = grid.getDateFromGridItem(item);
                const field = tourney.m_rules.GetMatchingField(item.Field);
                const slot = new TourneyFieldSlot(TimeWithoutDate.CreateForMinutesSinceMidnight(item.StartTime), field);

                const tourneyGame = TourneyGameDef.Create(num, date, slot);

                tourney.AddGame(tourneyGame);

                return true;
            },
            (item) =>
            {
                return !item.isLineRange;
            });

        return tourney;
    }
}