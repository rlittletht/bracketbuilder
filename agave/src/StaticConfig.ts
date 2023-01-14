
export interface StaticConfig
{
    maxGameMoves: number,
    globalLogging: boolean,
    logGridChanges: boolean,
    logGrid: boolean,
    logMoveSteps: boolean,
    newStepLogger: boolean,
    logOptions: boolean,
}

export const s_staticConfig: StaticConfig =
{
    maxGameMoves: 4000,
    globalLogging: true,
    logGridChanges: false,
    logGrid: true,
    logMoveSteps: true,
    newStepLogger: true,
    logOptions: true
}