
import { BracketManager } from "../Brackets/BracketManager";
import { BracketGame } from "./BracketGame";
import { GameId } from "./GameId";
import { GameNum } from "./GameNum";
import { IAppContext } from "../AppContext/AppContext";
import { StreamWriter } from "../Support/StreamWriter";
import { TestRunner } from "../Support/TestRunner";
import { TestResult } from "../Support/TestResult";

export class FormulaBuilder
{
    static isTeamRefForBracket(check: string): boolean
    {
        const regex = /^T\d+_G\d+_[12]$/;

        return regex.test(check);
    }

    static getScoreRefFromTeamRef(teamRef: string): string
    {
        return `OFFSET(${teamRef}, 0, 1)`;
    }

    static getTopTeamRefFromBracketAndGame(bracketName: string, gameId: GameId): string
    {
        return `${bracketName}_G${gameId.Value}_1`;
    }

    static getBottomTeamRefFromBracketAndGame(bracketName: string, gameId: GameId): string
    {
        return `${bracketName}_G${gameId.Value}_2`;
    }

    static getTopTeamScoreRefFromBracketAndGame(bracketName: string, gameId: GameId): string
    {
        return this.getScoreRefFromTeamRef(this.getTopTeamRefFromBracketAndGame(bracketName, gameId));
    }

    static getBottomTeamScoreRefFromBracketAndGame(bracketName: string, gameId: GameId): string
    {
        return this.getScoreRefFromTeamRef(this.getBottomTeamRefFromBracketAndGame(bracketName, gameId));
    }

    static getShowTeamSourcesConditional(outputIfShowing: string): string
    {
        return `IF($A$1="BUILDING",${outputIfShowing},"")`;
    }

    static getWinnerFormulaFromSource(gameId: GameId, bracketName: string): string
    {
        const topTeamRef = this.getTopTeamRefFromBracketAndGame(bracketName, gameId);
        const bottomTeamRef = this.getBottomTeamRefFromBracketAndGame(bracketName, gameId);

        const topScoreRef = this.getScoreRefFromTeamRef(topTeamRef);
        const bottomScoreRef = this.getScoreRefFromTeamRef(bottomTeamRef);

        const noWinnerString = this.getShowTeamSourcesConditional(`"W${gameId.Value}"`);

        return `=IF(${topScoreRef} = ${bottomScoreRef}, ${noWinnerString}, IF(${topScoreRef}>${bottomScoreRef},${topTeamRef},${bottomTeamRef}))`;
    }

    static getLoserFormulaFromSource(gameId: GameId, bracketName: string): string
    {
        const topTeamRef = this.getTopTeamRefFromBracketAndGame(bracketName, gameId);
        const bottomTeamRef = this.getBottomTeamRefFromBracketAndGame(bracketName, gameId);

        const topScoreRef = this.getScoreRefFromTeamRef(topTeamRef);
        const bottomScoreRef = this.getScoreRefFromTeamRef(bottomTeamRef);

        const noWinnerString = this.getShowTeamSourcesConditional(`"L${gameId.Value}"`);

        return `=IF(${topScoreRef} = ${bottomScoreRef}, ${noWinnerString}, IF(${topScoreRef}<${bottomScoreRef},${
            topTeamRef},${bottomTeamRef}))`;
    }

    /*----------------------------------------------------------------------------
        %%Function: FormulaBuilder.getTeamNameFormulaFromSource
    ----------------------------------------------------------------------------*/
    static getTeamNameFormulaFromSource(source: string, bracketName: string): string
    {
        if (BracketGame.IsTeamSourceStatic(source))
            return this.getTeamNameLookup(source);

        if (source[0] === "W")
            return this.getWinnerFormulaFromSource(BracketManager.GameIdFromWinnerLoser(source), bracketName);
        if (source[0] === "L")
            return this.getLoserFormulaFromSource(BracketManager.GameIdFromWinnerLoser(source), bracketName);

        throw new Error("bad source string");
    }

    /*----------------------------------------------------------------------------
        %%Function: FormulaBuilder.getFieldFormulaFromGameNumber

        Get the formula for the field info for this game.

        NOTE: GameNum here is the 0-based game number
    ----------------------------------------------------------------------------*/
    static getFieldFormulaFromGameNumber(gameNum: GameNum): string
    {
        return `=${this.getFieldFormulaTextFromGameNumber(gameNum)}`;
    }

    /*----------------------------------------------------------------------------
        %%Function: FormulaBuilder.getFieldFormulaTextFromGameNumber
    ----------------------------------------------------------------------------*/
    static getFieldFormulaTextFromGameNumber(gameNum: GameNum): string
    {
        return `INDEX(BracketSourceData[Field],MATCH(${gameNum.GameId.Value}, BracketSourceData[GameID],0))`;
    }

    /*----------------------------------------------------------------------------
        %%Function: FormulaBuilder.getTimeFormulaFromGameId
    ----------------------------------------------------------------------------*/
    static getTimeFormulaFromGameId(gameId: GameId): string
    {
        return `=${this.getTimeFormulaTextFromGameId(gameId)}`;
    }

    /*----------------------------------------------------------------------------
        %%Function: FormulaBuilder.getTimeFormulaTextFromGameId
    ----------------------------------------------------------------------------*/
    static getTimeFormulaTextFromGameId(gameId: GameId): string
    {
        return `TEXT(INDEX(BracketSourceData[Time],MATCH(${gameId.GameNum.GameId.Value}, BracketSourceData[GameID],0)), "h:MM AM/PM")`;
    }

    /*----------------------------------------------------------------------------
        %%Function: FormulaBuilder.getSourceGameNumberIfWinner
    ----------------------------------------------------------------------------*/
    static getSourceGameIdIfWinner(source: string): GameId
    {
        if (BracketGame.IsTeamSourceStatic(source))
            return null;

        if (source[0] === "W")
            return BracketManager.GameIdFromWinnerLoser(source);

        return null;
    }

    /*----------------------------------------------------------------------------
        %%Function: FormulaBuilder.getTeamNameLookup
    ----------------------------------------------------------------------------*/
    static getTeamNameLookup(id: string): string
    {
        return `=INDEX(TeamNames[Name],MATCH("${id}", TeamNames[ID],0))`;
    }
}


export class FormulaBuilderTests
{
    static runAllTests(appContext: IAppContext, outStream: StreamWriter)
    {
        TestRunner.runAllTests(this, TestResult, appContext, outStream);
    }

    static runTest(result: TestResult, input: string, expected: boolean)
    {
        const actual = FormulaBuilder.isTeamRefForBracket(input);
        result.assertIsEqual(expected, actual, `isTeamRefForBracket(${input})`);
    }

    static test_IsTeamRefForBracket(result: TestResult)
    {
        this.runTest(result, "T1_G2_1", true);
        this.runTest(result, "T1_G2_2", true);
        this.runTest(result, "T11_G2_2", true);
        this.runTest(result, "T11_G12_2", true);
        this.runTest(result, "T11_G2_3", false);
        this.runTest(result, "T11_Game1", false);
        this.runTest(result, "T11_Ga2_1", false);
        this.runTest(result, "T11_G_2_1", false);
    }
}
