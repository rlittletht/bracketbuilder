import { IAppContext } from "../AppContext/AppContext";
import { StreamWriter } from "../Support/StreamWriter";
import { TestRunner } from "../Support/TestRunner";
import { TestResult } from "../Support/TestResult";
import { RangeInfo, RepeatType } from "./Ranges";

export class RangeInfoTests
{
    static runAllTests(appContext: IAppContext, outStream: StreamWriter)
    {
        TestRunner.runAllTests(this, TestResult, appContext, outStream);
    }

    static TestOffsetRange(result: TestResult, range: RangeInfo, rowOffset: number, rowCount: number, colOffset: number | undefined, colCount: number | undefined, expectedRange: RangeInfo)
    {
        const actual = range.offset(rowOffset, rowCount, colOffset, colCount);

        result.assertIsEqual(expectedRange, actual, `OffsetRange: ${range.toString()} rowOffset=${rowOffset} rowCount=${rowCount} colOffset=${colOffset} colCount=${colCount} `);
    }

    static TestOffsetGroupRange(result: TestResult, range: RangeInfo, groups: number, expectedRange: RangeInfo)
    {
        const actual = range.offsetGroup(groups);

        result.assertIsEqual(expectedRange, actual, `OffsetGroupRange: ${range.toString()} groups=${groups} `);
    }
}

