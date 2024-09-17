import { IAppContext } from "../AppContext/AppContext";
import { StreamWriter } from "./StreamWriter";
import { TestRunner } from "./TestRunner";
import { TestResult } from "./TestResult";
import { TimeWithoutDate } from "./TimeWithoutDate";

export class TimeWithoutDateTests
{
    static test_Midnight_FromDateLocalPST(result: TestResult)
    {
        const time = TimeWithoutDate.CreateForDate(new Date(Date.parse("01 Jan 2023 00:00:00 PST")));
        const expected = new TimeWithoutDate(0);

        result.assertIsEqual(0, TimeWithoutDate.Compare(expected, time));
    }

    static test_Midnight_FromDateLocalPDT(result: TestResult)
    {
        const time = TimeWithoutDate.CreateForDate(new Date(Date.parse("01 Jul 2023 00:00:00 PDT")));
        const expected = new TimeWithoutDate(0);

        result.assertIsEqual(0, TimeWithoutDate.Compare(expected, time));
    }

    static test_Midnight_NoTimezone(result: TestResult)
    {
        const time = TimeWithoutDate.CreateForDate(new Date(Date.parse("01 Jul 2023 00:00:00")));
        const expected = new TimeWithoutDate(0);

        result.assertIsEqual(0, TimeWithoutDate.Compare(expected, time));
    }

    static test_Midnight_FromTimeString(result: TestResult)
    {
        const time = TimeWithoutDate.CreateForTimeString("00:00:00");
        const expected = new TimeWithoutDate(0);

        result.assertIsEqual(0, TimeWithoutDate.Compare(expected, time));
    }

    static test_Midnight_FromTimeAllArguments(result: TestResult)
    {
        const time = TimeWithoutDate.CreateForTime(0, 0, 0, 0);
        const expected = new TimeWithoutDate(0);

        result.assertIsEqual(0, TimeWithoutDate.Compare(expected, time));
    }

    static test_Midnight_FromTimeOnlyHour(result: TestResult)
    {
        const time = TimeWithoutDate.CreateForTime(0);
        const expected = new TimeWithoutDate(0);

        result.assertIsEqual(0, TimeWithoutDate.Compare(expected, time));
    }

    static test_NotMidnight_FromTimeAllArguments(result: TestResult)
    {
        const time = TimeWithoutDate.CreateForTime(23, 58, 57, 56);
        const expected = new TimeWithoutDate(23 * TimeWithoutDate.s_msecPerHour + 58 * TimeWithoutDate.s_msecPerMinute + 57 * TimeWithoutDate.s_msecPerSecond + 56);

        result.assertIsEqual(0, TimeWithoutDate.Compare(expected, time));
    }

    static test_NotMidnight_FromTimeNoMsec(result: TestResult)
    {
        const time = TimeWithoutDate.CreateForTime(23, 58, 57);
        const expected = new TimeWithoutDate(23 * TimeWithoutDate.s_msecPerHour + 58 * TimeWithoutDate.s_msecPerMinute + 57 * TimeWithoutDate.s_msecPerSecond);

        result.assertIsEqual(0, TimeWithoutDate.Compare(expected, time));
    }

    static test_NotMidnight_FromTimeOnlyHour(result: TestResult)
    {
        const time = TimeWithoutDate.CreateForTime(23);
        const expected = new TimeWithoutDate(23 * TimeWithoutDate.s_msecPerHour);

        result.assertIsEqual(0, TimeWithoutDate.Compare(expected, time));
    }

    static test_NotMidnight_FromTimeOnlyHour_ParseVerify(result: TestResult)
    {
        const time = TimeWithoutDate.CreateForTime(23);
        const expected = TimeWithoutDate.CreateForTimeString("23:00");

        result.assertIsEqual(0, TimeWithoutDate.Compare(expected, time));
    }

    static test_NotMidnight_FromTimeString(result: TestResult)
    {
        const time = TimeWithoutDate.CreateForTimeString("23:59:59");
        const expected = new TimeWithoutDate(23 * TimeWithoutDate.s_msecPerHour + 59 * TimeWithoutDate.s_msecPerMinute + 59 * TimeWithoutDate.s_msecPerSecond);

        result.assertIsEqual(0, TimeWithoutDate.Compare(expected, time));
    }

    static test_CompareLessThan_NoTimezone(result: TestResult)
    {
        const time1 = TimeWithoutDate.CreateForTimeString("18:00:00");
        const time2 = TimeWithoutDate.CreateForTimeString("21:00:00");

        result.assertIsEqual(true, TimeWithoutDate.Compare(time1, time2) < 0);
        result.assertIsEqual(true, time1.CompareTo(time2) < 0);
    }

    static runAllTests(appContext: IAppContext, outStream: StreamWriter)
    {
        TestRunner.runAllTests(this, TestResult, appContext, outStream);
    }
}