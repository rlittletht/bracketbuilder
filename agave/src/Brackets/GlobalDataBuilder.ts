import { Sheets, EnsureSheetPlacement } from "../Interop/Sheets";
import { Ranges, RangeInfo } from "../Interop/Ranges";
import { OADate } from "../Interop/Dates";
import { BracketInfoBuilder as BracketDataBuilder } from "./BracketInfoBuilder";
import { JsCtx } from "../Interop/JsCtx";
import { IIntention } from "../Interop/Intentions/IIntention";
import { TnSetFormulas } from "../Interop/Intentions/TnSetFormula";
import { TnSetHorizontalAlignment } from "../Interop/Intentions/TnSetHorizontalAlignment";
import { TnSetFontBold } from "../Interop/Intentions/TnSetFontBold";
import { TnSetFontInfo } from "../Interop/Intentions/TnSetFontInfo";
import { TnSetFontUnderline } from "../Interop/Intentions/TnSetFontUnderline";
import { TnSetFillColor } from "../Interop/Intentions/TnSetFillColor";
import { TnCreateGlobalName } from "../Interop/Intentions/TnCreateGlobalName";
import { TnSetNumberFormat } from "../Interop/Intentions/TnSetNumberFormat";

export class GlobalDataBuilder
{
    static SheetName: string = "TeamsAndFields";

    static DefaultField: string = "Ballfield";
    static DefaultStartTime: number = 0;


    static async tnsAddGlobalDataToSheet(context: JsCtx, sheet: string, rowStart: number): Promise<IIntention[]>
    {
        context;
        const tns: IIntention[] = [];

        const instructionsRange = new RangeInfo(rowStart, 15, 0, 2);

        tns.push(
            TnSetFormulas.Create(
                instructionsRange,
                [
                    ["", "FILL IN TOURNAMENT INFORMATION BELOW"],
                    ["", ""],
                    ["Tournament:", "TOURNAMENT TITLE"],
                    ["", ""],
                    ["SubTitle:", "(sub-title)"],
                    ["", ""],
                    ["Location:", "FIELD OF DREAMS PARK"],
                    ["", ""],
                    ["Address:", "123 Strikes Out Place, Williamsport"],
                    ["", ""],
                    ["Hosted:", "SOME LOCAL LEAGUE, DISTRICT 1"],
                    ["", ""],
                    ["Last Update:", OADate.ToOADate(new Date())], // adjust for UTC
                    ["", ""],
                    ["FieldCount:", "=COUNTA(FieldRules[Field])"]
                ],
                sheet));

        tns.push(TnSetHorizontalAlignment.Create(instructionsRange, Excel.HorizontalAlignment.left, sheet));

        tns.push(TnSetFontBold.Create(instructionsRange.offset(0, 15, 0, 1), true, sheet));
        tns.push(TnSetFontInfo.Create(instructionsRange.offset(0, 15, 0, 1), null, 10, sheet));

        const instructionsFirstColumn = instructionsRange.offset(0, 15, 0, 1);
        tns.push(TnSetFontBold.Create(instructionsFirstColumn, true, sheet));

        const instructionsHeading = instructionsRange.offset(0, 1, 0, 2);

        tns.push(TnSetFontInfo.Create(instructionsHeading, null, 13, sheet));
        tns.push(TnSetFontUnderline.Create(instructionsHeading, Excel.RangeUnderlineStyle.single, sheet));
        tns.push(TnSetFontBold.Create(instructionsHeading, true, sheet));

        const shadedRange = RangeInfo.createColumnRange(0, 2);
        tns.push(TnSetFillColor.Create(shadedRange, "#F2F2F2", sheet));

        tns.push(...await Ranges.tnsDeleteGlobalName(context, "TournamentTitle"));
        tns.push(TnCreateGlobalName.Create("TournamentTitle", instructionsRange.offset(2, 1, 1, 1), sheet));
        tns.push(...await Ranges.tnsDeleteGlobalName(context, "TournamentSubtitle"));
        tns.push(TnCreateGlobalName.Create("TournamentSubtitle", instructionsRange.offset(4, 1, 1, 1), sheet));
        tns.push(...await Ranges.tnsDeleteGlobalName(context, "TournamentLocation"));
        tns.push(TnCreateGlobalName.Create("TournamentLocation", instructionsRange.offset(6, 1, 1, 1), sheet));
        tns.push(...await Ranges.tnsDeleteGlobalName(context, "TournamentAddress"));
        tns.push(TnCreateGlobalName.Create("TournamentAddress", instructionsRange.offset(8, 1, 1, 1), sheet));
        tns.push(...await Ranges.tnsDeleteGlobalName(context, "TournamentHost"));
        tns.push(TnCreateGlobalName.Create("TournamentHost", instructionsRange.offset(10, 1, 1, 1), sheet));
        tns.push(...await Ranges.tnsDeleteGlobalName(context, "LastUpdate"));
        tns.push(TnCreateGlobalName.Create("LastUpdate", instructionsRange.offset(12, 1, 1, 1), sheet));
        tns.push(...await Ranges.tnsDeleteGlobalName(context, "FieldCount"));
        tns.push(TnCreateGlobalName.Create("FieldCount", instructionsRange.offset(14, 1, 1, 1), sheet));

        const lastUpdateRange = instructionsRange.offset(12, 1, 1, 1);
        tns.push(TnSetNumberFormat.Create(lastUpdateRange, [["m/d/yy HH:mm"]], sheet));

        return tns;
    }
}