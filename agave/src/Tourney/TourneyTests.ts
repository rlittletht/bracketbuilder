import { IAppContext } from "../AppContext/AppContext";
import { StreamWriter } from "../Support/StreamWriter";
import { TestRunner } from "../Support/TestRunner";
import { TestResult } from "../Support/TestResult";
import { TourneyDaysOfWeek } from "./TourneyDaysOfWeek";
import { TourneyDef } from "./TourneyDef";
import { BracketManager } from "../Brackets/BracketManager";
import { BracketDefBuilder } from "../Brackets/BracketDefBuilder";
import { TourneyRules } from "./TourneyRules";
import { TourneyFieldSlot } from "./TourneyFieldSlot";
import { TimeWithoutDate } from "../Support/TimeWithoutDate";
import { TourneyGameDef } from "./TourneyGameDef";
import { GameId } from "../BracketEditor/GameId";
import { TourneySlotManager } from "./TourneySlotManager";
import { TourneySlots } from "./TourneySlots";
import { DateWithoutTime } from "../Support/DateWithoutTime";
import { GameNum } from "../BracketEditor/GameNum";

export class TourneyTests
{
    static test_daysOfWeek_Empty(result: TestResult)
    {
        const days: TourneyDaysOfWeek = TourneyDaysOfWeek.Create();

        result.assertIsEqual([], days.DaysSet());
    }

    static test_daysOfWeek_FirstDayOfWeek(result: TestResult)
    {
        const days: TourneyDaysOfWeek = TourneyDaysOfWeek.Create().Add(0);

        result.assertIsEqual(["sun"], days.DaysSet());
    }

    static test_daysOfWeek_LastDayOfWeek(result: TestResult)
    {
        const days: TourneyDaysOfWeek = TourneyDaysOfWeek.Create().Add(6);

        result.assertIsEqual(["sat"], days.DaysSet());
    }

    static test_daysOfWeek_FirstAndLastDaysOfWeek(result: TestResult)
    {
        const days: TourneyDaysOfWeek = TourneyDaysOfWeek.Create().Add(0).Add(6);

        result.assertIsEqual(["sun", "sat"], days.DaysSet());
    }


    // make sure that we always get the days listed in canonical order
    static test_daysOfWeek_FirstAndLastDaysOfWeek_Isomorphic(result: TestResult)
    {
        const days: TourneyDaysOfWeek = TourneyDaysOfWeek.Create().Add(6).Add(0);

        result.assertIsEqual(["sun", "sat"], days.DaysSet());
    }

    static test_daysOfWeek_AllDaysOfWeek_Isomorphic(result: TestResult)
    {
        const days: TourneyDaysOfWeek = TourneyDaysOfWeek.Create().Add(6).Add(0).Add(1).Add(2).Add(3).Add(4).Add(5);

        result.assertIsEqual(["sun", "mon", "tue", "wed", "thu", "fri", "sat"], days.DaysSet());
    }

    static test_buildSlotListForDate_NoConflicts_DefaultRestrictions(result: TestResult)
    {
        const rules =
            TourneyRules
                .Create()
                .AddField("F1", false, 180)
                .AddField("F2", false, 180)
                .AddDefaultFieldRestrictions();

        const def = new TourneyDef(BracketDefBuilder.getStaticBracketDefinition("T8Bracket"), rules);

        // 9/15/2024 is a sunday...
        const expectedSlots =
            [
                new TourneyFieldSlot(TimeWithoutDate.CreateForTime(10), rules.Fields[0]),
                new TourneyFieldSlot(TimeWithoutDate.CreateForTime(10), rules.Fields[1]),
                new TourneyFieldSlot(TimeWithoutDate.CreateForTime(13), rules.Fields[0]),
                new TourneyFieldSlot(TimeWithoutDate.CreateForTime(13), rules.Fields[1]),
                new TourneyFieldSlot(TimeWithoutDate.CreateForTime(16), rules.Fields[0]),
                new TourneyFieldSlot(TimeWithoutDate.CreateForTime(16), rules.Fields[1])
            ];

        const date: DateWithoutTime = DateWithoutTime.CreateForDateString("2024-09-15");
        const slots = TourneySlots.CreateForAvailableSlotsOnDate(def, date);

        result.assertIsEqual(expectedSlots, slots.Slots);
    }

