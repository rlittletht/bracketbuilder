
export class StringBuilder
{
    private m_strings: string[] = [];
    private m_collected: string = "";

    Reduce(): void
    {
        this.m_collected += this.m_strings.join("");
        this.m_strings = [];
    }

    ReduceIfNecessary(): void
    {
        if (this.m_strings.length > 10)
            this.Reduce();
    }

    Append(s: string): void
    {
        this.m_strings.push(s);
        this.ReduceIfNecessary();
    }

    ToString(): string
    {
        this.Reduce();
        return this.m_collected;
    }

    Clear(): void
    {
        this.m_strings = [];
        this.m_collected = "";
    }

    get IsEmpty(): boolean
    {
        return this.m_strings.length == 0 && this.m_collected.length == 0;
    }
}