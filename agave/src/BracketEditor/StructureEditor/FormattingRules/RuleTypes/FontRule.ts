import { _ThemeFormattingRules } from "../ThemeRules";
import { ThemeItem } from "../Themes/ThemeItem";
import { IFormatRule } from "./IFormatRule";
import { LoadRequestType } from "./loadRequests";
import { RangeInfo } from "../../../../Interop/Ranges";
import { IIntention } from "../../../../Interop/Intentions/IIntention";
import { TnSetFontItalic } from "../../../../Interop/Intentions/TnSetFontItalic";

export class FontRule implements IFormatRule
{
    m_fontName: string;
    m_isTheme: boolean;
    m_themeItem: ThemeItem | null = null;

    public constructor(val?: string)
    {
        if (val)
            this.m_fontName = val;
    }

    themify(): void
    {
        if (this.m_isTheme)
            return;

        if (this.m_themeItem != null)
        {
            const definition = _ThemeFormattingRules().getThemeItemDefinition(this.m_themeItem);
            if (definition.getValue("Font").toLowerCase() == this.m_fontName.toLowerCase())
                this.m_isTheme = true;
        }
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
        this.themify();
    }

    public static CreateFromString(fontName: string): IFormatRule
    {
        const rule = new FontRule();
        rule.Parse(fontName);

        return rule;
    }

    public static CreateFromRule(fontName: string, isTheme: boolean, themeItem: ThemeItem | null): IFormatRule
    {
        const rule = new FontRule();
        rule.m_fontName = fontName;
        rule.m_isTheme = isTheme;
        rule.m_themeItem = themeItem;
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

    public get Value(): any
    {
        return this.m_isTheme ? "Theme" : this.m_fontName;
    }

    public set Value(val: any)
    {
        this.Parse(val);
    }

    public get IsTheme(): boolean
    {
        return this.m_isTheme;
    }

    public AdjustLoadRequests(loadRequests: Set<string>): void
    {
        loadRequests.add(LoadRequestType.Font);
    }

    public LoadFromExcelFormat(format: Excel.RangeFormat): void
    {
        this.m_fontName = format.font.name;
        this.m_isTheme = false; // must be adjusted by the caller
        this.themify();
    }

    // font and font size have to be aggregated manually
    public GetTns(range?: RangeInfo): IIntention[]
    {
        range;
        const tns: IIntention[] = [];

        return tns;
    }
}