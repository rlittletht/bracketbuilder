import { IIntention } from "../../../../Interop/Intentions/IIntention";
import { RangeInfo } from "../../../../Interop/Ranges";

export interface IFormatRule
{
    Parse(val: any): void;
    ToString(): string;
    Name: string;
    Value: any;
    GetTns(range?: RangeInfo): IIntention[];
    AdjustLoadRequests(loadRequests: Set<string>): void;
    LoadFromExcelFormat(format: Excel.RangeFormat): void;
}