
export interface StaticConfig
{
    version: string,
    maxGameMoves: number,
    globalLogging: boolean,
    logGridChanges: boolean,
    logGrid: boolean,
    logMoveSteps: boolean,
    newStepLogger: boolean,
    logOptions: boolean,
    debuggingInfo: boolean
}

export const s_staticConfig: StaticConfig =
{
    version: "1.0.14.0",
    maxGameMoves: 4000,
    globalLogging: true,
    logGridChanges: false,
    logGrid: false,
    logMoveSteps: false,
    newStepLogger: false,
    logOptions: false,
    debuggingInfo: false
}