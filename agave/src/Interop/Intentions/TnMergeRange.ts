import { JsCtx } from "../JsCtx";
import { RangeInfo, Ranges } from "../Ranges";
import { IIntention } from "./IIntention";
import { IntentionType } from "./IntentionType";

export class TnMergeRange implements IIntention
{
    m_rangeInfo: RangeInfo;
    m_sheetName: string;
    m_across: boolean;

    get Type(): IntentionType
    {
        return IntentionType.MergeRange;
    }

    Execute(context: JsCtx)
    {
        const sheet: Excel.Worksheet =
            this.m_sheetName == null
                ? context.Ctx.workbook.worksheets.getActiveWorksheet()
                : context.Ctx.workbook.worksheets.getItem(this.m_sheetName);

        const range: Excel.Range = Ranges.rangeFromRangeInfo(sheet, this.m_rangeInfo);

        range.merge(this.m_across);
    }

    static Create(range: RangeInfo, across: boolean, sheet?: string): IIntention
    {
        const tn = new TnMergeRange();

        tn.m_rangeInfo = range;
        tn.m_sheetName = sheet;
        tn.m_across = across;

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