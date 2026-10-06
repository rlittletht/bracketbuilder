

export interface IFormatRule
{
    Parse(val: any): void;
    ToString(): string;
    Name: string;
    Value: any;
    AdjustLoadRequests(loadRequests: Set<string>): void;
    LoadFromExcelFormat(format: Excel.RangeFormat): void;
}