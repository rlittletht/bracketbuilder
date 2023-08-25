import { JsCtx } from "../JsCtx";
import { RangeInfo, Ranges } from "../Ranges";
import { IIntention } from "./IIntention";
import { IntentionType } from "./IntentionType";

export class TnSetVerticalAlignment implements IIntention
{
    m_rangeInfo: RangeInfo;
    m_sheetName: string;

    m_verticalAlignment: Excel.VerticalAlignment;

    get Type(): IntentionType
    {
        return IntentionType.SetVerticalAlignment;
    }

    Execute(context: JsCtx)
    {
        const sheet: Excel.Worksheet =
            this.m_sheetName == null
                ? context.Ctx.workbook.worksheets.getActiveWorksheet()
                : context.Ctx.workbook.worksheets.getItem(this.m_sheetName);

        const range: Excel.Range = Ranges.rangeFromRangeInfo(sheet, this.m_rangeInfo);

        range.format.verticalAlignment = this.m_verticalAlignment;
    }

    static Create(range: RangeInfo, verticalAlignment: Excel.VerticalAlignment, sheet?: string): IIntention
    {
        const tn = new TnSetVerticalAlignment();

        tn.m_rangeInfo = range;
        tn.m_verticalAlignment = verticalAlignment;
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