    // this has an existing game that causes the rest of the slots to shift from their normal default
    // (only on one field...)
    static test_buildSlotListForDate_HourShiftedConflict_DefaultRestrictions(result: TestResult)
    {
        const rules =
            TourneyRules
                .Create()
                .AddField("F1", false, 180)
                .AddField("F2", false, 180)
                .AddDefaultFieldRestrictions();

        const date: DateWithoutTime = DateWithoutTime.CreateForDateString("2024-09-15");
        const gameSlot: TourneyFieldSlot = new TourneyFieldSlot(TimeWithoutDate.CreateForTime(11), rules.Fields[0]);

        const def = new TourneyDef(BracketDefBuilder.getStaticBracketDefinition("T8Bracket"), rules);

        def.AddGame(TourneyGameDef.Create(new GameNum(0), date, gameSlot));

        // 9/15/2024 is a sunday...
        const expectedSlots =
        [
            new TourneyFieldSlot(TimeWithoutDate.CreateForTime(10), rules.Fields[1]),
            new TourneyFieldSlot(TimeWithoutDate.CreateForTime(13), rules.Fields[1]),
            new TourneyFieldSlot(TimeWithoutDate.CreateForTime(14), rules.Fields[0]),
            new TourneyFieldSlot(TimeWithoutDate.CreateForTime(16), rules.Fields[1]),
            new TourneyFieldSlot(TimeWithoutDate.CreateForTime(17), rules.Fields[0])
        ];

        const slots = TourneySlots.CreateForAvailableSlotsOnDate(def, date);

        result.assertIsEqual(expectedSlots, slots.Slots);
    }

    // this has an existing game that causes the rest of the slots to shift from their normal default
    // (only on one field...)
    static test_buildSlotListForDate_HourShiftedConflictAfterOneDefault_DefaultRestrictions(result: TestResult)
    {
        const rules =
            TourneyRules
                .Create()
                .AddField("F1", false, 180)
                .AddField("F2", false, 180)
                .AddDefaultFieldRestrictions();

        const date: DateWithoutTime = DateWithoutTime.CreateForDateString("2024-09-15");
        const gameSlot: TourneyFieldSlot = new TourneyFieldSlot(TimeWithoutDate.CreateForTime(14), rules.Fields[0]);

        const def = new TourneyDef(BracketDefBuilder.getStaticBracketDefinition("T8Bracket"), rules);

        def.AddGame(TourneyGameDef.Create(new GameNum(0), date, gameSlot));

        // 9/15/2024 is a sunday...
        const expectedSlots =
        [
            new TourneyFieldSlot(TimeWithoutDate.CreateForTime(10), rules.Fields[0]),
            new TourneyFieldSlot(TimeWithoutDate.CreateForTime(10), rules.Fields[1]),
            new TourneyFieldSlot(TimeWithoutDate.CreateForTime(13), rules.Fields[1]),
            new TourneyFieldSlot(TimeWithoutDate.CreateForTime(16), rules.Fields[1]),
            new TourneyFieldSlot(TimeWithoutDate.CreateForTime(17), rules.Fields[0])
        ];

        const slots = TourneySlots.CreateForAvailableSlotsOnDate(def, date);

        result.assertIsEqual(expectedSlots, slots.Slots);
    }

