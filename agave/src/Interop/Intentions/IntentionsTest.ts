import { IAppContext } from "../../AppContext/AppContext";
import { StreamWriter } from "../../Support/StreamWriter";
import { TestResult } from "../../Support/TestResult";
import { TestRunner } from "../../Support/TestRunner";
import { JsCtx } from "../JsCtx";
import { RangeInfo } from "../Ranges";
import { Sheets } from "../Sheets";
import { Intentions } from "./Intentions";
import { TnClearRange } from "./TnClearRange";
import { TnSetFormulas } from "./TnSetFormula";
import { TnUnmergeRange } from "./TnUmergeRange";

export class IntentionsTest
{
    static async runAllTests(appContext: IAppContext, outStream: StreamWriter)
    {
        await TestRunner.runAllTests(this, TestResult, appContext, outStream);
    }

    static async test_FormulaIntention_CurrentWorksheet(result: TestResult)
    {
        result;

        await Excel.run(
            async (ctx) =>
            {
                const context: JsCtx = new JsCtx(ctx);

                const sheet = await Sheets.ensureSheetExists(context, "testSheet");

                sheet.activate();
                await context.sync();

                const tns = new Intentions();

                tns.Add(TnSetFormulas.Create(new RangeInfo(1, 1, 1, 1), [["foo"]]));
                tns.Add(TnSetFormulas.Create(new RangeInfo(2, 1, 1, 1), [["=B2"]]));

                tns.Add(TnUnmergeRange.Create(new RangeInfo(5, 5, 5, 5)));

                tns.Add(TnSetFormulas.Create(new RangeInfo(1, 1, 1, 1), [["foobar"]], "Sheet1"));
                tns.Add(TnSetFormulas.Create(new RangeInfo(2, 1, 1, 1), [["=B2"]], "Sheet1"));

                tns.Add(TnSetFormulas.Create(new RangeInfo(3, 1, 1, 1), [["=B3"]]));
                tns.Add(TnSetFormulas.Create(new RangeInfo(2, 1, 1, 1), [["=Sheet1!B2"]]));

                tns.Add(TnClearRange.Create(new RangeInfo(1, 2, 1, 1)));

                await tns.Execute(context);

                context.releaseAllCacheObjects();
            });
    }
}