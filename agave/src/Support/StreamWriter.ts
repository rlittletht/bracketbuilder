import { StringBuilder } from "./StringBuilder";

interface OutputLineDelegate
{
    (s: string): void;
}

export class StreamWriter
{
    private m_buffer: StringBuilder = new StringBuilder();
    private m_outputDelegate: OutputLineDelegate = null;

    constructor(del: OutputLineDelegate)
    {
        this.m_outputDelegate = del;
    }

    write(s: string): void
    {
        let i = 0;
        let ichLine;

        while ((ichLine = s.indexOf("\n", i)) != -1)
        {
            this.m_buffer.Append(s.substring(i, ichLine))
            this.m_outputDelegate(this.m_buffer.ToString());
            this.m_buffer.Clear();

            i = ichLine + 1;
        }

        this.m_buffer.Append(s.substring(i, i + s.length));
    }

    writeLine(s: string): void
    {
        this.write(s);
        this.write("\n");
        this.m_buffer.Clear();
    }

    flush(): void
    {
        if (!this.m_buffer.IsEmpty)
            this.writeLine("");
    }
}