    // this has an existing game that causes the rest of the slots to shift from their normal default
    // (only on one field...)
    static test_buildSlotListForDate_RoomForOneGameBetweenGames_DefaultRestrictions(result: TestResult)
    {
        const rules =
            TourneyRules
                .Create()
                .AddField("F1", false, 180)
                .AddField("F2", false, 180)
                .AddDefaultFieldRestrictions();

        const date: DateWithoutTime = DateWithoutTime.CreateForDateString("2024-09-15");
        const gameSlot1: TourneyFieldSlot = new TourneyFieldSlot(TimeWithoutDate.CreateForTime(11, 30), rules.Fields[0]);
        const gameSlot2: TourneyFieldSlot = new TourneyFieldSlot(TimeWithoutDate.CreateForTime(18, 0), rules.Fields[0]);

        const def = new TourneyDef(BracketDefBuilder.getStaticBracketDefinition("T8Bracket"), rules);

        def.AddGame(TourneyGameDef.Create(new GameNum(0), date, gameSlot1));
        def.AddGame(TourneyGameDef.Create(new GameNum(1), date, gameSlot2));

        // 9/15/2024 is a sunday...
        const expectedSlots =
        [
            new TourneyFieldSlot(TimeWithoutDate.CreateForTime(10), rules.Fields[1]),
            new TourneyFieldSlot(TimeWithoutDate.CreateForTime(13), rules.Fields[1]),
            new TourneyFieldSlot(TimeWithoutDate.CreateForTime(14, 30), rules.Fields[0]),
            new TourneyFieldSlot(TimeWithoutDate.CreateForTime(16), rules.Fields[1])
        ];

        const slots = TourneySlots.CreateForAvailableSlotsOnDate(def, date);

        result.assertIsEqual(expectedSlots, slots.Slots);
    }

    // this has an existing game that causes the rest of the slots to shift from their normal default
    // (only on one field...)
    static test_buildSlotListForDate_RoomForOneGameBetweenGamesAndOneAfterWithLights_DefaultRestrictions(result: TestResult)
    {
        const rules =
            TourneyRules
                .Create()
                .AddField("F1", true, 180)
                .AddField("F2", false, 180)
                .AddDefaultFieldRestrictions();

        const date: DateWithoutTime = DateWithoutTime.CreateForDateString("2024-09-15");
        const gameSlot1: TourneyFieldSlot = new TourneyFieldSlot(TimeWithoutDate.CreateForTime(10, 30), rules.Fields[0]);
        const gameSlot2: TourneyFieldSlot = new TourneyFieldSlot(TimeWithoutDate.CreateForTime(17, 0), rules.Fields[0]);

        const def = new TourneyDef(BracketDefBuilder.getStaticBracketDefinition("T8Bracket"), rules);

        def.AddGame(TourneyGameDef.Create(new GameNum(0), date, gameSlot1));
        def.AddGame(TourneyGameDef.Create(new GameNum(1), date, gameSlot2));

        // 9/15/2024 is a sunday...
        const expectedSlots =
        [
            new TourneyFieldSlot(TimeWithoutDate.CreateForTime(10), rules.Fields[1]),
            new TourneyFieldSlot(TimeWithoutDate.CreateForTime(13), rules.Fields[1]),
            new TourneyFieldSlot(TimeWithoutDate.CreateForTime(13, 30), rules.Fields[0]),
            new TourneyFieldSlot(TimeWithoutDate.CreateForTime(16), rules.Fields[1]),
            new TourneyFieldSlot(TimeWithoutDate.CreateForTime(20), rules.Fields[0]) 
        ];

        const slots = TourneySlots.CreateForAvailableSlotsOnDate(def, date);

        result.assertIsEqual(expectedSlots, slots.Slots);
    }

