

class PerfTimerItem
{
    msecStart: number = 0;
    msecCumulative: number = 0;

    msecMin: number = 60 * 60 * 1000; // 60 minutes
    msecMax: number = 0;
    count: number = 0;

    timerName: string;
}

export class PerfTimer
{
    m_perfTimerStack: PerfTimerItem[] = [];
    m_aggregatedTimers: Map<string, PerfTimerItem> = new Map<string, PerfTimerItem>();

    pushTimer(message: string)
    {
        let timer: PerfTimerItem = new PerfTimerItem();

        timer.timerName = message;
        PerfTimer.startTimer(timer);
        this.m_perfTimerStack.push(timer);

        console.log(`++++ START: Timer Start: ${message}`);
    }

    static startTimer(timer: PerfTimerItem)
    {
        timer.msecStart = Date.now();
    }

    static pauseTimerAndAccumulate(timer: PerfTimerItem)
    {
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

    popTimer()
    {
        let timer: PerfTimerItem = this.m_perfTimerStack.pop();
        PerfTimer.pauseTimerAndAccumulate(timer);
        PerfTimer.reportPerfTimerItem(timer);
    }

    startAggregatedTimer(key: string, message: string)
    {
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
        if (this.m_aggregatedTimers.has(key))
        {
            const timer: PerfTimerItem = this.m_aggregatedTimers.get(key);

            PerfTimer.pauseTimerAndAccumulate(timer);
        }
    }

    stopAllAggregatedTimers()
    {
        for (let key of this.m_aggregatedTimers.keys())
        {
            const timer: PerfTimerItem = this.m_aggregatedTimers.get(key);

            // make sure timer is accumulated. if its already paused, its a noop
            PerfTimer.pauseTimerAndAccumulate(timer);
            PerfTimer.reportPerfTimerItem(timer);
        }

        this.m_aggregatedTimers.clear();
    }

    static reportPerfTimerItem(item: PerfTimerItem)
    {
        if (item.count > 1)
        {
            console.log(`Timer: ${item.timerName}: total: ${item.msecCumulative}, min/max: (${item.msecMin}, ${item.msecMax}), avergage: ${item.msecCumulative / item.count}, count: ${item.count}`);
        }
        else
        {
            console.log(`----- STOP: Timer ${item.timerName}: ${item.msecCumulative}`);
        }
    }

}