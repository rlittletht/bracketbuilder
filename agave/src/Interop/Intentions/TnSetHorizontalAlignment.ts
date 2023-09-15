import { JsCtx } from "../JsCtx";
import { RangeInfo, Ranges } from "../Ranges";
import { IIntention } from "./IIntention";
import { IntentionType } from "./IntentionType";

export class TnSetHorizontalAlignment implements IIntention
{
    m_rangeInfo: RangeInfo;
    m_sheetName: string;

    m_horizontalAlignment: Excel.HorizontalAlignment;

    get Type(): IntentionType
    {
        return IntentionType.SetHorizontalAlignment;
    }

    Execute(context: JsCtx)
    {
        const sheet: Excel.Worksheet =
            this.m_sheetName == null
                ? context.Ctx.workbook.worksheets.getActiveWorksheet()
                : context.Ctx.workbook.worksheets.getItem(this.m_sheetName);

        const range: Excel.Range = Ranges.rangeFromRangeInfo(sheet, this.m_rangeInfo);

        range.format.horizontalAlignment = this.m_horizontalAlignment;
    }

    static Create(range: RangeInfo, horizontalAlignment: Excel.HorizontalAlignment, sheet?: string): IIntention
    {
        const tn = new TnSetHorizontalAlignment();

        tn.m_rangeInfo = range;
        tn.m_horizontalAlignment = horizontalAlignment;
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