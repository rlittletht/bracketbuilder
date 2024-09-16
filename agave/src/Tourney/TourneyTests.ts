import { IAppContext } from "../AppContext/AppContext";
import { StreamWriter } from "../Support/StreamWriter";
import { TestRunner } from "../Support/TestRunner";
import { TestResult } from "../Support/TestResult";
import { TourneyDaysOfWeek } from "./TourneyDaysOfWeek";

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

    static runAllTests(appContext: IAppContext, outStream: StreamWriter)
    {
        TestRunner.runAllTests(this, TestResult, appContext, outStream);
    }
}