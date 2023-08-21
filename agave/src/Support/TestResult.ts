// appending text just appends text. Adding items (AddError or AddItem) will adding a leading comma if this isn't the first

// A Note on Comparison/Validation:
// The static methods take an optional TestResult. If you want to verify that a comparison fails and you don't want
// the log to include the comparison failure details, call the static method without a TestResult. It will return the
// success/fail and not log any details.
import { IAppContext } from "../AppContext/AppContext";

export class TestResult
{
    private result: string = "";
    private caseName: string = "";
    private itemCount: number = 0;
    private failed: boolean = false;
    private verbose: boolean = false;
    private appContext: IAppContext;

    constructor(caseName: string, appContext: IAppContext)
    {
        this.caseName = caseName;
        this.appContext = appContext;
    }

    get AppContext(): IAppContext
    {
        return this.appContext;
    }

    /*----------------------------------------------------------------------------
        %%Function: TestResult.setText
    ----------------------------------------------------------------------------*/
    setText(text: string)
    {
        this.result = text;
        this.itemCount = 0;
    }

    /*----------------------------------------------------------------------------
        %%Function: TestResult.appendText
    ----------------------------------------------------------------------------*/
    appendText(text: string)
    {
        this.result += text;
    }

    /*----------------------------------------------------------------------------
        %%Function: TestResult.addError
    ----------------------------------------------------------------------------*/
    addError(text: string)
    {
        if (this.itemCount > 0)
            this.appendText(", ");

        this.appendText(text);
        this.failed = true;
        this.itemCount++;
    }

    /*----------------------------------------------------------------------------
        %%Function: TestResult.addItem
    ----------------------------------------------------------------------------*/
    addItem(text: string)
    {
        if (this.itemCount > 0)
            this.appendText(", ");

        this.appendText(text);
        this.itemCount++;
    }

    static leftHasRight(left: any, right: any, prefix: string = "", testResult: TestResult = null): boolean
    {
        let succeeded = true;

        if (typeof left !== typeof right)
            throw Error(`${prefix}: internal test failure: types disagree ${typeof left} !== typeof right}`);

        try
        {
            for (let key of left.keys())
            {
                if (right[key] === undefined)
                {
                    testResult?.addError(`${prefix}: internal test failure. key ${key} not found`);
                    succeeded = false;
                }
            }
        } catch (e)
        {
            testResult?.addError(`${prefix}: caught excpetion: ${e}`);
            succeeded = false;
        }

        return succeeded;
    }

    assertLeftHasRight(left: any, right: any, prefix: string = ""): boolean
    {
        return TestResult.leftHasRight(left, right, prefix, this);
    }

    static isEqual(expected: any, actual: any, prefix: string = "", testResult: TestResult = null): boolean
    {
        let succeeded = true;
        let equal = false;
        let result = "";

        try
        {
            if (typeof expected !== typeof actual)
            {
                testResult?.addError(`${prefix}: internal test failure: types disagree ${typeof expected} !== ${typeof actual}`);
                succeeded = false;
            }

            if (typeof expected === "object")
            {
                succeeded &&= TestResult.leftHasRight(expected, actual, `${prefix}-expectedHasActual`, testResult);
                succeeded &&= TestResult.leftHasRight(actual, expected, `${prefix}-actualHasExpected`, testResult);

                // compare the parts of the object
                for (let key of expected.keys())
                {
                    succeeded &&= TestResult.isEqual(expected[key], actual[key], `${prefix}[${key}]`, testResult);
                }
            }
            else
            {
                if (expected !== actual)
                {
                    testResult?.addError(`${prefix} expected(${expected}), actual(${actual})`);
                    succeeded = false;
                }
            }
        }
        catch (e)
        {
            testResult?.addError(`${prefix}: caught exception: ${e}`);
            succeeded = false
        }

        return succeeded;
    }

    assertIsEqual(expected: any, actual: any, prefix: string = ""): boolean
    {
        return TestResult.isEqual(expected, actual, prefix, this);
    }

    static isFieldEqual(key: string, expected: any, actual: any, prefix: string = "", testResult: TestResult = null): boolean
    {
        let succeeded = true;

        if (expected[key] == undefined)
        {
            testResult?.addError(`${prefix}expected[${key}] undefined`);
            succeeded = false;
        }
        if (actual[key] == undefined)
        {
            testResult?.addError(`${prefix}actual[${key}] undefined`);
            succeeded = false;
        }

        if (expected[key] != undefined && actual[key] != undefined)
            succeeded &&= TestResult.isEqual(expected[key], actual[key], `${prefix}${key} mismatch`, testResult);

        return succeeded;
    }

    assertFieldIsEqual(key: string, expected: any, actual: any, prefix: string = ""): boolean
    {
        return TestResult.isFieldEqual(key, expected, actual, prefix, this);
    }

    assertNotEqual(expected: any, actual: any, prefix: string = ""): boolean
    {
        // don't collect comparison details...they would be opposite of what we want.
        const isEqual = TestResult.isEqual(expected, actual, prefix, null);

        if (isEqual)
            this.addError(`${prefix} expected(${expected}), actual(${actual})`);

        return isEqual;
    }

    get Failed(): boolean
    {
        return this.failed;
    }

    getResult(verbose: boolean): string
    {
        if (this.failed)
            return (`${this.caseName}: TEST FAILED: ${this.result}`);
        else if (verbose)
            return (`+ ${this.caseName}`);
        else
            return ("+");
    }
}