import { IIntention } from "./IIntention";
import { IntentionType } from "./IntentionType";
import { RangeInfo, Ranges } from "../Ranges";
import { JsCtx } from "../JsCtx";

export class TnUnmergeRange implements IIntention
{
    m_rangeInfo: RangeInfo;
    m_sheetName: string;

    get Type(): IntentionType
    {
        return IntentionType.UnmergeRange;
    }

    Execute(context: JsCtx)
    {
        const sheet: Excel.Worksheet =
            this.m_sheetName == null
                ? context.Ctx.workbook.worksheets.getActiveWorksheet()
                : context.Ctx.workbook.worksheets.getItem(this.m_sheetName);

        const range: Excel.Range = Ranges.rangeFromRangeInfo(sheet, this.m_rangeInfo);

        range.unmerge();
    }

    static Create(range: RangeInfo, sheet?: string): IIntention
    {
        const tn = new TnUnmergeRange();

        tn.m_rangeInfo = range;
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