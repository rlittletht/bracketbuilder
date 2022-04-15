
import { BracketDefinition } from "../Brackets/BracketDefinitions";

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

        const noWinnerString = this.getShowTeamSourcesConditional(`W${gameNumber}`);

        return `=IF(${topScoreRef} = ${bottomScoreRef}, ${noWinnerString}, IF(${topScoreRef}>${bottomScoreRef},${topScoreRef},${bottomScoreRef}))`;
    }

    static getLoserFormulaFromSource(gameNumber: number, bracketName: string): string
    {
        const topTeamRef = this.getTopTeamRefFromBracketAndGame(bracketName, gameNumber);
        const bottomTeamRef = this.getBottomTeamRefFromBracketAndGame(bracketName, gameNumber);

        const topScoreRef = this.getScoreRefFromTeamRef(topTeamRef);
        const bottomScoreRef = this.getScoreRefFromTeamRef(bottomTeamRef);

        const noWinnerString = this.getShowTeamSourcesConditional(`L${gameNumber}`);

        return `=IF(${topScoreRef} = ${bottomScoreRef}, ${noWinnerString}, IF(${topScoreRef}<${bottomScoreRef},${
            topScoreRef},${bottomScoreRef}))`;
    }

    static getTeamNameFormulaFromSource(source: string, bracketName: string): string
    {
        if (source[0] != "=")
            return source; // static team name

        if (source[1] === "W")
            return this.getWinnerFormulaFromSource(Number(source.substring(2)), bracketName);
        if (source[1] === "L")
            return this.getLoserFormulaFromSource(Number(source.substring(2)), bracketName);

        throw "bad source string";
    }
}
