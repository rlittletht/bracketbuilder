import { IAppContext } from "../AppContext/AppContext";
import { StreamWriter } from "../Support/StreamWriter";
import { TestResult } from "../Support/TestResult";
import { TestRunner } from "../Support/TestRunner";
import { AmPmDecoration, Parser, TrimType } from "./Parser";
import { DateWithoutTime } from "../Support/DateWithoutTime";
import { TimeWithoutDate } from "../Support/TimeWithoutDate";

export class OADate
{
    static oaDateEcmaBase: number = 25569; // this is the OADate for 1/1/1970

    static ToOADate(date: Date): number
    {
        let dMsecEcmaBase: number = date.getTime();

        let dDaysEcmaBase: number = (dMsecEcmaBase / (1000.0 * 60.0 * 60.0 * 24.0));
        return dDaysEcmaBase + this.oaDateEcmaBase;
    }

    static FromOADate(oaDate: number): Date
    {
        let dDaysEcmaBase: number = oaDate - this.oaDateEcmaBase;

        let date: Date = new Date(dDaysEcmaBase * 1000.0 * 60.0 * 60.0 * 24.0);

        date = new Date(date.valueOf() + (1000.0 * 60 * date.getTimezoneOffset()));

        return date;
    }

    static TimeWithoutDateFromOADate(oaDate: number): TimeWithoutDate
    {
        return TimeWithoutDate.CreateForDate(this.FromOADate(oaDate));
    }

    static DateWithoutTimeFromOADate(oaDate: number): DateWithoutTime
    {
        return DateWithoutTime.CreateForDateType(this.FromOADate(oaDate));
    }

    static OATimeFromMinutes(minutes: number): number
    {
        return minutes / (60 * 24);
    }


    static MinutesFromTimeString(timeString: string): number
    {
        // parse ##:##[ AM/PM]
        let ichCur: number = 0;
        let ichMax: number = timeString.length;
        let hour: number = 0;
        let min: number = 0;
        let amPm: AmPmDecoration;

        [hour, ichCur] = Parser.parseNumber(TrimType.LeadingSpace, timeString, ichCur, ichMax);
        if (hour == -1)
            return -1;

        if (timeString[ichCur] != ':')
            return -1;

        ichCur++;

        [min, ichCur] = Parser.parseNumber(TrimType.LeadingSpace, timeString, ichCur, ichMax);
        if (min == -1)
            return -1;

        amPm = Parser.parseAmPm(TrimType.LeadingSpace, timeString, ichCur, ichMax);

        // special case
        if (amPm != AmPmDecoration.None && hour == 12)
            hour = 0;

        return (hour * 60 + (12 * 60 * (amPm == AmPmDecoration.PM ? 1 : 0))) + min;
    }
}

export class OADateTests
{
    static runAllTests(appContext: IAppContext, outStream: StreamWriter)
    {
        TestRunner.runAllTests(this, TestResult, appContext, outStream);
    }

    static TestMinutesFromTimeStringTest(result: TestResult, timeString: string, expected: number)
    {
        const actual: number = OADate.MinutesFromTimeString(timeString);

        result.assertIsEqual(expected, actual, `${timeString}`);
    }

    static test_MinutesFromTimeStringTests(result: TestResult)
    {
        this.TestMinutesFromTimeStringTest(result, "6:15 AM", 6 * 60 + 15);
        this.TestMinutesFromTimeStringTest(result, "6:00 PM", 18 * 60);
        this.TestMinutesFromTimeStringTest(result, "6:15 PM", 18 * 60 + 15);
        this.TestMinutesFromTimeStringTest(result, "12:00 AM", 0);
        this.TestMinutesFromTimeStringTest(result, "12:01 AM", 1);
        this.TestMinutesFromTimeStringTest(result, "12:00", 12 * 60);
        this.TestMinutesFromTimeStringTest(result, "12:00 PM", 12 * 60);
        this.TestMinutesFromTimeStringTest(result, "18:00", 18 * 60);
        this.TestMinutesFromTimeStringTest(result, "6:00", 6 * 60);
    }


    static TestOADateTest(result: TestResult, oaDate: number, expected: Date, expectedDateWithoutTime: DateWithoutTime)
    {
        const expectedDateWithoutTimeCalc = DateWithoutTime.CreateForDateType(expected);

        const actual: Date = OADate.FromOADate(oaDate);
        const actualDateWithoutTime: DateWithoutTime = OADate.DateWithoutTimeFromOADate(oaDate);

        result.assertIsEqual(expected.valueOf(), actual.valueOf(), `${oaDate}`);
        result.assertIsEqual(true, expectedDateWithoutTime.Equals(actualDateWithoutTime), `${oaDate}`);
        result.assertIsEqual(true, expectedDateWithoutTimeCalc.Equals(actualDateWithoutTime), `${oaDate}`);
    }

    static test_FromOADateTests(result: TestResult)
    {
        this.TestOADateTest(result, 26400, new Date(1972, 3, 11, 0, 0, 0), DateWithoutTime.CreateForDate(1972, 3, 11));
        this.TestOADateTest(result, 25569, new Date(1970, 0, 1, 0, 0, 0), DateWithoutTime.CreateForDate(1970, 0, 1));
    }
}