import { JsCtx } from "../JsCtx";
import { RangeInfo, Ranges } from "../Ranges";
import { IIntention } from "./IIntention";
import { IntentionType } from "./IntentionType";

export class TnSetNumberFormat implements IIntention
{
    m_rangeInfo: RangeInfo;
    m_sheetName: string;

    m_numberFormats: any[][];

    get Type(): IntentionType
    {
        return IntentionType.SetNumberFormat;
    }

    Execute(context: JsCtx)
    {
        const sheet: Excel.Worksheet =
            this.m_sheetName == null
                ? context.Ctx.workbook.worksheets.getActiveWorksheet()
                : context.Ctx.workbook.worksheets.getItem(this.m_sheetName);

        const range: Excel.Range = Ranges.rangeFromRangeInfo(sheet, this.m_rangeInfo);

        range.numberFormat = this.m_numberFormats;
    }

    static Create(range: RangeInfo, numberFormats: any[][], sheet?: string): IIntention
    {
        const tn = new TnSetNumberFormat();

        tn.m_rangeInfo = range;
        tn.m_numberFormats = numberFormats;
        tn.m_sheetName = sheet;

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