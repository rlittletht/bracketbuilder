import { JsCtx } from "../JsCtx";
import { RangeInfo, Ranges } from "../Ranges";
import { IIntention } from "./IIntention";
import { IntentionType } from "./IntentionType";

export class TnSetFontInfo implements IIntention
{
    m_rangeInfo: RangeInfo;
    m_sheetName: string;

    m_fontName: string;
    m_fontSize: number;

    get Type(): IntentionType
    {
        return IntentionType.SetFontInfo;
    }

    Execute(context: JsCtx)
    {
        const sheet: Excel.Worksheet =
            this.m_sheetName == null
                ? context.Ctx.workbook.worksheets.getActiveWorksheet()
                : context.Ctx.workbook.worksheets.getItem(this.m_sheetName);

        const range: Excel.Range = Ranges.rangeFromRangeInfo(sheet, this.m_rangeInfo);

        range.format.font.name = this.m_fontName;
        range.format.font.size = this.m_fontSize;

    }

    static Create(range: RangeInfo, fontName: string, fontSize: number, sheet?: string): IIntention
    {
        const tn = new TnSetFontInfo();

        tn.m_rangeInfo = range;
        tn.m_fontName = fontName;
        tn.m_fontSize = fontSize;
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