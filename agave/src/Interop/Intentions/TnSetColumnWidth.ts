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

        const ranges = Ranges.rangesFromRangeInfo(sheet, this.m_rangeInfo);

        ranges.format.columnWidth = this.m_width;
    }

    static Create(range: RangeInfo, width: number, sheet?: string): IIntention
    {
        const tn = new TnSetColumnWidth();

        tn.m_rangeInfo = range;
        tn.m_sheetName = sheet;
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
