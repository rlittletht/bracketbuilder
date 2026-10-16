import { JsCtx } from "../JsCtx";
import { RangeInfo, Ranges } from "../Ranges";
import { IIntention } from "./IIntention";
import { IntentionType } from "./IntentionType";

export class TnSetFontUnderline implements IIntention
{
    m_rangeInfo: RangeInfo;
    m_sheetName: string;

    m_fontUnderline: Excel.RangeUnderlineStyle;

    get Type(): IntentionType
    {
        return IntentionType.SetFontUnderline;
    }

    Execute(context: JsCtx)
    {
        const sheet: Excel.Worksheet =
            this.m_sheetName == null
                ? context.Ctx.workbook.worksheets.getActiveWorksheet()
                : context.Ctx.workbook.worksheets.getItem(this.m_sheetName);

        const range: Excel.Range = Ranges.rangeFromRangeInfo(sheet, this.m_rangeInfo);

        range.format.font.underline = this.m_fontUnderline;

    }

    static Create(range: RangeInfo, fontUnderline: Excel.RangeUnderlineStyle, sheet?: string): IIntention
    {
        const tn = new TnSetFontUnderline();

        tn.m_rangeInfo = range;
        tn.m_fontUnderline = fontUnderline;
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