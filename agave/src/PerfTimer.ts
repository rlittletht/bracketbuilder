import { s_staticConfig } from "./StaticConfig";


class PerfTimerItem
{
    msecStart: number = 0;
    msecCumulative: number = 0;

    msecMin: number = 60 * 60 * 1000; // 60 minutes
    msecMax: number = 0;
    count: number = 0;

    timerName: string;
    childResults: string[] = [];
    summarizeChildrenOnly: boolean;
}

export class PerfTimer
{
    m_perfTimerStack: PerfTimerItem[] = [];
    m_aggregatedTimers: Map<string, PerfTimerItem> = new Map<string, PerfTimerItem>();
    m_summarizeChildrenCount = 0;

    clear()
    {
        this.m_perfTimerStack = [];
    }

    popTimersUntil(message: string)
    {
        while (this.m_perfTimerStack.length > 0)
        {
            const thisTimer = this.m_perfTimerStack[this.m_perfTimerStack.length - 1].timerName;

            const timerName = this.popTimer() ?? message;

            if (timerName == message)
                return;
        }
    }

    pushTimer(message: string, summarizeChildrenOnly?: boolean)
    {
        if (!s_staticConfig.perfTimers)
            return;

        const summarizeChildrenCurrent = this.m_perfTimerStack.length == 0 ? 0 : this.m_perfTimerStack[this.m_perfTimerStack.length - 1].summarizeChildrenOnly;

        let timer: PerfTimerItem = new PerfTimerItem();

        timer.timerName = message;
        timer.summarizeChildrenOnly = summarizeChildrenOnly ?? false;

        PerfTimer.startTimer(timer);
        if (this.m_summarizeChildrenCount == 0)
        {
            if (this.m_perfTimerStack.length == 0)
            {
                console.log(`++++ START: Timer Start: ${message}`);
            }
            else
            {
                const itemNames = this.m_perfTimerStack.map((_item) => _item.timerName);

                const logOut = `+- Start: ${itemNames.join(" -> ")} -> ${message}`;
                console.log(`${" ".padStart(this.m_perfTimerStack.length * 2, " ")}${logOut}`);
            }
        }

        if (timer.summarizeChildrenOnly)
            this.m_summarizeChildrenCount++;

        this.m_perfTimerStack.push(timer);

    }

    static startTimer(timer: PerfTimerItem)
    {
        timer.msecStart = Date.now();
    }

    static pauseTimerAndAccumulate(timer: PerfTimerItem)
    {
        if (!s_staticConfig.perfTimers)
            return;

        if (timer.msecStart == 0)
            return;

        const msec = Date.now() - timer.msecStart;

        timer.msecCumulative += msec;
        timer.count++;

        if (timer.msecMax < msec)
            timer.msecMax = msec;

        if (timer.msecMin > msec)
            timer.msecMin = msec;

        timer.msecStart = 0;
    }

    appendSummaryToRemainingTimers(childSummary: string)
    {
        if (this.m_perfTimerStack.length > 0)
        {
            const _item = this.m_perfTimerStack[this.m_perfTimerStack.length - 1];
            _item.childResults.push(childSummary);
        }
    }

    popTimer(): string
    {
        if (!s_staticConfig.perfTimers)
            return null;

        if (this.m_perfTimerStack.length == 0)
            return null;

        let timer: PerfTimerItem = this.m_perfTimerStack.pop();
        PerfTimer.pauseTimerAndAccumulate(timer);
        if (timer.summarizeChildrenOnly)
            this.m_summarizeChildrenCount--;

        const childSummary = this.reportPerfTimerItem(timer);
        this.appendSummaryToRemainingTimers(childSummary);

        return timer.timerName;
    }

    startAggregatedTimer(key: string, message: string)
    {
        if (!s_staticConfig.perfTimers)
            return;

        let timer: PerfTimerItem;

        if (this.m_aggregatedTimers.has(key))
        {
            timer = this.m_aggregatedTimers.get(key);
        }
        else
        {
            timer = new PerfTimerItem();
            timer.timerName = message;
            this.m_aggregatedTimers.set(key, timer);
        }

        PerfTimer.startTimer(timer);
    }

    pauseAggregatedTimer(key: string)
    {
        if (!s_staticConfig.perfTimers)
            return;

        if (this.m_aggregatedTimers.has(key))
        {
            const timer: PerfTimerItem = this.m_aggregatedTimers.get(key);

            PerfTimer.pauseTimerAndAccumulate(timer);
        }
    }

    stopAllAggregatedTimers()
    {
        if (!s_staticConfig.perfTimers)
            return;

        for (let key of this.m_aggregatedTimers.keys())
        {
            const timer: PerfTimerItem = this.m_aggregatedTimers.get(key);

            // make sure timer is accumulated. if its already paused, its a noop
            PerfTimer.pauseTimerAndAccumulate(timer);
            const childSummary = this.reportPerfTimerItem(timer);
            this.appendSummaryToRemainingTimers(childSummary);
        }

        this.m_aggregatedTimers.clear();
    }

    reportPerfTimerItem(item: PerfTimerItem): string
    {
        if (!s_staticConfig.perfTimers)
            return "";

        let prefix = "";
        if (this.m_perfTimerStack.length != 0)
        {
            const logOut = `+-`;
            prefix = `${" ".padStart(this.m_perfTimerStack.length * 2, " ")}${logOut}`;
        }

        if (item.count > 1)
        {
            if (this.m_summarizeChildrenCount == 0)
                console.log(`${prefix} Stop: ${item.timerName}: total: ${item.msecCumulative}, min/max: (${item.msecMin}, ${item.msecMax}), avergage: ${item.msecCumulative / item.count}, count: ${item.count}`);
        }
        else
        {
            const childResults = item.childResults.length > 0 ? `(${item.childResults.join("+")})` : "";
            const itemNames = this.m_perfTimerStack.map((_item) => _item.timerName);

            if (this.m_summarizeChildrenCount == 0)
            {
                if (this.m_perfTimerStack.length == 0)
                    console.log(`----- STOP: ${item.msecCumulative}ms ${item.timerName}${childResults}`);
                else
                    console.log(`${prefix} Stop : ${item.msecCumulative}ms ${itemNames.join(" -> ")} -> ${item.timerName}${childResults}`);
            }
        }
        return `${item.timerName}(${item.msecCumulative})`;
    }

    timeThis(name: string, delegate: () => void, summaryChildrenOnly?: boolean)
    {
        _TimerStack.pushTimer(name, summaryChildrenOnly);
        delegate();
        _TimerStack.popTimer();
    }

    async timeThisAsync(name: string, delegate: () => void, summaryChildrenOnly?: boolean)
    {
        this.pushTimer(name, summaryChildrenOnly);
        await delegate();
        this.popTimer();
    }

}

export const _TimerStack = new PerfTimer();
