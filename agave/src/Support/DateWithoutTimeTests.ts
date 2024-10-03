import { TestResult } from "./TestResult";
import { IAppContext } from "../AppContext/AppContext";
import { StreamWriter } from "./StreamWriter";
import { TestRunner } from "./TestRunner";
import { DateWithoutTime } from "./DateWithoutTime";

export class DateWithoutTimeTests
{
    static test_DateFromMidnightLocal_FromDateString(result: TestResult)
    {
        const date = DateWithoutTime.CreateForDateString("01 Jul 2023 00:00:00 PDT");

        const expected = DateWithoutTime.CreateForDate(2023, 6, 1);

        result.assertIsEqual(0, expected.CompareTo(date));
    }

    static test_DateOnly_FromDateString(result: TestResult)
    {
        const date = DateWithoutTime.CreateForDateString("9/15/2024");

        const expected = DateWithoutTime.CreateForDate(2024, 8, 15);

        result.assertIsEqual(0, expected.CompareTo(date));
    }

    static test_DateOnly_FromDateString2(result: TestResult)
    {
        const date = DateWithoutTime.CreateForDateString("2024-09-15");

        const expected = new DateWithoutTime(1726358400000);

        result.assertIsEqual(0, expected.CompareTo(date));
    }

    static runAllTests(appContext: IAppContext, outStream: StreamWriter)
    {
        TestRunner.runAllTests(this, TestResult, appContext, outStream);
    }
}