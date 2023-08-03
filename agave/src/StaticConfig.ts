
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
    debuggingInfo: boolean,
    topLevelStateName: string,
    isLocalHost: boolean;
}

const isLocalHost = window.location.host.indexOf('localhost') > -1;

export const s_staticConfig: StaticConfig =
{
    version: "1.0.14.1",
    maxGameMoves: 4000,
    globalLogging: true && isLocalHost,
    logGridChanges: false && isLocalHost,
    logGrid: false && isLocalHost,
    logMoveSteps: false && isLocalHost,
    newStepLogger: false && isLocalHost,
    logOptions: false && isLocalHost,
    debuggingInfo: false && isLocalHost,
    topLevelStateName: "traynrex-red",
    isLocalHost: false && window.location.host.indexOf('localhost') > -1
}