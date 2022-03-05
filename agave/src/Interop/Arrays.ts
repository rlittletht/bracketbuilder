
export class Arrays
{
    static createArrayFromArrayMapping(dataSource: string[], rgNewToOld: number[], fAvoidNull: boolean): string[]
    {
        let ret: string[] = new Array<string>();
        let i: number = 0;

        while (i < rgNewToOld.length)
        {
            if (rgNewToOld[i] != -1)
            {
                if (dataSource[rgNewToOld[i]] != null)
                    ret.push(dataSource[rgNewToOld[i]]);
                else
                {
                    if (fAvoidNull)
                        ret.push("");
                    else
                        ret.push(null);
                }
            }
            else
            {
                if (fAvoidNull)
                    ret.push("");
                else
                    ret.push(null);
            }
            i++;
        }

        return ret;
    }

    static GetFirstValueNotInList(rgValuesToAvoid: number[]): number
    {
        let iValueToAvoidTest: number = 0;
        let value: number = 0;

        while (iValueToAvoidTest < rgValuesToAvoid.length)
        {
            if (value < rgValuesToAvoid[iValueToAvoidTest])
                return value;

            if (value == rgValuesToAvoid[iValueToAvoidTest])
            {
                value++;
            }
            iValueToAvoidTest++;
        }
        return value;
    }
}