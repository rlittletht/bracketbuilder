import { JsCtx } from "../JsCtx";
import { RangeInfo, Ranges } from "../Ranges";
import { IIntention } from "./IIntention";
import { IntentionType } from "./IntentionType";

export class TnSetActiveSheet implements IIntention
{
    m_rangeInfo: RangeInfo;
    m_sheetName: string;
    m_across: boolean;

    get Type(): IntentionType
    {
        return IntentionType.Select;
    }

    Execute(context: JsCtx)
    {
        const sheet: Excel.Worksheet = context.Ctx.workbook.worksheets.getItem(this.m_sheetName);

        sheet.activate();
    }

    static Create(sheet: string): IIntention
    {
        const tn = new TnSetActiveSheet();

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