(() =>
{
    const rangeOffsetTests =
    [
        { test: "Identity", range: new RangeInfo(0, 1, 1, 2), rowOffset: 0, rowCount: 1, colOffset: 0, colCount: 2, expectedRange: new RangeInfo(0, 1, 1, 2) },
        { test: "SingleToSingle", range: new RangeInfo(1, 1, 1, 1), rowOffset: 1, rowCount: 1, colOffset: 1, colCount: 1, expectedRange: new RangeInfo(2, 1, 2, 1) },
        { test: "MultipleToSingle", range: new RangeInfo(1, 3, 3, 3), rowOffset: 1, rowCount: 1, colOffset: 1, colCount: 1, expectedRange: new RangeInfo(2, 1, 4, 1) },
        { test: "MultipleCollapses", range: new RangeInfo(1, 3, 3, 3), rowOffset: 0, rowCount: 1, colOffset: 0, colCount: 1, expectedRange: new RangeInfo(1, 1, 3, 1) },
        { test: "MultipleSingleReverse", range: new RangeInfo(1, 3, 3, 3), rowOffset: -1, rowCount: 1, colOffset: -2, colCount: 1, expectedRange: new RangeInfo(0, 1, 1, 1) },
    ];

    // @formatter:off
    const offsetGroupTests =
    [
        { test: "ColNoPad_Identity",         range: new RangeInfo(0, 1, 1, 2, 3, 0, RepeatType.Column), groups: 0, expectedRange: new RangeInfo(0, 1, 1, 2, 3, 0, RepeatType.Column) },
        { test: "ColNoPad_OneGroup",         range: new RangeInfo(0, 1, 1, 2, 3, 0, RepeatType.Column), groups: 1, expectedRange: new RangeInfo(0, 1, 3, 2, 3, 0, RepeatType.Column) },
        { test: "ColNoPad_OneGroup_Reverse", range: new RangeInfo(0, 1, 5, 2, 3, 0, RepeatType.Column), groups: -1, expectedRange: new RangeInfo(0, 1, 3, 2, 3, 0, RepeatType.Column)},

        { test: "ColOnePad_Identity",         range: new RangeInfo(0, 1, 1, 2, 3, 1, RepeatType.Column), groups: 0, expectedRange: new RangeInfo(0, 1, 1, 2, 3, 1, RepeatType.Column)},
        { test: "ColOnePad_OneGroup",         range: new RangeInfo(0, 1, 1, 2, 3, 1, RepeatType.Column), groups: 1, expectedRange: new RangeInfo(0, 1, 4, 2, 3, 1, RepeatType.Column)},
        { test: "ColOnePad_OneGroup_Reverse", range: new RangeInfo(0, 1, 5, 2, 3, 1, RepeatType.Column), groups: -1, expectedRange: new RangeInfo(0, 1, 2, 2, 3, 1, RepeatType.Column)},
        ];
    // @formatter:on
    const toStringTests =
    [
        { test: "NoRepeat", range: new RangeInfo(0, 1, 1, 2), expectedString: "[0,1]-[0,2]" },
        { test: "ColRepeat", range: new RangeInfo(0, 1, 1, 2, 2, 1, RepeatType.Column), expectedString: "[0,1]-[0,2] C*{2,1}" },
        { test: "RowRepeat", range: new RangeInfo(0, 1, 1, 2, 2, 1, RepeatType.Row), expectedString: "[0,1]-[0,2] R*{2,1}" },
        { test: "RowRange_NoRepeat_Ctor", range: new RangeInfo(0, 1, RangeInfo.MagicColsForRowRange, RangeInfo.MagicColsForRowRange), expectedString: "[0,]-[0,]" },
        { test: "RowRange_NoRepeat", range: RangeInfo.createRowRange(0, 1), expectedString: "[0,]-[0,]" },
        { test: "RowRange_RowRepeat_Ctor", range: new RangeInfo(0, 1, RangeInfo.MagicColsForRowRange, RangeInfo.MagicColsForRowRange, 2, 1, RepeatType.Row), expectedString: "[0,]-[0,] R*{2,1}" },
        { test: "RowRange_RowRepeat", range: RangeInfo.createRowRange(0, 1, 2, 1), expectedString: "[0,]-[0,] R*{2,1}" },
    ];

    const toExcelRangesStringTests =
    [
        { test: "NoRepeat", range: new RangeInfo(0, 1, 1, 2), expectedString: "B1:C1" },
        { test: "ColRepeat", range: new RangeInfo(0, 1, 1, 2, 2, 1, RepeatType.Column), expectedString: "B1:C1,E1:F1" },
        { test: "RowRepeat", range: new RangeInfo(0, 1, 1, 2, 2, 1, RepeatType.Row), expectedString: "B1:C1,B3:C3" },
        { test: "RowRange_NoRepeat_Ctor", range: new RangeInfo(0, 1, RangeInfo.MagicColsForRowRange, RangeInfo.MagicColsForRowRange), expectedString: "1:1" },
        { test: "RowRange_NoRepeat", range: RangeInfo.createRowRange(0, 1), expectedString: "1:1" },
        { test: "RowRange_RowRepeat_Ctor", range: new RangeInfo(0, 1, RangeInfo.MagicColsForRowRange, RangeInfo.MagicColsForRowRange, 2, 1, RepeatType.Row), expectedString: "1:1,3:3" },
        { test: "RowRange_RowRepeat", range: RangeInfo.createRowRange(0, 1, 2, 1), expectedString: "1:1,3:3"},

        { test: "ColRange_NoRepeat_Ctor", range: new RangeInfo(RangeInfo.MagicRowsForColRange, RangeInfo.MagicRowsForColRange, 2, 1), expectedString: "C:C" },
        { test: "ColRange_NoRepeat", range: RangeInfo.createColumnRange(2, 2), expectedString: "C:D"},
        { test: "ColRange_ColRepeat_Ctor", range: new RangeInfo(RangeInfo.MagicRowsForColRange, RangeInfo.MagicRowsForColRange, 2, 1, 2, 1, RepeatType.Column), expectedString: "C:C,E:E" },
        { test: "ColRange_ColRepeat", range: RangeInfo.createColumnRange(2, 1, 2, 1), expectedString: "C:C,E:E" },
    ];

    for (const test of rangeOffsetTests)
    {
        (RangeInfoTests as any)[`test_offset${test.test}`] =
            (result: TestResult) =>
            {
                RangeInfoTests.TestOffsetRange(result, test.range, test.rowOffset, test.rowCount, test.colOffset, test.colCount, test.expectedRange);
            }
    }

    for (const test of offsetGroupTests)
    {
        (RangeInfoTests as any)[`test_offsetGroup${test.test}`] =
            (result: TestResult) =>
            {
                RangeInfoTests.TestOffsetGroupRange(result, test.range, test.groups, test.expectedRange);
            }
    }

    for (const test of toStringTests)
    {
        (RangeInfoTests as any)[`test_toString${test.test}`] =
            (result: TestResult) =>
            {
                const actual = test.range.toString();
                result.assertIsEqual(test.expectedString, actual, `expected=${test.expectedString} actual=${actual}`);
            }
    }

    for (const test of toExcelRangesStringTests)
    {
        (RangeInfoTests as any)[`test_toExcelRangesString${test.test}`] =
            (result: TestResult) =>
            {
                const actual = test.range.toExcelRangesString();
                result.assertIsEqual(test.expectedString, actual, `expected=${test.expectedString} actual=${actual}`);
            }
    }
})();