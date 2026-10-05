import { IFormatRule } from "./IFormatRule";

export class FontRule implements IFormatRule
{
    m_fontName: string;
    m_isTheme: boolean;

    public constructor(val?: string)
    {
        if (val)
            this.m_fontName = val;
    }

    public Parse(val: any): void
    {
        switch (typeof val)
        {
        case "number":
            this.m_fontName = `${val}`;
            break;
        case "string":
            this.m_fontName = val;
            break;
        case "boolean":
            this.m_fontName = val ? "TRUE" : "FALSE";
            break;
        default:
            throw new Error(`Invalid value type for FontRule: ${typeof val}`);
        }
    }

    public static CreateFromString(fontName: string): IFormatRule
    {
        const rule = new FontRule();
        rule.Parse(fontName);

        return rule;
    }

    public static CreateFromRule(fontName: string, isTheme: boolean): IFormatRule
    {
        const rule = new FontRule();
        rule.m_fontName = fontName;
        rule.m_isTheme = isTheme;
        return rule;
    }

    public ToString(): string
    {
        if (this.m_isTheme)
            return "Theme";
        return this.m_fontName;
    }

    public get Name(): string
    {
        return "Font";
    }
}