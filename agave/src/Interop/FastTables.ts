
export interface IFastTables
{
    addTableBinding(sTableName: string, sBindingID: string): Promise<unknown>;
    appendTableFast(sTableName: string, data: Array<Array<string>>): Promise<unknown>;
    abandonTableBinding(sTableName: string);
}

export class FastTables implements IFastTables
{
    mapFastTableBindings: Map<string, string> = new Map<string, string>();

    abandonTableBinding(sTableName: string)
    {
        if (this.mapFastTableBindings.has(sTableName))
        {
            let sOldBinding = this.mapFastTableBindings.get(sTableName);
            // ok, orphan it and remove the old one
            this.mapFastTableBindings.set("orphan-".concat(sOldBinding), sOldBinding);
            this.mapFastTableBindings.delete(sTableName);
        }
    }


    async addTableBinding(sTableName: string, sBindingID: string)
    {
        let p = new OfficeExtension.Promise((resolve, reject) =>
        {
            Office.context.document.bindings.addFromNamedItemAsync(sTableName,
                <any>Office.CoercionType.Table,
                { id: sBindingID },
                (result: Office.AsyncResult<any>) =>
                {
                    if (result.status === Office.AsyncResultStatus.Succeeded)
                        resolve(null);
                    else
                        reject(result.error);
                });
        });

        return p;
    }

    // append to table using bindings instead...
    async appendTableFast(sTableName: string, data: Array<Array<string>>)
    {
        let sBindingID: string;

        if (!this.mapFastTableBindings.has(sTableName))
        {
            sBindingID = "TableBinding".concat(this.mapFastTableBindings.size.toString());

            await this.addTableBinding(sTableName, sBindingID);
            this.mapFastTableBindings.set(sTableName, sBindingID);
        }
        else
        {
            sBindingID = this.mapFastTableBindings.get(sTableName);
        }

        if (!data.length) return OfficeExtension.Promise.resolve(null);

        let p = new OfficeExtension.Promise((resolve, reject) =>
        {
            Office.context.document.bindings.getByIdAsync(sBindingID,
                null,
                (findBindingResult) =>
                {
                    if (findBindingResult.status === Office.AsyncResultStatus.Succeeded && findBindingResult.value)
                    {
                        let binding: Office.TableBinding = findBindingResult.value as Office.TableBinding;
                        binding.addRowsAsync(
                            data,
                            { coercionType: Office.CoercionType.Table } as any,
                            (addRowsResult) =>
                            {
                                if (addRowsResult.status === Office.AsyncResultStatus.Succeeded)
                                {
                                    resolve(null);
                                }
                                else
                                {
                                    reject(addRowsResult.error);
                                }
                            }
                        );
                    }
                    else
                    {
                        reject(findBindingResult.error);
                    }
                });
        });

        return p;
    }
}