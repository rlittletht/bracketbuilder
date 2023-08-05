import { TeachableId } from "./taskpane/components/Teachable";

// This is the durable state for BracketBuilder, stored in local storage
// DO NOT STORE PII in this state
// ANYTHING stored here will be collected in cookies or other browser storage, so it
// MUST be disclosed to the user in the privacy statement.

interface IDurableStateData
{
    TeachableCounts: Map<TeachableId, number>;
    TeachableHides: Map<TeachableId, boolean>;
    HideAllTeachables: boolean;
}

interface IDurableStateDataSerialized
{
    TeachableCounts: { key: string, value: number }[];
    TeachableHides: { key: string, value: boolean }[];
    HideAllTeachables: boolean;
}

export interface IDurableState
{
    get State(): IDurableStateData;
    load(topLevelKey: string);
    save(topLevelKey: string);
}

export class DurableState implements IDurableState
{
    static DefaultData(): IDurableStateData
    {
        return {
            TeachableCounts: new Map<TeachableId, number>(),
            TeachableHides: new Map<TeachableId, boolean>(),
            HideAllTeachables: false
        };
    }

    m_data: IDurableStateData = DurableState.DefaultData();

    get State(): IDurableStateData
    {
        return this.m_data;
    }

    private static createMapFromSerialized<T1 extends string, T2>(o: Object): Map<T1, T2>
    {
        const map = new Map<T1, T2>();

        for (let item in o)
        {
            if (o[item]["key"] !== undefined && o[item]["value"] !== undefined)
                map.set(o[item]["key"], o[item]["value"]);
        }

        return map;
    }

    private static createSerializedFromMap<T1, T2>(map: Map<T1, T2>): { key: string, value: T2 }[]
    {
        const ary = [];

        for (let key of map.keys())
        {
            ary.push({
                "key": key,
                "value": map.get(key)
            });
        }

        return ary;
    }

    private static parseAndUpgrade(json: string): [IDurableStateData, boolean]
    {
        const loaded = JSON.parse(json) ?? {};
        const defaultData = DurableState.DefaultData();
        const returnData = DurableState.DefaultData(); 

        let upgraded = false;

        if (loaded.HideAllTeachables === undefined)
        {
            returnData.HideAllTeachables = defaultData.HideAllTeachables;
            upgraded = true;
        }
        else
        {
            returnData.HideAllTeachables = loaded.HideAllTeachables;
        }

        if (loaded.TeachableCounts === undefined)
        {
            returnData.TeachableCounts = defaultData.TeachableCounts;
            upgraded = true;
        }
        else
        {
            returnData.TeachableCounts = this.createMapFromSerialized(loaded.TeachableCounts);
        }

        if (loaded.TeachableHides === undefined)
        {
            returnData.TeachableHides = defaultData.TeachableHides;
            upgraded = true;
        }
        else
        {
            returnData.TeachableHides = this.createMapFromSerialized(loaded.TeachableHides);
        }

        return [returnData, upgraded];
    }

    load(topLevelKey: string)
    {
        try
        {
            const json = localStorage.getItem(topLevelKey);
            let upgraded: boolean = false;

            [this.m_data, upgraded] = DurableState.parseAndUpgrade(json);

            if (upgraded)
                this.save(topLevelKey);
        }
        catch (e)
        {
            console.log(`caught exception: ${e}`);
            this.m_data = DurableState.DefaultData();
        }
    }

    save(topLevelKey: string)
    {
        const serialized: IDurableStateDataSerialized =
        {
            HideAllTeachables: this.m_data.HideAllTeachables,
            TeachableCounts: DurableState.createSerializedFromMap(this.m_data.TeachableCounts),
            TeachableHides: DurableState.createSerializedFromMap(this.m_data.TeachableHides)
        };

        const json = JSON.stringify(serialized);
        localStorage.setItem(topLevelKey, json);
    }
}