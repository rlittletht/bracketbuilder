
export interface StaticConfig
{
    version: string,
    maxGameMoves: number,
    globalLogging: boolean,
    logGridChanges: boolean,
    logCheckpoints: boolean,
    logGrid: boolean,
    logMoveSteps: boolean,
    newStepLogger: boolean,
    logOptions: boolean,
    debuggingInfo: boolean,
    topLevelStateName: string,
    isLocalHost: boolean;
    cdnRoot: string;
    bodyFont: string;
    bodySize: number;
    gameNumSize: number;
    blackFont: string;
    blackSize: number;
    championSize: number;
    advanceSize: number;
    logMoveKeySetting: boolean;
    logMoveTree: boolean;
    perfTimers: boolean;
    logTrackingCache: boolean;
    appLogging: boolean;
    throwOnCacheMisses: boolean;
}

const isLocalHost = window.location.host.indexOf('localhost') > -1;

export const s_staticConfig: StaticConfig =
{
    version: "2.0.0.0",
    maxGameMoves: 6000,
    globalLogging: true && isLocalHost,
    logGridChanges: false && isLocalHost,
    logGrid: false && isLocalHost,
    logMoveSteps: false && isLocalHost,
    newStepLogger: false && isLocalHost,
    logOptions: false && isLocalHost,
    debuggingInfo: false && isLocalHost,
    topLevelStateName: "traynrex-red",
    logCheckpoints: false,
    isLocalHost: isLocalHost,
    cdnRoot: isLocalHost ? "https://localhost:3000" : "https://addin.red.traynrex.com",
    bodyFont: "Aptos Narrow",
    bodySize: 9,
    blackFont: "Aptos Black",
    blackSize: 10,
    gameNumSize: 9,
    championSize: 12,
    advanceSize: 8,
    logMoveKeySetting: false && isLocalHost,
    perfTimers: isLocalHost,
    logTrackingCache: isLocalHost && false,
    logMoveTree: true && isLocalHost,
    appLogging: true && isLocalHost,
    throwOnCacheMisses: true && isLocalHost
}
