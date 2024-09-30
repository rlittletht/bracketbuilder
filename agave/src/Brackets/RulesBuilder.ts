
import { JsCtx } from "../Interop/JsCtx";
import { RangeInfo, Ranges } from "../Interop/Ranges";
import { EnsureSheetPlacement, Sheets } from "../Interop/Sheets";
import { GridBuilder } from "./GridBuilder";
import { IBracketDefinitionData } from "./IBracketDefinitionData";
import { IBracketGameDefinition } from "./IBracketGameDefinition";
import { BracketDefBuilder } from "./BracketDefBuilder";
import { GlobalDataBuilder } from "./GlobalDataBuilder";
import { Tables } from "../Interop/Tables";
import { IFastTables } from "../Interop/FastTables";
import { OADate } from "../Interop/Dates";

/*----------------------------------------------------------------------------
    %%Class: RulesBuilder

    Build the Rules data sheet
----------------------------------------------------------------------------*/
export class RulesBuilder
{
    static SheetName: string = "Rules";
    static s_staticInstructions =
    [
        ["These rules will be used when automatically scheduling games"],
        [null],
        ["If no 'latest start' is provided, then fields with lights will start games no later than 8pm and fields without lights will start games no later than 6pm"],
        ["If a rule value is empty, then that part of the rule will not be applied"]
    ];

    static s_staticInstructionsRange = RangeInfo.createForArrayOfValues(0, 0, RulesBuilder.s_staticInstructions);

    static s_initialFieldRules =
    [
        ["Field", "Has Lights", "EarliestSaturday", "LatestSaturday", "EarliestSunday", "LatestSunday", "EarliestWeekday", "LatestWeekday"],
        ["Field #1", false, null, null, null, null, null, null],
        ["Field #2", false, null, null, null, null, null, null],
    ];

    static s_initialFieldRulesRange = RangeInfo.createForArrayOfValues(
        RulesBuilder.s_staticInstructionsRange.LastRow + 2,
        0,
        RulesBuilder.s_initialFieldRules);

    static s_initialDayRules =
    [
        ["Day", "EarliestStart", "LatestStart"],
        ["Saturday", OADate.OATimeFromMinutes(9 * 60), OADate.OATimeFromMinutes(18 * 60)],
        ["Sunday", OADate.OATimeFromMinutes(10 * 60), OADate.OATimeFromMinutes(18 * 60)],
        ["Weekday", OADate.OATimeFromMinutes(18 * 60), OADate.OATimeFromMinutes(18 * 60)],
        ["Weekend", null, null],
        ["Monday", null, null],
        ["Tuesday", null, null],
        ["Wednesday", null, null],
        ["Thursday", null, null],
        ["Friday", null, null]
    ];

    static s_initialDayRulesRange =
        RangeInfo.createForArrayOfValues(
            RulesBuilder.s_initialFieldRulesRange.LastRow + 8,
            0,
            RulesBuilder.s_initialDayRules);

    /*----------------------------------------------------------------------------
        %%Function: BracketInfoBuilder.buildBracketInfoSheet

        Build the Bracket Data sheet (which has results and field schedule times
        in it)
    ----------------------------------------------------------------------------*/
    static async buildRulesSheet(context: JsCtx, fastTables: IFastTables)
    {
        let sheet: Excel.Worksheet = await Sheets.ensureSheetExists(context, RulesBuilder.SheetName, GlobalDataBuilder.SheetName, EnsureSheetPlacement.AfterGiven);

        let rng: Excel.Range = Ranges.rangeFromRangeInfo(sheet, this.s_staticInstructionsRange);
        rng.values = this.s_staticInstructions;

        rng = Ranges.rangeFromRangeInfo(sheet, this.s_staticInstructionsRange.offset(0, 1));

        rng.format.font.bold = true;
        rng.format.font.size = 22;

        rng = Ranges.rangeFromRangeInfo(sheet, this.s_initialFieldRulesRange);
        rng.values = this.s_initialFieldRules;

        // set date formatting
        rng = Ranges.rangeFromRangeInfo(
            sheet,
            this.s_initialFieldRulesRange.offset(1, this.s_initialFieldRulesRange.RowCount - 1, 2, this.s_initialFieldRulesRange.ColumnCount - 2));
        rng.numberFormat = [["HH:mm"]];

        rng = Ranges.rangeFromRangeInfo(sheet, this.s_initialDayRulesRange);
        rng.values = this.s_initialDayRules;

        // set date formatting
        rng = Ranges.rangeFromRangeInfo(
            sheet,
            this.s_initialDayRulesRange.offset(1, this.s_initialDayRulesRange.RowCount - 1, 1, this.s_initialDayRulesRange.ColumnCount - 1));

        rng.numberFormat = [["HH:mm"]];

        await Tables.ensureTableExists(
            context,
            sheet,
            fastTables,
            "FieldRules",
            Ranges.addressFromCoordinates(
                this.s_initialFieldRulesRange.topLeftCoords(),
                this.s_initialFieldRulesRange.bottomRightCoords()),
            null);

        await Tables.ensureTableExists(
            context,
            sheet,
            fastTables,
            "DayRules",
            Ranges.addressFromCoordinates(
                this.s_initialDayRulesRange.topLeftCoords(),
                this.s_initialDayRulesRange.bottomRightCoords()),
            null);

        await context.sync();
    }
}