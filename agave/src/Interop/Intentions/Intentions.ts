import { IIntention } from "./IIntention";
import { JsCtx } from "../JsCtx";
import { _TimerStack } from "../../PerfTimer";

export class Intentions
{
    m_intentions: IIntention[] = [];

    Add(tn: IIntention)
    {
        this.m_intentions.push(tn);
    }

    AddTns(tns: IIntention[])
    {
        this.m_intentions.push(...tns);
    }

    async Execute(context: JsCtx)
    {
        // first, compose anything that needs to compose

        for (let outer = 0; outer < this.m_intentions.length; outer++)
        {
            const outerTn = this.m_intentions[outer];
            const composeWith = outerTn.ComposeTypes;

            if (composeWith.length == 0)
                continue;

            for (let inner = 0; inner < outer; inner++)
            {
                const innerTn = this.m_intentions[inner];

                for (let composeCheck of composeWith)
                {
                    if (composeCheck == innerTn.Type)
                        outerTn.Compose(innerTn);
                }
            }
        }

        _TimerStack.pushTimer("executing intentions");

        for (let tn of this.m_intentions)
            tn.Execute(context);

        _TimerStack.popTimer();
        await context.sync("tnsX");
    }
}