    // this has an existing game that causes the rest of the slots to shift from their normal default
    // (only on one field...)
    static test_buildSlotListForDate_RoomForOneGameBetweenGamesAndOneAfterWithLights_OtherFieldHasOneConflict_DefaultRestrictions(result: TestResult)
    {
        const rules =
            TourneyRules
                .Create()
                .AddField("F1", true, 180)
                .AddField("F2", false, 180)
                .AddDefaultFieldRestrictions();

        const date: DateWithoutTime = DateWithoutTime.CreateForDateString("2024-09-15");
        const gameSlot1: TourneyFieldSlot = new TourneyFieldSlot(TimeWithoutDate.CreateForTime(10, 30), rules.Fields[0]);
        const gameSlot2: TourneyFieldSlot = new TourneyFieldSlot(TimeWithoutDate.CreateForTime(17), rules.Fields[0]);

        // yes, its before the earliest start, but if its there its there...
        const gameSlot3: TourneyFieldSlot = new TourneyFieldSlot(TimeWithoutDate.CreateForTime(9, 30), rules.Fields[1]);

        const def = new TourneyDef(BracketDefBuilder.getStaticBracketDefinition("T8Bracket"), rules);

        def.AddGame(TourneyGameDef.Create(new GameNum(0), date, gameSlot1));
        def.AddGame(TourneyGameDef.Create(new GameNum(1), date, gameSlot2));
        def.AddGame(TourneyGameDef.Create(new GameNum(3), date, gameSlot3));

        // 9/15/2024 is a sunday...
        const expectedSlots =
        [
            new TourneyFieldSlot(TimeWithoutDate.CreateForTime(12, 30), rules.Fields[1]),
            new TourneyFieldSlot(TimeWithoutDate.CreateForTime(13, 30), rules.Fields[0]),
            new TourneyFieldSlot(TimeWithoutDate.CreateForTime(15, 30), rules.Fields[1]),
            new TourneyFieldSlot(TimeWithoutDate.CreateForTime(20), rules.Fields[0])
        ];

        const slots = TourneySlots.CreateForAvailableSlotsOnDate(def, date);

        result.assertIsEqual(expectedSlots, slots.Slots);
    }

    // this has an existing game that causes the rest of the slots to shift from their normal default
    // (only on one field...)
    static test_buildSlotListForDate_RoomForOneGameBetweenGamesAndOneAfterWithLights_OtherFieldHasOneConflict_ShorterLengthMakesFit_DefaultRestrictions(result: TestResult)
    {
        const rules =
            TourneyRules
                .Create()
                .AddField("F1", true, 180)
                .AddField("F2", false, 150)
                .AddDefaultFieldRestrictions();

        const date: DateWithoutTime = DateWithoutTime.CreateForDateString("2024-09-15");
        const gameSlot1: TourneyFieldSlot = new TourneyFieldSlot(TimeWithoutDate.CreateForTime(10, 30), rules.Fields[0]);
        const gameSlot2: TourneyFieldSlot = new TourneyFieldSlot(TimeWithoutDate.CreateForTime(17), rules.Fields[0]);

        // yes, its before the earliest start, but if its there its there...
        const gameSlot3: TourneyFieldSlot = new TourneyFieldSlot(TimeWithoutDate.CreateForTime(9, 30), rules.Fields[1]);

        const def = new TourneyDef(BracketDefBuilder.getStaticBracketDefinition("T8Bracket"), rules);

        def.AddGame(TourneyGameDef.Create(new GameNum(0), date, gameSlot1));
        def.AddGame(TourneyGameDef.Create(new GameNum(1), date, gameSlot2));
        def.AddGame(TourneyGameDef.Create(new GameNum(3), date, gameSlot3));

        // 9/15/2024 is a sunday...
        const expectedSlots =
        [
            new TourneyFieldSlot(TimeWithoutDate.CreateForTime(12), rules.Fields[1]),
            new TourneyFieldSlot(TimeWithoutDate.CreateForTime(13, 30), rules.Fields[0]),
            new TourneyFieldSlot(TimeWithoutDate.CreateForTime(14, 30), rules.Fields[1]),
            new TourneyFieldSlot(TimeWithoutDate.CreateForTime(17, 0), rules.Fields[1]),
            new TourneyFieldSlot(TimeWithoutDate.CreateForTime(20), rules.Fields[0])
        ];

        const slots = TourneySlots.CreateForAvailableSlotsOnDate(def, date);

        result.assertIsEqual(expectedSlots, slots.Slots);
    }

    static runAllTests(appContext: IAppContext, outStream: StreamWriter)
    {
        TestRunner.runAllTests(this, TestResult, appContext, outStream);
    }
}