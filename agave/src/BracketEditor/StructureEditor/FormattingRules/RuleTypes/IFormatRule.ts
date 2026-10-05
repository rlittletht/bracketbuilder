

export interface IFormatRule
{
    Parse(val: any): void;
    ToString(): string;
    Name: string;
}