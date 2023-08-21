import { IIntention } from "./IIntention";
import { IntentionType } from "./IntentionType";
import { RangeInfo, Ranges } from "../Ranges";
import { JsCtx } from "../JsCtx";

export class TnSetFormulas implements IIntention
{
    m_rangeInfo: RangeInfo;
    m_sheetName: string;

    m_formulas: any[][];

    get Type(): IntentionType
    {
        return IntentionType.SetFormulas;
    }

    Execute(context: JsCtx)
    {
        const sheet: Excel.Worksheet =
            this.m_sheetName == null
                ? context.Ctx.workbook.worksheets.getActiveWorksheet()
                : context.Ctx.workbook.worksheets.getItem(this.m_sheetName);

        const range: Excel.Range = Ranges.rangeFromRangeInfo(sheet, this.m_rangeInfo);

        range.formulas = this.m_formulas;
    }

    static Create(range: RangeInfo, formulas: any[][], sheet?: string): IIntention
    {
        const tn = new TnSetFormulas();

        tn.m_rangeInfo = range;
        tn.m_formulas = formulas;
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