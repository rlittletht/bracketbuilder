

export class AmPmDecoration
{
    static readonly None = 0;
    static readonly AM = 1;
    static readonly PM = 2;
}

export class TrimType
{
    static readonly None = 0;
    static readonly LeadingSpace = 1;
}

export class Quoting
{
    static readonly None = 0;
    static readonly Literal = 1;
}

export class ParseStringAccepts
{
    static readonly Alpha = 0;
    static readonly Numeric = 1;
    static readonly AlphaNumeric = 2;
}

export class Parser
{
    static parseNumber(trim: TrimType, s: string, ichCur: number, ichMax: number): [number, number]
    {
        if (trim != TrimType.None)
        {
            while (ichCur < ichMax && s[ichCur] == ' ')
                ichCur++;
        }

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
    static parseAmPm(trim: TrimType, s: string, ichCur: number, ichMax: number): AmPmDecoration
    {
        if (trim == TrimType.LeadingSpace)
        {
            while (ichCur < ichMax && s[ichCur] == ' ')
                ichCur++;
        }

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

    static parseWhitespace(s: string, ichCur: number, ichMax: number): number
    {
        while (ichCur < ichMax && s[ichCur] == ' ')
            ichCur++;

        return ichCur;
    }

    static parseGetChar(s: string, ichCur: number, ichMax: number): [string, number]
    {
        if (ichCur >= ichMax)
            return [null, ichMax];


        return [s[ichCur], ++ichCur];
    }

    static parseString(
        trim: TrimType,
        quoting: Quoting,
        accepts: ParseStringAccepts,
        str: string,
        ichCur: number,
        ichMax: number): [string, number]
    {
        if (trim == TrimType.LeadingSpace)
        {
            while (ichCur < ichMax && str[ichCur] == ' ')
                ichCur++;
        }

        let matchQuote: string = null;
        let ch: string = "";
        let ichStart: number = -1;

        while (true)
        {
            const ichStartLoop = ichCur;

            [ch, ichCur] = Parser.parseGetChar(str, ichCur, ichMax);

            if (ch == null)
            {
                if (matchQuote != null)
                    return [null, 0];

                if (ichStart == -1)
                    return ["", ichCur];

                return [str.substring(ichStart, ichCur), ichCur];
            }

            if (ichStart == -1 && quoting == Quoting.Literal && ch == '\'')
            {
                matchQuote = ch;
                ichStart = ichCur - 1;
                continue;
            }

            if (ichStart != -1 && matchQuote == ch)
                return [str.substring(ichStart, ichCur), ichCur];

            if (matchQuote == null)
            {
                // we will stop if we see a non character
                if (!((ch >= '0' && ch <= '9' && accepts != ParseStringAccepts.Alpha)
                    || (ch >= 'a' && ch <= 'z' && accepts != ParseStringAccepts.Numeric)
                    || (ch >= 'A' && ch <= 'Z' && accepts != ParseStringAccepts.Numeric)))
                {
                    if (ichStart == -1)
                        return ["", ichCur - 1];

                    // unget the symbol
                    return [str.substring(ichStart, ichCur - 1), ichCur - 1];
                }
            }

            if (ichStart == -1)
                ichStart = ichStartLoop;
            // otherwise just continue...
        }
    }

    static parseExcelColumnRowReference(addr: string, ichCur: number, ichMax: number):
        [string | undefined, boolean | undefined, number | undefined, boolean | undefined, number]
    {
        let fColAbsolute: boolean = false;
        let fRowAbsolute: boolean = false;

        if (addr[ichCur] == "$")
        {
            fColAbsolute = true;
            ichCur++;
        }

        if (ichCur >= ichMax)
            return [undefined, undefined, undefined, undefined, ichCur];

        let colRef: string;

        [colRef, ichCur] = this.parseString(TrimType.None, Quoting.None, ParseStringAccepts.Alpha, addr, ichCur, ichMax);

        if (colRef == "")
            return [undefined, undefined, undefined, undefined, ichCur];

        if (addr[ichCur] == "$")
        {
            fRowAbsolute = true;
            ichCur++;
        }

        let rowRef: string;
        [rowRef, ichCur] = this.parseString(TrimType.None, Quoting.None, ParseStringAccepts.Numeric, addr, ichCur, ichMax);
        if (rowRef == "")
            return [colRef, fColAbsolute, undefined, undefined, ichCur];

        return [colRef, fColAbsolute, parseInt(rowRef), fRowAbsolute, ichCur];

        //            return [undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, ichCur];
    }

    /*----------------------------------------------------------------------------
        %%Function: Parser.parseExcelSimpleAddress

        Parse the address at the current location in the string.

        Return [Column Name, fFixedColumn, Row Number, fFixedRow, ichCur]
    ----------------------------------------------------------------------------*/
    static parseExcelSimpleAddress(trim: TrimType, addr: string, ichCur: number, ichMax: number):
        [string | undefined, boolean | undefined, number | undefined, boolean | undefined, string | undefined, boolean | undefined, number | undefined, boolean | undefined, number]
    {
        if (trim == TrimType.LeadingSpace)
        {
            while (ichCur < ichMax && addr[ichCur] == ' ')
                ichCur++;
        }

        let fColAbsolute1: boolean | undefined;
        let fRowAbsolute1: boolean | undefined;
        let colRef1: string | undefined;
        let rowRef1: number | undefined;

        let fColAbsolute2: boolean | undefined;
        let fRowAbsolute2: boolean | undefined;
        let colRef2: string | undefined;
        let rowRef2: number | undefined;

        [colRef1, fColAbsolute1, rowRef1, fRowAbsolute1, ichCur] = this.parseExcelColumnRowReference(addr, ichCur, ichMax);

        if (ichCur >= ichMax || addr[ichCur] != ":")
            return [colRef1, fColAbsolute1, rowRef1, fRowAbsolute1, colRef2, fColAbsolute2, rowRef2, fRowAbsolute2, ichCur];

        ichCur++; // move past the :

        [colRef2, fColAbsolute2, rowRef2, fRowAbsolute2, ichCur] = this.parseExcelColumnRowReference(addr, ichCur, ichMax);
        return [colRef1, fColAbsolute1, rowRef1, fRowAbsolute1, colRef2, fColAbsolute2, rowRef2, fRowAbsolute2, ichCur];
    }

    /*----------------------------------------------------------------------------
        %%Function: Parser.parseExcelFullAddress

        Parses an optional sheet name before the address
    ----------------------------------------------------------------------------*/
    static parseExcelFullAddress(trim: TrimType, addr: string, ichCur: number, ichMax: number):
        [string | undefined, string | undefined, boolean | undefined, number | undefined, boolean | undefined, string | undefined, boolean | undefined, number | undefined, boolean | undefined, number]
    {
        let sheetName: string;
        let ichAfterSheet: number;

        [sheetName, ichAfterSheet] = this.parseString(trim, Quoting.Literal, ParseStringAccepts.AlphaNumeric, addr, ichCur, ichMax);

        // see if there is actually a sheet name there...
        if (ichAfterSheet >= ichMax || addr[ichAfterSheet] != "!")
        {
            // no sheet, reset
            sheetName = undefined;
        }
        else
        {
            ichCur = ichAfterSheet + 1; // skip the !
        }

        let [colRef1, fColAbsolute1, rowRef1, fRowAbsolute1, colRef2, fColAbsolute2, rowRef2, fRowAbsolute2, ichCurAfter] =
            Parser.parseExcelSimpleAddress(TrimType.LeadingSpace, addr, ichCur, ichMax);

        return [sheetName, colRef1, fColAbsolute1, rowRef1, fRowAbsolute1, colRef2, fColAbsolute2, rowRef2, fRowAbsolute2, ichCurAfter];
    }
}

export class ParserTests
{
    static testParseStringTest(trim: TrimType, quoting: Quoting, accepts: ParseStringAccepts, s: string, ichCur: number, ichMax: number, expected: string, ichExpected: number)
    {
        let [actual, ichActual] = Parser.parseString(trim, quoting, accepts, s, ichCur, ichMax);

        if (actual != expected)
            throw Error(`testParseString: trim/quoting/s/ichCur/ichMax(${trim}, ${quoting}, ${s}, ${ichCur}, ${ichMax}), expected(${expected}) != actual(${actual})`);

        if (ichActual != ichExpected)
            throw Error(`testParseString: trim/quoting/s/ichCur/ichMax(${trim}, ${quoting}, ${s}, ${ichCur}, ${ichMax}), ichExpected(${ichExpected}) != ichActual(${ichActual})`);
    }

    static testParseStringTests()
    {
        this.testParseStringTest(TrimType.LeadingSpace, Quoting.Literal, ParseStringAccepts.AlphaNumeric, "test", 0, 4, "test", 4);
        this.testParseStringTest(TrimType.LeadingSpace, Quoting.Literal, ParseStringAccepts.AlphaNumeric, " test", 0, 5, "test", 5);
        this.testParseStringTest(TrimType.LeadingSpace, Quoting.Literal, ParseStringAccepts.AlphaNumeric, " !test", 0, 5, "", 1);
        this.testParseStringTest(TrimType.LeadingSpace, Quoting.Literal, ParseStringAccepts.AlphaNumeric, "!test", 0, 4, "", 0);
        this.testParseStringTest(TrimType.LeadingSpace, Quoting.Literal, ParseStringAccepts.AlphaNumeric, "'!test'", 0, 7, "'!test'", 7);
        this.testParseStringTest(TrimType.LeadingSpace, Quoting.Literal, ParseStringAccepts.AlphaNumeric, "!'!test'", 1, 8, "'!test'", 8);
        this.testParseStringTest(TrimType.LeadingSpace, Quoting.Literal, ParseStringAccepts.AlphaNumeric, "Sheet1!$A1B1", 0, 12, "Sheet1", 6);
        this.testParseStringTest(TrimType.LeadingSpace, Quoting.Literal, ParseStringAccepts.AlphaNumeric, "te12", 0, 4, "te12", 4);
        this.testParseStringTest(TrimType.LeadingSpace, Quoting.Literal, ParseStringAccepts.Alpha, "te12", 0, 4, "te", 2);
        this.testParseStringTest(TrimType.LeadingSpace, Quoting.Literal, ParseStringAccepts.Numeric, "te12", 0, 4, "", 0);
        this.testParseStringTest(TrimType.LeadingSpace, Quoting.Literal, ParseStringAccepts.Numeric, "te12", 2, 4, "12", 4);
    }

    static testParseExcelColumnRowReferenceTest(
        addr: string,
        ichCur: number,
        ichMax: number,
        colRefExpected: string | undefined,
        fColAbsoluteExpected: boolean | undefined,
        rowRefExpected: number | undefined,
        fRowAbsoluteExpected: boolean | undefined,
        ichExpected: number)
    {
        const AssertEqual = (e: any, a: any) =>
        {
            if (a != e)
                throw Error(`testParseExcelColumnRowReferenceTest: addr/ichCur/ichMax(${addr}, ${ichCur}, ${ichMax}), expected(${e}) != actual(${a})`);
        }

        let fColAbsoluteActual: boolean | undefined;
        let fRowAbsoluteActual: boolean | undefined;
        let colRefActual: string | undefined;
        let rowRefActual: number | undefined;

        [colRefActual, fColAbsoluteActual, rowRefActual, fRowAbsoluteActual, ichCur] = Parser.parseExcelColumnRowReference(addr, ichCur, ichMax);

        AssertEqual(colRefExpected, colRefActual);
        AssertEqual(rowRefExpected, rowRefActual);
        AssertEqual(fRowAbsoluteExpected, fRowAbsoluteActual);
        AssertEqual(fColAbsoluteExpected, fColAbsoluteActual);
        AssertEqual(ichExpected, ichCur);
    }

    static testParseExcelColumnRowReferenceTests()
    {
        this.testParseExcelColumnRowReferenceTest("A1", 0, 2, "A", false, 1, false, 2);
        this.testParseExcelColumnRowReferenceTest("$A1", 0, 3, "A", true, 1, false, 3);
        this.testParseExcelColumnRowReferenceTest("$A$1", 0, 4, "A", true, 1, true, 4);
        this.testParseExcelColumnRowReferenceTest("A$1", 0, 3, "A", false, 1, true, 3);
        this.testParseExcelColumnRowReferenceTest("AA$1", 0, 4, "AA", false, 1, true, 4);
        this.testParseExcelColumnRowReferenceTest("AA$1:", 0, 5, "AA", false, 1, true, 4);
    }

    static testParseExcelAddressTest(
        addr: string,
        ichCur: number,
        ichMax: number,
        colRefExpected1: string | undefined,
        fColAbsoluteExpected1: boolean | undefined,
        rowRefExpected1: number | undefined,
        fRowAbsoluteExpected1: boolean | undefined,
        colRefExpected2: string | undefined,
        fColAbsoluteExpected2: boolean | undefined,
        rowRefExpected2: number | undefined,
        fRowAbsoluteExpected2: boolean | undefined,
        ichExpected: number)
    {
        const AssertEqual = (e: any, a: any) =>
        {
            if (a != e)
                throw Error(`testParseExcelColumnRowReferenceTest: addr/ichCur/ichMax(${addr}, ${ichCur}, ${ichMax}), expected(${e}) != actual(${a})`);
        }

        let [colRefActual1, fColAbsoluteActual1, rowRefActual1, fRowAbsoluteActual1, colRefActual2, fColAbsoluteActual2, rowRefActual2, fRowAbsoluteActual2, ichCurActual] = Parser.parseExcelSimpleAddress(TrimType.LeadingSpace, addr, ichCur, ichMax);

        AssertEqual(      colRefExpected1,       colRefActual1);
        AssertEqual(      rowRefExpected1,       rowRefActual1);
        AssertEqual(fRowAbsoluteExpected1, fRowAbsoluteActual1);
        AssertEqual(fColAbsoluteExpected1, fColAbsoluteActual1);
        AssertEqual(      colRefExpected2,       colRefActual2);
        AssertEqual(      rowRefExpected2,       rowRefActual2);
        AssertEqual(fRowAbsoluteExpected2, fRowAbsoluteActual2);
        AssertEqual(fColAbsoluteExpected2, fColAbsoluteActual2);
        AssertEqual(ichExpected, ichCurActual);
    }

    static testParseExcelFullAddressTest(
        addr: string,
        ichCur: number,
        ichMax: number,
        sheetNameExpected: string | undefined,
        colRefExpected1: string | undefined,
        fColAbsoluteExpected1: boolean | undefined,
        rowRefExpected1: number | undefined,
        fRowAbsoluteExpected1: boolean | undefined,
        colRefExpected2: string | undefined,
        fColAbsoluteExpected2: boolean | undefined,
        rowRefExpected2: number | undefined,
        fRowAbsoluteExpected2: boolean | undefined,
        ichExpected: number)
    {
        const AssertEqual = (e: any, a: any) =>
        {
            if (a != e)
                throw Error(`testParseExcelColumnRowReferenceTest: addr/ichCur/ichMax(${addr}, ${ichCur}, ${ichMax}), expected(${e}) != actual(${a})`);
        }

        let [sheetNameActual, colRefActual1, fColAbsoluteActual1, rowRefActual1, fRowAbsoluteActual1, colRefActual2, fColAbsoluteActual2, rowRefActual2, fRowAbsoluteActual2, ichCurActual] =
            Parser.parseExcelFullAddress(TrimType.LeadingSpace, addr, ichCur, ichMax);

        AssertEqual(colRefExpected1, colRefActual1);
        AssertEqual(rowRefExpected1, rowRefActual1);
        AssertEqual(fRowAbsoluteExpected1, fRowAbsoluteActual1);
        AssertEqual(fColAbsoluteExpected1, fColAbsoluteActual1);
        AssertEqual(colRefExpected2, colRefActual2);
        AssertEqual(rowRefExpected2, rowRefActual2);
        AssertEqual(fRowAbsoluteExpected2, fRowAbsoluteActual2);
        AssertEqual(fColAbsoluteExpected2, fColAbsoluteActual2);
        AssertEqual(ichExpected, ichCurActual);
        AssertEqual(sheetNameExpected, sheetNameActual);
    }

    static testParseExcelAddressTests()
    {
        this.testParseExcelAddressTest("A:B", 0, 3, "A", false, undefined, undefined, "B", false, undefined, undefined, 3);
        this.testParseExcelAddressTest("A1:B2", 0, 5, "A", false, 1, false, "B", false, 2, false, 5);
        this.testParseExcelAddressTest("A1", 0, 2, "A", false, 1, false, undefined, undefined, undefined, undefined, 2);
        this.testParseExcelAddressTest("$A1", 0, 3, "A", true, 1, false, undefined, undefined, undefined, undefined, 3);
        this.testParseExcelAddressTest("$A$1", 0, 4, "A", true, 1, true, undefined, undefined, undefined, undefined, 4);
        this.testParseExcelAddressTest("A$1", 0, 3, "A", false, 1, true, undefined, undefined, undefined, undefined, 3);
        this.testParseExcelAddressTest("AA$1", 0, 4, "AA", false, 1, true, undefined, undefined, undefined, undefined, 4);
        this.testParseExcelAddressTest("AA$1:", 0, 5, "AA", false, 1, true, undefined, undefined, undefined, undefined, 5);

        this.testParseExcelFullAddressTest("AA$1:", 0, 5, undefined, "AA", false, 1, true, undefined, undefined, undefined, undefined, 5);
        this.testParseExcelFullAddressTest("Sheet1!AA$1:", 0, 12, "Sheet1", "AA", false, 1, true, undefined, undefined, undefined, undefined, 12);
        this.testParseExcelFullAddressTest("'My S'!AA$1:", 0, 12, "'My S'", "AA", false, 1, true, undefined, undefined, undefined, undefined, 12);
        this.testParseExcelFullAddressTest("'M! S'!AA$1:", 0, 12, "'M! S'", "AA", false, 1, true, undefined, undefined, undefined, undefined, 12);
    }
}