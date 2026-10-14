import { JsCtx } from "../JsCtx";
import { RangeInfo, Ranges } from "../Ranges";
import { IIntention } from "./IIntention";
import { IntentionType } from "./IntentionType";
import { IAppContext } from "../../AppContext/AppContext";
import { StreamWriter } from "../../Support/StreamWriter";
import { TestRunner } from "../../Support/TestRunner";
import { TestResult } from "../../Support/TestResult";
import { OADate } from "../Dates";
import { DateWithoutTime } from "../../Support/DateWithoutTime";

export class TnSetRowHeight implements IIntention
{
    m_rangeInfo: RangeInfo;
    m_rowGroupCount: number;
    m_skipRowGroups: number;
    m_height: number;

    m_sheetName: string;

    get Type(): IntentionType
    {
        return IntentionType.SetColumnWidth;
    }

    Execute(context: JsCtx)
    {
        const sheet: Excel.Worksheet =
            this.m_sheetName == null
                ? context.Ctx.workbook.worksheets.getActiveWorksheet()
                : context.Ctx.workbook.worksheets.getItem(this.m_sheetName);

        const rowAddresses = TnSetRowHeight.GetRepeatingRows(this.m_rangeInfo, this.m_rowGroupCount, this.m_skipRowGroups);
        const ranges = sheet.getRanges(rowAddresses.join(","));

        ranges.format.rowHeight = this.m_height;
    }

    static GetRepeatingRows(range: RangeInfo, rowGroupCount: number, skipRowGroups: number): string[]
    {
        let rangeAddresses: string[] = [];
        let row: number = range.FirstRow;

        while (row < range.FirstRow + rowGroupCount * ((skipRowGroups + 1) * range.RowCount))
        {
            rangeAddresses.push(`${row + 1}:${row + range.RowCount}`);
            row += (skipRowGroups + 1) * range.RowCount;
        }
        return rangeAddresses;
    }

    static Create(range: RangeInfo, height: number, rowGroupCount = 1, skipRowGroups = 0, sheet?: string): IIntention
    {
        const tn = new TnSetRowHeight();

        tn.m_rangeInfo = range;
        tn.m_sheetName = sheet;
        tn.m_rowGroupCount = rowGroupCount;
        tn.m_skipRowGroups = skipRowGroups;
        tn.m_height = height;

        return tn;
    }

    get ComposeTypes(): IntentionType[]
    {
        return [];
    }

    Compose<T extends IIntention>(laterTn: T)
    {
        laterTn;
    }
}



export class TnSetRowHeightTests
{
    static runAllTests(appContext: IAppContext, outStream: StreamWriter)
    {
        TestRunner.runAllTests(this, TestResult, appContext, outStream);
    }

    static TestGetRepeatingRows(result: TestResult, range: RangeInfo, rowGroupCount: number, skipRowGroups: number, expectedAddresses: string[])
    {
        const actual = TnSetRowHeight.GetRepeatingRows(range, rowGroupCount, skipRowGroups);

        result.assertIsEqual(expectedAddresses.join(","), actual.join(","), `SetRowHeight: ${range.toString()} rowGroupCount=${rowGroupCount} skipRowGroups=${skipRowGroups}`);
    }

    static test_testSingleColumnNonRepeating(result: TestResult)
    {
        this.TestGetRepeatingRows(result, new RangeInfo(0, 1, 1, 1), 1, 0, ["1:1"]);
    }

    static test_testThreeGroupGrepeatingSkip1_1ColumnWide(result: TestResult)
    {
        this.TestGetRepeatingRows(result, new RangeInfo(0, 1, 1, 1), 3, 0, ["1:1,2:2,3:3"]);
    }

    static test_testThreeGroupGrepeatingSkip3_1ColumnWide(result: TestResult)
    {
        this.TestGetRepeatingRows(result, new RangeInfo(0, 1, 1, 1), 3, 2, ["1:1,4:4,7:7"]);
    }

    static test_testSingleColumnNonRepeating_2ColumnWide(result: TestResult)
    {
        this.TestGetRepeatingRows(result, new RangeInfo(0, 2, 1, 1), 1, 0, ["1:2"]);

    }

    static test_testThreeGroupGrepeatingSkip1_2ColumnWide(result: TestResult)
    {
        this.TestGetRepeatingRows(result, new RangeInfo(0, 2, 1, 1), 3, 0, ["1:2,3:4,5:6"]);
    }

    static test_testThreeGroupGrepeatingSkip3_2ColumnWide(result: TestResult)
    {
        this.TestGetRepeatingRows(result, new RangeInfo(0, 2, 1, 1), 3, 2, ["1:2,7:8,13:14"]);
    }
}