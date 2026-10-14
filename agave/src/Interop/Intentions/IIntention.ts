import { JsCtx } from "../JsCtx";
import { IntentionType } from "./IntentionType";

export interface IIntention
{
    Type: IntentionType;
    ComposeTypes: IntentionType[];

    Compose<T extends IIntention>(laterTn: T);
    Execute(context: JsCtx): void;
}
