import { JsCtx } from "../JsCtx";
import { RangeInfo, Ranges } from "../Ranges";
import { IIntention } from "./IIntention";
import { IntentionType } from "./IntentionType";

export class TnSetFontBold implements IIntention
{
    m_rangeInfo: RangeInfo;
    m_sheetName: string;

    m_fontBold: boolean;

    get Type(): IntentionType
    {
        return IntentionType.SetFontBold;
    }

    Execute(context: JsCtx)
    {
        const sheet: Excel.Worksheet =
            this.m_sheetName == null
                ? context.Ctx.workbook.worksheets.getActiveWorksheet()
                : context.Ctx.workbook.worksheets.getItem(this.m_sheetName);

        const range: Excel.Range = Ranges.rangeFromRangeInfo(sheet, this.m_rangeInfo);

        range.format.font.bold = this.m_fontBold

    }

    static Create(range: RangeInfo, fontBold: boolean, sheet?: string): IIntention
    {
        const tn = new TnSetFontBold();

        tn.m_rangeInfo = range;
        tn.m_fontBold = fontBold;
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