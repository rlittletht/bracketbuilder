import { AmPmDecoration, Parser, TrimType } from "./Parser";

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

    static TestOADateTest(oaDate: number, expected: Date)
    {
        let actual: Date = OADate.FromOADate(oaDate);

        if (actual.valueOf() != expected.valueOf())
            throw new Error(`TestOADateTest(${oaDate}): ${expected} != ${actual}`);
    }

    static TestFromOADateTests()
    {
        this.TestOADateTest(26400, new Date(1972, 3, 11, 0, 0, 0));
        this.TestOADateTest(25569, new Date(1970, 0, 1, 0, 0, 0));
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

    static TestMinutesFromTimeStringTest(timeString: string, expected: number)
    {
        const actual: number = OADate.MinutesFromTimeString(timeString);

        if (actual != expected)
            throw new Error(`TestMinutesFromTimeString(${timeString}): ${expected} != ${actual}`);
    }

    static TestMinutesFromTimeStringTests()
    {
        OADate.TestMinutesFromTimeStringTest("6:15 AM", 6 * 60 + 15);
        OADate.TestMinutesFromTimeStringTest("6:00 PM", 18 * 60);
        OADate.TestMinutesFromTimeStringTest("6:15 PM", 18 * 60 + 15);
        OADate.TestMinutesFromTimeStringTest("12:00 AM", 0);
        OADate.TestMinutesFromTimeStringTest("12:01 AM", 1);
        OADate.TestMinutesFromTimeStringTest("12:00", 12 * 60);
        OADate.TestMinutesFromTimeStringTest("12:00 PM", 12 * 60);
        OADate.TestMinutesFromTimeStringTest("18:00", 18 * 60);
        OADate.TestMinutesFromTimeStringTest("6:00", 6 * 60);
    }
}
