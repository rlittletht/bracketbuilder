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
import { TourneyGameIterator } from "./TourneyGameIterator";

export class TourneyDef implements Iterable<TourneyGameDef>
{
    private m_rules: TourneyRules;
    private m_games: Map<number, TourneyGameDef>;
    private m_bracket: BracketDefinition;
    private m_slotManager: TourneySlotManager;
    private m_hashCache: string = null;
    private m_rankPenaltyCache: number | null = null;

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

    get FirstGameDate(): DateWithoutTime
    {
        let earliest: DateWithoutTime = this.m_rules.StartDate;

        for (const game of this.m_games.values())
        {
            if (earliest.CompareTo(game.GameDate) > 0)
                earliest = game.GameDate;
        }

        return earliest;
    }

    /*----------------------------------------------------------------------------
        %%Function: TourneyDef.GetHash
    ----------------------------------------------------------------------------*/
    GetHash(): string
    {
        if (this.m_hashCache == null)
        {
            const daysMap: Map<number, number> = new Map<number, number>();

            for (const game of this.m_games.values())
            {
                const day = game.GameDate.GetDaysSinceEpoch();

                if (!daysMap.has(day))
                    daysMap.set(day, 0);

                daysMap.set(day, daysMap.get(day) | 1 << game.GameNum.Value);
            }

            const hashes: string[] = [];

            const daysSorted: number[] = [];

            for (const day of daysMap.keys())
                daysSorted.push(day);

            for (const day of daysSorted.sort((left, right) => { return left - right; }))
            {
                const value = daysMap.get(day);

                hashes.push(`${day}:${value}`);
            }

            this.m_hashCache = hashes.join("-");
        }

        return this.m_hashCache;
    }

    /*----------------------------------------------------------------------------
        %%Function: TourneyDef.Clone
    ----------------------------------------------------------------------------*/
    Clone(): TourneyDef
    {
        const clone = new TourneyDef(this.m_bracket.BracketDefinitionData, this.Rules);

        for (const game of this.m_games.values())
        {
            clone.AddGame(game.Clone());
        }

        return clone;
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
        this.m_hashCache = null;
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

        Calculate this tournaments rank penalty
    ----------------------------------------------------------------------------*/
    CalculateRankPenalty(): number
    {
        if (this.m_rankPenaltyCache == null)
        {
            this.m_rankPenaltyCache = TourneyPenalties.CalculateTourneyPenalty(this);
        }

        return this.m_rankPenaltyCache;
    }

    /*----------------------------------------------------------------------------
        %%Function: TourneyDef.CalculateGameRankPenalty

        Calculate the rank penalty for this game for the current tourney
    ----------------------------------------------------------------------------*/
    CalculateGameRankPenalty(num: GameNum): { newGame: TourneyGameDef, rank: number }
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

        penalty += TourneyPenalties.CalculateDatePenalty(this, gameDef, newGame);

        return { newGame: newGame, rank: penalty };
    }

    /*----------------------------------------------------------------------------
        %%Function: TourneyDef.GetNextGameOptionsToSchedule
    ----------------------------------------------------------------------------*/
    GetNextGameOptionsToSchedule(): TourneyGameDef[]
    {
        const options: TourneyGameDef[] = [];

        let bestRank: { newGame: TourneyGameDef, rank: number } = { newGame: null, rank: TourneyPenalties.s_penaltyMax };

        for (let gameNum = 0; gameNum < this.m_bracket.BracketSize; gameNum++)
        {
            if (this.m_games.has(gameNum))
                continue;

            const num = new GameNum(gameNum);
            const thisRank = this.CalculateGameRankPenalty(num);

            if (thisRank.rank < bestRank.rank)
            {
                options.length = 0;
                options.push(thisRank.newGame);
                bestRank = thisRank;
            }
            else if (thisRank.rank == bestRank.rank)
            {
                options.push(thisRank.newGame);
            }
        }

        return options;
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
        const options = this.GetNextGameOptionsToSchedule();

        return options[0];
    }

    /*----------------------------------------------------------------------------
        %%Function: TourneyDef.ScheduleAllRemainingGames
    ----------------------------------------------------------------------------*/
    ScheduleAllRemainingGames()
    {
        let nextGame = this.GetNextGameToSchedule();

        while (nextGame != null)
        {
            this.AddGame(nextGame);
            nextGame = this.GetNextGameToSchedule();
        }
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
            rules.AddField(fieldName, false, 180);

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

    [Symbol.iterator]()
    {
        // build an ordered list of games (basically, by date by time)
        const unordered: TourneyGameDef[] = [];

        for (const game of this.m_games.values())
            unordered.push(game);

        const ordered = unordered.sort(
            (left: TourneyGameDef, right: TourneyGameDef) =>
            {
                return left.DateTimeNumber - right.DateTimeNumber;
            });

        return new TourneyGameIterator(ordered);
    }
}
