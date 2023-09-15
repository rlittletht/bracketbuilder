import { JsCtx } from "../JsCtx";
import { IIntention } from "./IIntention";
import { IntentionType } from "./IntentionType";
import { RangeInfo, Ranges } from "../Ranges";

// BE CAREFUL WITH THIS INTENTION
// It will throw an exception if the name doesn't exist, so be sure to check if the name
// exists before you try to delete it!
export class TnCreateGlobalName implements IIntention
{
    m_globalName: string;
    m_rangeInfo: RangeInfo;
    m_sheetName: string;

    get Type(): IntentionType
    {
        return IntentionType.CreateGlobalName;
    }

    Execute(context: JsCtx)
    {
        if (this.m_globalName != null)
        {
            const sheet: Excel.Worksheet =
                this.m_sheetName == null
                    ? context.Ctx.workbook.worksheets.getActiveWorksheet()
                    : context.Ctx.workbook.worksheets.getItem(this.m_sheetName);

            const range: Excel.Range = Ranges.rangeFromRangeInfo(sheet, this.m_rangeInfo);

            context.Ctx.workbook.names.add(this.m_globalName, range);
        }
    }

    static Create(name: string, rangeInfo: RangeInfo, sheetName?: string): IIntention
    {
        const tn = new TnCreateGlobalName();

        tn.m_globalName = name;
        tn.m_rangeInfo = rangeInfo;
        tn.m_sheetName = sheetName;

        return tn;
    }

    get ComposeTypes(): IntentionType[]
    {
        return [IntentionType.CreateGlobalName];
    }

    Compose<T extends IIntention>(laterTn: T)
    {
        const laterTnCreate: TnCreateGlobalName = laterTn as any as TnCreateGlobalName;

        if (laterTnCreate.m_globalName == this.m_globalName)
        {
            // don't let the earlier CreateTn happen -- the later one wants to replace
            // it
            this.m_globalName = null;
        }
    }
}