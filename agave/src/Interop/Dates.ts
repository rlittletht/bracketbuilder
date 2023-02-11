
class AmPmDecoration
{
    static readonly None = 0;
    static readonly AM = 1;
    static readonly PM = 2;
}

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
            throw Error(`TestOADateTest(${oaDate}): ${expected} != ${actual}`);
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

    static parseNumber(s: string, ichCur: number, ichMax: number): [number, number]
    {
        while (ichCur < ichMax && s[ichCur] == ' ')
            ichCur++;

        if (ichCur == ichMax)
            return [-1, -1];

        const ichDigitStart: number = ichCur;

        while (ichCur < ichMax && s[ichCur] >= '0' && s[ichCur] <= '9')
            ichCur++;

        if (ichCur == ichDigitStart)
            return [0, ichCur];

        const num: number = parseInt(s.substring(ichDigitStart, ichCur));
        return [num, ichCur];
    }

    // return 0 for am or none, 1 for pm, 2 for nothing
    static parseAmPm(s: string, ichCur: number, ichMax: number): AmPmDecoration
    {
        while (ichCur < ichMax && s[ichCur] == ' ')
            ichCur++;

        // check if enough room for AM or PM
        if (ichCur + 1 >= ichMax)
            return AmPmDecoration.None;

        if (s[ichCur + 1] != 'm' && s[ichCur + 1] != 'M')
            return AmPmDecoration.None;

        if (s[ichCur] == 'p' || s[ichCur] == 'P')
            return AmPmDecoration.PM;

        if (s[ichCur] == 'a' || s[ichCur] == 'A')
            return AmPmDecoration.AM;

        return AmPmDecoration.None;
    }

    static MinutesFromTimeString(timeString: string): number
    {
        // parse ##:##[ AM/PM]
        let ichCur: number = 0;
        let ichMax: number = timeString.length;
        let hour: number = 0;
        let min: number = 0;
        let amPm: AmPmDecoration;

        [hour, ichCur] = OADate.parseNumber(timeString, ichCur, ichMax);
        if (hour == -1)
            return -1;

        if (timeString[ichCur] != ':')
            return -1;

        ichCur++;

        [min, ichCur] = OADate.parseNumber(timeString, ichCur, ichMax);
        if (min == -1)
            return -1;

        amPm = OADate.parseAmPm(timeString, ichCur, ichMax);

        // special case
        if (amPm != AmPmDecoration.None && hour == 12)
            hour = 0;

        return (hour * 60 + (12 * 60 * (amPm == AmPmDecoration.PM ? 1 : 0))) + min;
    }

    static TestMinutesFromTimeStringTest(timeString: string, expected: number)
    {
        const actual: number = OADate.MinutesFromTimeString(timeString);

        if (actual != expected)
            throw Error(`TestMinutesFromTimeString(${timeString}): ${expected} != ${actual}`);
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
