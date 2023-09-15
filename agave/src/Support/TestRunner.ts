import { TestResult } from "./TestResult";
import { IAppContext } from "../AppContext/AppContext";
import { StreamWriter } from "./StreamWriter";

interface SetupDelegate
{
    (): void;
}

export class TestRunner
{
    static verbose: boolean = false;

    // this clever hackery is courtesy chatgpt...i admit I don't understand how the various templating
    // interacts with the arguments (which are classes, but not objects, but treated as objects??)
    static runAllTests<T1 extends new() => any, T2 extends TestResult>(staticClassType: T1, ctor: new(testName: string, appContext: IAppContext) => T2, appContext: IAppContext, outStream: StreamWriter)
    {
        let output: string = `${staticClassType.name}:`;
        if (TestRunner.verbose)
            output += "\n=====================================================";

        const staticTests: string[] =
            Object.getOwnPropertyNames(staticClassType).filter(
                ((name) => typeof staticClassType[name] === "function" && name.includes("test_")));

        const setupTest: SetupDelegate = staticClassType["SetupPreconditions"] ? staticClassType["SetupPreconditions"] : () => {};

        for (let testFunctionName of staticTests)
        {
            const result = new ctor(testFunctionName, appContext);

            setupTest();
            staticClassType[testFunctionName](result);

            if (result.Failed || TestRunner.verbose)
                output += "\n";

            output += result.getResult(TestRunner.verbose);
        }
        outStream.writeLine(output);
    }

    static async runAllTestsAsync<T1 extends new() => any, T2 extends TestResult>(staticClassType: T1, ctor: new(testName: string, appContext: IAppContext) => T2, appContext: IAppContext, outStream: StreamWriter)
    {
        let output: string = `${staticClassType.name}:`;
        if (TestRunner.verbose)
            output += "\n=====================================================";

        const staticTests: string[] =
            Object.getOwnPropertyNames(staticClassType).filter(
                ((name) => typeof staticClassType[name] === "function" && name.includes("test_")));

        const setupTest: SetupDelegate = staticClassType["SetupPreconditions"] ? staticClassType["SetupPreconditions"] : () => {};

        for (let testFunctionName of staticTests)
        {
            const result = new ctor(testFunctionName, appContext);

            setupTest();
            await staticClassType[testFunctionName](result);

            if (result.Failed || TestRunner.verbose)
                output += "\n";

            output += result.getResult(TestRunner.verbose);
        }
        outStream.writeLine(output);
    }
}