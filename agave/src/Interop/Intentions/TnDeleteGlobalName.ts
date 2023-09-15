import { JsCtx } from "../JsCtx";
import { IIntention } from "./IIntention";
import { IntentionType } from "./IntentionType";

// BE CAREFUL WITH THIS INTENTION
// It will throw an exception if the name doesn't exist, so be sure to check if the name
// exists before you try to delete it!
export class TnDeleteGlobalName implements IIntention
{
    m_globalName: string;

    get Type(): IntentionType
    {
        return IntentionType.DeleteGlobalName;
    }

    Execute(context: JsCtx)
    {
        if (this.m_globalName != null)
        {
            const nameObject: Excel.NamedItem = context.Ctx.workbook.names.getItem(this.m_globalName);

            nameObject.delete();
        }
    }

    static Create(name: string): IIntention
    {
        const tn = new TnDeleteGlobalName();

        tn.m_globalName = name;

        return tn;
    }

    get ComposeTypes(): IntentionType[]
    {
        return [IntentionType.DeleteGlobalName];
    }

    Compose<T extends IIntention>(laterTn: T)
    {
        const laterTnDelete: TnDeleteGlobalName = laterTn as any as TnDeleteGlobalName;

        if (laterTnDelete.m_globalName == this.m_globalName)
        {
            // don't let this earlier delete happen, the later delete will take care of it
            this.m_globalName = null;
        }
    }
}