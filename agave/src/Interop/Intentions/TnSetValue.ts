import { JsCtx } from "../JsCtx";
import { RangeInfo, Ranges } from "../Ranges";
import { IIntention } from "./IIntention";
import { IntentionType } from "./IntentionType";

export class TnSetValues implements IIntention
{
    m_rangeInfo: RangeInfo;
    m_sheetName: string;

    m_values: any[][];

    get Type(): IntentionType
    {
        return IntentionType.SetValues;
    }

    Execute(context: JsCtx)
    {
        const sheet: Excel.Worksheet =
            this.m_sheetName == null
                ? context.Ctx.workbook.worksheets.getActiveWorksheet()
                : context.Ctx.workbook.worksheets.getItem(this.m_sheetName);

        const range: Excel.Range = Ranges.rangeFromRangeInfo(sheet, this.m_rangeInfo);

        range.values = this.m_values;
    }

    static Create(range: RangeInfo, values: any[][], sheet?: string): IIntention
    {
        const tn = new TnSetValues();

        tn.m_rangeInfo = range;
        tn.m_values = values;
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