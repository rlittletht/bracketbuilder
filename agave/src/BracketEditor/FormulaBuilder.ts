
import { BracketDefinition } from "../Brackets/BracketDefinitions";
import { BracketGame } from "./BracketGame";

export class FormulaBuilder
{
    static getScoreRefFromTeamRef(teamRef: string): string
    {
        return `OFFSET(${teamRef}, 0, 1)`;
    }

    static getTopTeamRefFromBracketAndGame(bracketName: string, gameNumber: number): string
    {
        return `${bracketName}_G${gameNumber}_1`;
    }

    static getBottomTeamRefFromBracketAndGame(bracketName: string, gameNumber: number): string
    {
        return `${bracketName}_G${gameNumber}_2`;
    }

    static getTopTeamScoreRefFromBracketAndGame(bracketName: string, gameNumber: number): string
    {
        return this.getScoreRefFromTeamRef(this.getTopTeamRefFromBracketAndGame(bracketName, gameNumber));
    }

    static getBottomTeamScoreRefFromBracketAndGame(bracketName: string, gameNumber: number): string
    {
        return this.getScoreRefFromTeamRef(this.getBottomTeamRefFromBracketAndGame(bracketName, gameNumber));
    }

    static getShowTeamSourcesConditional(outputIfShowing: string): string
    {
        return `IF($A$1="BUILDING",${outputIfShowing},"")`;
    }

    static getWinnerFormulaFromSource(gameNumber: number, bracketName: string): string
    {
        const topTeamRef = this.getTopTeamRefFromBracketAndGame(bracketName, gameNumber);
        const bottomTeamRef = this.getBottomTeamRefFromBracketAndGame(bracketName, gameNumber);

        const topScoreRef = this.getScoreRefFromTeamRef(topTeamRef);
        const bottomScoreRef = this.getScoreRefFromTeamRef(bottomTeamRef);

        const noWinnerString = this.getShowTeamSourcesConditional(`"W${gameNumber}"`);

        return `=IF(${topScoreRef} = ${bottomScoreRef}, ${noWinnerString}, IF(${topScoreRef}>${bottomScoreRef},${topTeamRef},${bottomTeamRef}))`;
    }

    static getLoserFormulaFromSource(gameNumber: number, bracketName: string): string
    {
        const topTeamRef = this.getTopTeamRefFromBracketAndGame(bracketName, gameNumber);
        const bottomTeamRef = this.getBottomTeamRefFromBracketAndGame(bracketName, gameNumber);

        const topScoreRef = this.getScoreRefFromTeamRef(topTeamRef);
        const bottomScoreRef = this.getScoreRefFromTeamRef(bottomTeamRef);

        const noWinnerString = this.getShowTeamSourcesConditional(`"L${gameNumber}"`);

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
            return this.getWinnerFormulaFromSource(Number(source.substring(1)), bracketName);
        if (source[0] === "L")
            return this.getLoserFormulaFromSource(Number(source.substring(1)), bracketName);

        throw "bad source string";
    }

    /*----------------------------------------------------------------------------
        %%Function: FormulaBuilder.getFieldFormulaFromGameNumber

        Get the formula for the field info for this game.

        NOTE: GameNum here is the 0-based game number
    ----------------------------------------------------------------------------*/
    static getFieldFormulaFromGameNumber(gameNum: number): string
    {
        return `=${this.getFieldFormulaTextFromGameNumber(gameNum)}`;
    }

    /*----------------------------------------------------------------------------
        %%Function: FormulaBuilder.getFieldFormulaTextFromGameNumber
    ----------------------------------------------------------------------------*/
    static getFieldFormulaTextFromGameNumber(gameNum: number): string
    {
        return `INDEX(BracketSourceData[Field],MATCH(${gameNum}, BracketSourceData[GameNum],0))`;
    }

    /*----------------------------------------------------------------------------
        %%Function: FormulaBuilder.getTimeFormulaFromGameNumber

        NOTE: GameNum here is the 0-based game number
    ----------------------------------------------------------------------------*/
    static getTimeFormulaFromGameNumber(gameNum: number): string
    {
        return `=${this.getTimeFormulaTextFromGameNumber(gameNum)}`;
    }

    /*----------------------------------------------------------------------------
        %%Function: FormulaBuilder.getTimeFormulaTextFromGameNumber
    ----------------------------------------------------------------------------*/
    static getTimeFormulaTextFromGameNumber(gameNum: number): string
    {
        return `TEXT(INDEX(BracketSourceData[Time],MATCH(${gameNum}, BracketSourceData[GameNum],0)), "h:MM AM/PM")`;
    }
    /*----------------------------------------------------------------------------
        %%Function: FormulaBuilder.getSourceGameNumberIfWinner
    ----------------------------------------------------------------------------*/
    static getSourceGameNumberIfWinner(source: string): number
    {
        if (BracketGame.IsTeamSourceStatic(source))
            return -1;

        if (source[0] === "W")
            return Number(source.substring(1));

        return -1;
    }

    static getTeamNameLookup(teamNum: string): string
    {
        return `=INDEX(TeamNames[TeamName],MATCH("${teamNum}", TeamNames[TeamNum],0))`;
    }
}
