import { JsCtx } from "../JsCtx";
import { RangeInfo, Ranges } from "../Ranges";
import { IIntention } from "./IIntention";
import { IntentionType } from "./IntentionType";

export class TnSetFontColor implements IIntention
{
    m_rangeInfo: RangeInfo;
    m_sheetName: string;

    m_fillColor: string;
    m_fontColor: string;

    get Type(): IntentionType
    {
        return IntentionType.SetFontColor;
    }

    Execute(context: JsCtx)
    {
        const sheet: Excel.Worksheet =
            this.m_sheetName == null
                ? context.Ctx.workbook.worksheets.getActiveWorksheet()
                : context.Ctx.workbook.worksheets.getItem(this.m_sheetName);

        const range: Excel.Range = Ranges.rangeFromRangeInfo(sheet, this.m_rangeInfo);

        range.format.font.color = this.m_fontColor;

    }

    static Create(range: RangeInfo, fontColor: string, sheet?: string): IIntention
    {
        const tn = new TnSetFontColor();

        tn.m_rangeInfo = range;
        tn.m_fontColor = fontColor;
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