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

export class TnSetColumnWidth implements IIntention
{
    m_rangeInfo: RangeInfo;
    m_columnGroupCount: number;
    m_skipColumnGroups: number;
    m_width: number;

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

        const columnAddresses = TnSetColumnWidth.GetRepeatingColumns(this.m_rangeInfo, this.m_columnGroupCount, this.m_skipColumnGroups);
        const ranges = sheet.getRanges(columnAddresses.join(","));

        ranges.format.columnWidth = this.m_width;
    }

    static GetRepeatingColumns(range: RangeInfo, columnGroupCount: number, skipColumnGroups: number): string[]
    {
        let rangeAddresses: string[] = [];
        let col: number = range.FirstColumn;

        while (col < range.FirstColumn + columnGroupCount * ((skipColumnGroups + 1) * range.ColumnCount))
        {
            rangeAddresses.push(`${Ranges.getColName(col)}:${Ranges.getColName(col+range.ColumnCount-1)}`);
            col += (skipColumnGroups + 1) * range.ColumnCount;
        }
        return rangeAddresses;
    }

    static Create(range: RangeInfo, width: number, columnGroupCount = 1, skipColumnGroups = 0, sheet?: string): IIntention
    {
        const tn = new TnSetColumnWidth();

        tn.m_rangeInfo = range;
        tn.m_sheetName = sheet;
        tn.m_columnGroupCount = columnGroupCount;
        tn.m_skipColumnGroups = skipColumnGroups;
        tn.m_width = width;

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



export class TnSetColumnWidthTests
{
    static runAllTests(appContext: IAppContext, outStream: StreamWriter)
    {
        TestRunner.runAllTests(this, TestResult, appContext, outStream);
    }

    static TestGetRepeatingColumns(result: TestResult, range: RangeInfo, columnGroupCount: number, skipColumnGroups: number, expectedAddresses: string[])
    {
        const actual = TnSetColumnWidth.GetRepeatingColumns(range, columnGroupCount, skipColumnGroups);

        result.assertIsEqual(expectedAddresses.join(","), actual.join(","), `SetColumnWidth: ${range.toString()} columnGroupCount=${columnGroupCount} skipColumnGroups=${skipColumnGroups}`);
    }

    static test_testSingleColumnNonRepeating(result: TestResult)
    {
        this.TestGetRepeatingColumns(result, new RangeInfo(0, 1, 1, 1), 1, 0, ["B:B"]);
    }

    static test_testThreeGroupGrepeatingSkip1_1ColumnWide(result: TestResult)
    {
        this.TestGetRepeatingColumns(result, new RangeInfo(0, 1, 1, 1), 3, 0, ["B:B,C:C,D:D"]);
    }

    static test_testThreeGroupGrepeatingSkip3_1ColumnWide(result: TestResult)
    {
        this.TestGetRepeatingColumns(result, new RangeInfo(0, 1, 1, 1), 3, 2, ["B:B,E:E,H:H"]);
    }

    static test_testSingleColumnNonRepeating_2ColumnWide(result: TestResult)
    {
        this.TestGetRepeatingColumns(result, new RangeInfo(0, 1, 1, 2), 1, 0, ["B:C"]);
    }

    static test_testThreeGroupGrepeatingSkip1_2ColumnWide(result: TestResult)
    {
        this.TestGetRepeatingColumns(result, new RangeInfo(0, 1, 1, 2), 3, 0, ["B:C,D:E,F:G"]);
    }

    static test_testThreeGroupGrepeatingSkip3_2ColumnWide(result: TestResult)
    {
        this.TestGetRepeatingColumns(result, new RangeInfo(0, 1, 1, 2), 3, 2, ["B:C,H:I,N:O"]);
    }
}