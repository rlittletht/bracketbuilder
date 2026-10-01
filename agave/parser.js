
const parseState =
{
    LookingForGame: 0,
    LFG_AfterHyphen: 1,
    LFG_ParsingNumber: 2,
    LFG_ParsingNumber_WS: 3, // trailing whitespace after game number
    LookingForTopLeft: 4,
    LFTL_AfterOpen: 5,
    LFTL_FirstNum: 6,
    LFTL_AfterComma: 7,
    LFTL_SecondNum: 8,
    LFTL_AfterSecondNum: 9,
    LookingForBottomRight: 10,
    LFBR_AfterOpen: 11,
    LFBR_FirstNum: 12,
    LFBR_AfterComma: 13,
    LFBR_SecondNum: 14,
    LookingForSwapChars: 15,
    LookingForPriorities: 16,
    LFP_AfterOpen: 17,
    LFP_FirstNum: 18,
    LFP_AfterFirstComma: 19,
    LFP_SecondNum: 20,
    LFP_AfterSecondComma: 21,
    LFP_ThirdNum: 22,
};

const parseStateCode =
{
    LookingForCoords: 0,
    LFC_AfterParensOpen: 1,
    LFC_ParsingNumber: 2,

    LookingForGameNum: 3,
    LFGN_ParsingNumber: 4,
    LookingForSwapHomeAway: 5,

}
const lexCharCat =
{
    other: 0,
    hyphen: 1,
    digit: 2,
    openBracketParens: 3,
    closeBracketParens: 4,
    comma: 5,
    colon: 6,
    whitespace: 7,
    swapChars: 8,
    boolCharsStart: 9,
    boolCharsOther: 10,
    tilde: 11,
};

function lexChar(ch)
{
    if (ch == '-')
        return lexCharCat.hyphen;
    else if (isDigitChar(ch))
        return lexCharCat.digit;
    else if (ch == '[' || ch == '(')
        return lexCharCat.openBracketParens;
    else if (ch == ']' || ch == ')')
        return lexCharCat.closeBracketParens;
    else if (ch == ',')
        return lexCharCat.comma;
    else if (ch == ' ' || ch == '\t' || ch == '\r' || ch == '\n')
        return lexCharCat.whitespace;
    else if (ch == ':')
        return lexCharCat.colon;
    else if (ch == 'N' || ch == 'S')
        return lexCharCat.swapChars;
    else if (ch == 't' || ch == 'f')
        return lexCharCat.boolCharsStart;
    else if (ch == 'r' || ch == 'u' || ch == 'e' || ch == 'a' || ch == 'l' || ch == 's')
        return lexCharCat.boolCharsOther;
    else if (ch == '~')
        return lexCharCat.tilde;

    return lexCharCat.other;
}

function isDigitChar(ch)
{
    return ch >= '0' && ch <= '9';
}

const transitionsCode =
[
    /*LookingForCoords*/
    [
        /* other    */ null,
        /* hypen    */ null,
        /* digit    */ null,
        /* [(       */ { psNext: parseStateCode.LFC_AfterParensOpen, term: false },
        /* ])       */ null,
        /* ,        */ null,
        /* :        */ null,
        /* WS       */ null,
        /* [tf]     */ null,
        /* [rueals] */ null,
    ],
    /*LFC_AfterParensOpen*/
    [
        /* other    */ { psNext: parseStateCode.LookingForCoords, term: false, production: prodTotalReset },
        /* hypen    */ { psNext: parseStateCode.LookingForCoords, term: false, production: prodTotalReset },
        /* digit    */ { psNext: parseStateCode.LFC_ParsingNumber, term: false, production: prodCaptureStart },
        /* [(       */ { psNext: parseStateCode.LFC_AfterParensOpen, term: false },
        /* ])       */ { psNext: parseStateCode.LookingForCoords, term: false, production: prodTotalReset },
        /* ,        */ { psNext: parseStateCode.LookingForCoords, term: false, production: prodTotalReset },
        /* :        */ { psNext: parseStateCode.LookingForCoords, term: false, production: prodTotalReset },
        /* WS       */ { psNext: parseStateCode.LFC_AfterParensOpen, term: false },
        /* [NS]     */ { psNext: parseStateCode.LookingForCoords, term: false, production: prodTotalReset },
        /* [tf]     */ { psNext: parseStateCode.LookingForCoords, term: false, production: prodTotalReset },
        /* [rueals] */ { psNext: parseStateCode.LookingForCoords, term: false, production: prodTotalReset },
    ],
    /*LFC_ParsingNumber*/
    [
        /* other    */ { psNext: parseStateCode.LookingForCoords, term: false, production: prodTotalReset },
        /* hypen    */ { psNext: parseStateCode.LookingForCoords, term: false, production: prodTotalReset },
        /* digit    */ { psNext: parseStateCode.LFC_ParsingNumber, term: false },
        /* [(       */ { psNext: parseStateCode.LookingForCoords, term: false, production: prodTotalReset },
        /* ])       */ { psNext: parseStateCode.LookingForGameNum, term: false, production: prodCaptureCountedCompleteNotInclusive, key: "coord" },
        /* ,        */ { psNext: parseStateCode.LFC_ParsingNumber, term: false, production: prodCaptureCountedCompleteNotInclusiveAndStart, key: "coord" },
        /* :        */ { psNext: parseStateCode.LookingForCoords, term: false, production: prodTotalReset },
        /* WS       */ { psNext: parseStateCode.LFC_ParsingNumber, term: false },
        /* [NS]     */ { psNext: parseStateCode.LookingForCoords, term: false, production: prodTotalReset },
        /* [tf]     */ { psNext: parseStateCode.LookingForCoords, term: false, production: prodTotalReset },
        /* [rueals] */ { psNext: parseStateCode.LookingForCoords, term: false, production: prodTotalReset },
    ],
    /*LookingForGameNum*/
    [
        /* other    */ { psNext: parseStateCode.LookingForCoords, term: false, production: prodTotalReset },
        /* hypen    */ { psNext: parseStateCode.LFGN_ParsingNumber, term: false, production: prodCaptureStart },
        /* digit    */ { psNext: parseStateCode.LFGN_ParsingNumber, term: false, production: prodCaptureStart },
        /* [(       */ { psNext: parseStateCode.LookingForCoords, term: false, production: prodTotalReset },
        /* ])       */ { psNext: parseStateCode.LookingForCoords, term: false, production: prodTotalReset },
        /* ,        */ { psNext: parseStateCode.LookingForGameNum, term: false },
        /* :        */ { psNext: parseStateCode.LookingForCoords, term: false, production: prodTotalReset },
        /* WS       */ { psNext: parseStateCode.LookingForGameNum, term: false },
        /* [NS]     */ { psNext: parseStateCode.LookingForCoords, term: false, production: prodTotalReset },
        /* [tf]     */ { psNext: parseStateCode.LookingForCoords, term: false, production: prodTotalReset },
        /* [rueals] */ { psNext: parseStateCode.LookingForCoords, term: false, production: prodTotalReset },
    ],
    /*LFGN_ParsingNumber*/
    [
        /* other    */ { psNext: parseStateCode.LookingForCoords, term: false, production: prodTotalReset },
        /* hypen    */ { psNext: parseStateCode.LookingForCoords, term: false, production: prodTotalReset },
        /* digit    */ { psNext: parseStateCode.LFGN_ParsingNumber, term: false, },
        /* [(       */ { psNext: parseStateCode.LookingForCoords, term: false, production: prodTotalReset },
        /* ])       */ { psNext: parseStateCode.LookingForCoords, term: false, production: prodTotalReset },
        /* ,        */ { psNext: parseStateCode.LookingForSwapHomeAway, term: false, production: prodCaptureEndNotInclusive, key: "gameNum" },
        /* :        */ { psNext: parseStateCode.LookingForCoords, term: false, production: prodTotalReset },
        /* WS       */ { psNext: parseStateCode.LookingForSwapHomeAway, term: false, production: prodCaptureEndNotInclusive, key: "gameNum" },
        /* [NS]     */ { psNext: parseStateCode.LookingForCoords, term: false, production: prodTotalReset },
        /* [tf]     */ { psNext: parseStateCode.LookingForCoords, term: false, production: prodTotalReset },
        /* [rueals] */ { psNext: parseStateCode.LookingForCoords, term: false, production: prodTotalReset },
    ],
    /*LookingForSwapHomeAway*/
    [
        /* other    */ { psNext: parseStateCode.LookingForCoords, term: false, production: prodTotalReset },
        /* hypen    */ { psNext: parseStateCode.LookingForCoords, term: false, production: prodTotalReset },
        /* digit    */ { psNext: parseStateCode.LookingForCoords, term: false, production: prodTotalReset },
        /* [(       */ { psNext: parseStateCode.LookingForCoords, term: false, production: prodTotalReset },
        /* ])       */ { psNext: parseStateCode.LookingForCoords, term: true, production: prodCaptureEndNotInclusive, key: "swapHomeAway" },
        /* ,        */ { psNext: parseStateCode.LookingForGameNum, term: false, production: prodTotalReset },
        /* :        */ { psNext: parseStateCode.LookingForCoords, term: false, production: prodTotalReset },
        /* WS       */ { psNext: parseStateCode.LookingForSwapHomeAway, term: false },
        /* [NS]     */ { psNext: parseStateCode.LookingForCoords, term: false, production: prodTotalReset },
        /* [tf]     */ { psNext: parseStateCode.LookingForSwapHomeAway, term: false, production: prodCaptureStart },
        /* [rueals] */ { psNext: parseStateCode.LookingForSwapHomeAway, term: false },
    ],
];

const transitionsDump =
[
    [
        /* other    */ null,
        /* hypen    */ { psNext: parseState.LFG_AfterHyphen, term: false, production: prodCaptureStart },
        /* digit    */ { psNext: parseState.LFG_ParsingNumber, term: false, production: prodCaptureStart },
        /* [(       */ null,
        /* ])       */ null,
        /* ,        */ null,
        /* :        */ null,
        /* WS       */ null,
        /* [NS]     */ null,
        /* [tf]     */ null,
        /* [rueals] */ null,
    ], /*lookingForGame*/
    [
        /* other    */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* hypen    */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* digit    */ { psNext: parseState.LFG_ParsingNumber, term: false },
        /* [(       */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* ])       */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* ,        */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* :        */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* WS       */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* [NS]     */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* [tf]     */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* [rueals] */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
    ], /*LFG_AfterHyphen*/
    [
        /* other    */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* hypen    */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* digit    */ { psNext: parseState.LFG_ParsingNumber, term: false },
        /* [(       */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* ])       */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* ,        */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* :        */ { psNext: parseState.LookingForSwapChars, term: false, production: prodCaptureEndNotInclusive, key: "gameNum" },
        /* WS       */ { psNext: parseState.LFG_ParsingNumber_WS, term: false },
        /* [NS]     */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* [tf]     */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* [rueals] */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
    ], /*LFG_ParsingNumber*/
    [
        /* other    */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* hypen    */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset, unget: true },
        /* digit    */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset, unget: true },
        /* [(       */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* ])       */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* ,        */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* :        */ { psNext: parseState.LookingForTopLeft, term: false, production: prodCaptureEndNotInclusive, key: "gameNum" },
        /* WS       */ { psNext: parseState.LFG_ParsingNumber, term: false },
        /* [NS]     */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* [tf]     */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* [rueals] */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
    ], /*LFG_ParsingNumber_WS*/
    [
        /* other    */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* hypen    */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* digit    */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* [(       */ { psNext: parseState.LFTL_AfterOpen, term: false },
        /* ])       */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* ,        */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* :        */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* WS       */ { psNext: parseState.LookingForTopLeft, term: false },
        /* [NS]     */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* [tf]     */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* [rueals] */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
    ], /*LookingForTopLeft*/
    [
        /* other    */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* hypen    */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* digit    */ { psNext: parseState.LFTL_FirstNum, term: false, production: prodCaptureStart },
        /* [(       */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* ])       */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* ,        */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* :        */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* WS       */ { psNext: parseState.LFTL_AfterOpen, term: false },
        /* [NS]     */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* [tf]     */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* [rueals] */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
    ], /*LFTL_AfterOpen*/
    [
        /* other    */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* hypen    */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* digit    */ { psNext: parseState.LFTL_FirstNum, term: false },
        /* [(       */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* ])       */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* ,        */ { psNext: parseState.LFTL_AfterComma, term: false, production: prodCaptureEndNotInclusive, key: "TopLeftFirstNum" },
        /* :        */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* WS       */ { psNext: parseState.LFTL_AfterOpen, term: false },
        /* [NS]     */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* [tf]     */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* [rueals] */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
    ], /*LFTL_FirstNum*/
    [
        /* other    */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* hypen    */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* digit    */ { psNext: parseState.LFTL_SecondNum, term: false, production: prodCaptureStart },
        /* [(       */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* ])       */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* ,        */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* :        */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* WS       */ { psNext: parseState.LFTL_AfterComma, term: false },
        /* [NS]     */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* [tf]     */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* [rueals] */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
    ], /*LFTL_AfterComma*/
    [
        /* other    */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* hypen    */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* digit    */ { psNext: parseState.LFTL_SecondNum, term: false },
        /* [(       */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* ])       */ { psNext: parseState.LFTL_AfterSecondNum, term: false, production: prodCaptureEndNotInclusive, key: "TopLeftSecondNum" },
        /* ,        */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* :        */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* WS       */ { psNext: parseState.LFTL_SecondNum, term: false },
        /* [NS]     */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* [tf]     */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* [rueals] */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
    ], /*LFTL_SecondNum*/
    [
        /* other    */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* hypen    */ { psNext: parseState.LookingForBottomRight, term: false },
        /* digit    */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* [(       */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* ])       */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* ,        */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* :        */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* WS       */ { psNext: parseState.LFTL_AfterSecondNum, term: false },
        /* [NS]     */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* [tf]     */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* [rueals] */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
    ], /*LFTL_AfterSecondNum*/
    [
        /* other    */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* hypen    */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* digit    */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* [(       */ { psNext: parseState.LFBR_AfterOpen, term: false },
        /* ])       */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* ,        */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* :        */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* WS       */ { psNext: parseState.LookingForBottomRight, term: false },
        /* [NS]     */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* [tf]     */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* [rueals] */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
    ], /*LookingForBottomRight*/
    [
        /* other    */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* hypen    */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* digit    */ { psNext: parseState.LFBR_FirstNum, term: false, production: prodCaptureStart },
        /* [(       */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* ])       */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* ,        */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* :        */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* WS       */ { psNext: parseState.LFBR_AfterOpen, term: false },
        /* [NS]     */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* [tf]     */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* [rueals] */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
    ], /*LFBR_AfterOpen*/
    [
        /* other    */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* hypen    */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* digit    */ { psNext: parseState.LFBR_FirstNum, term: false },
        /* [(       */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* ])       */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* ,        */ { psNext: parseState.LFBR_AfterComma, term: false, production: prodCaptureEndNotInclusive, key: "BottomRightFirstNum" },
        /* :        */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* WS       */ { psNext: parseState.LFBR_AfterOpen, term: false },
        /* [NS]     */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* [tf]     */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* [rueals] */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
    ], /*LFBR_FirstNum*/
    [
        /* other    */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* hypen    */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* digit    */ { psNext: parseState.LFBR_SecondNum, term: false, production: prodCaptureStart },
        /* [(       */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* ])       */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* ,        */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* :        */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* WS       */ { psNext: parseState.LFBR_AfterComma, term: false },
        /* [NS]     */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* [tf]     */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* [rueals] */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
    ], /*LFBR_AfterComma*/
    [
        /* other    */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* hypen    */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* digit    */ { psNext: parseState.LFBR_SecondNum, term: false },
        /* [(       */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* ])       */ { psNext: parseState.LookingForPriorities, term: false, production: prodCaptureEndNotInclusive, key: "BottomRightSecondNum" },
        /* ,        */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* :        */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* WS       */ { psNext: parseState.LFBR_SecondNum, term: false },
        /* [NS]     */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* [tf]     */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* [rueals] */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
    ], /*LFBR_SecondNum*/
    [
        /* other    */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* hypen    */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* digit    */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* [(       */ { psNext: parseState.LookingForTopLeft, unget: true, term: false, production: prodCaptureEndNotInclusive, key: "swapHomeAway" },
        /* ])       */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* ,        */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* :        */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* WS       */ { psNext: parseState.LookingForTopLeft, term: false, production: prodCaptureEndNotInclusive, key: "swapHomeAway" },
        /* [NS]     */ { psNext: parseState.LookingForSwapChars, term: false, production: prodCaptureStart },
        /* [tf]     */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* [rueals] */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
    ], /*LookingForSwapChars*/
    [
        /* other    */ { psNext: parseState.LookingForGame, term: true, unget: true },
        /* hypen    */ { psNext: parseState.LookingForGame, term: true, unget: true },
        /* digit    */ { psNext: parseState.LookingForGame, term: true, unget: true },
        /* [(       */ { psNext: parseState.LFP_AfterOpen, term: false },
        /* ])       */ { psNext: parseState.LookingForGame, term: true, unget: true },
        /* ,        */ { psNext: parseState.LookingForGame, term: true, unget: true },
        /* :        */ { psNext: parseState.LookingForGame, term: true, unget: true },
        /* WS       */ { psNext: parseState.LookingForGame, term: true, unget: true },
        /* [NS]     */ { psNext: parseState.LookingForGame, term: true, unget: true },
        /* [tf]     */ { psNext: parseState.LookingForGame, term: true, unget: true },
        /* [rueals] */ { psNext: parseState.LookingForGame, term: true, unget: true },
    ], /*LookingForPriorities*/
    [
        /* other    */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* hypen    */ { psNext: parseState.LFP_FirstNum, term: false, production: prodCaptureStart },
        /* digit    */ { psNext: parseState.LFP_FirstNum, term: false, production: prodCaptureStart },
        /* [(       */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* ])       */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* ,        */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* :        */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* WS       */ { psNext: parseState.LFP_AfterOpen, term: false },
        /* [NS]     */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* [tf]     */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* [rueals] */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
    ], /*LFP_AfterOpen*/
    [
        /* other    */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* hypen    */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* digit    */ { psNext: parseState.LFP_FirstNum, term: false },
        /* [(       */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* ])       */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* ,        */ { psNext: parseState.LFP_AfterFirstComma, term: false, production: prodCaptureEndNotInclusive, key: "Priority1" },
        /* :        */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* WS       */ { psNext: parseState.LFP_AfterOpen, term: false },
        /* [NS]     */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* [tf]     */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* [rueals] */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
    ], /*LFP_FirstNum*/
    [
        /* other    */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* hypen    */ { psNext: parseState.LFP_SecondNum, term: false, production: prodCaptureStart },
        /* digit    */ { psNext: parseState.LFP_SecondNum, term: false, production: prodCaptureStart },
        /* [(       */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* ])       */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* ,        */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* :        */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* WS       */ { psNext: parseState.LFP_AfterFirstComma, term: false },
        /* [NS]     */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* [tf]     */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* [rueals] */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
    ], /*LFP_AfterFirstComma*/
    [
        /* other    */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* hypen    */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* digit    */ { psNext: parseState.LFP_SecondNum, term: false },
        /* [(       */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* ])       */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* ,        */ { psNext: parseState.LFP_AfterSecondComma, term: false, production: prodCaptureEndNotInclusive, key: "Priority2" },
        /* :        */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* WS       */ { psNext: parseState.LFP_AfterFirstComma, term: false },
        /* [NS]     */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* [tf]     */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* [rueals] */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
    ], /*LFP_SecondNum*/
    [
        /* other    */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* hypen    */ { psNext: parseState.LFP_ThirdNum, term: false, production: prodCaptureStart },
        /* digit    */ { psNext: parseState.LFP_ThirdNum, term: false, production: prodCaptureStart },
        /* [(       */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* ])       */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* ,        */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* :        */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* WS       */ { psNext: parseState.LFP_AfterSecondComma, term: false },
        /* [NS]     */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* [tf]     */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* [rueals] */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
    ], /*LFP_AfterSecondComma*/
    [
        /* other    */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* hypen    */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* digit    */ { psNext: parseState.LFP_ThirdNum, term: false },
        /* [(       */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* ])       */ { psNext: parseState.LookingForGame, term: true, production: prodCaptureEndNotInclusive, key: "Priority3" },
        /* ,        */ { psNext: parseState.LFP_AfterSecondComma, term: false, production: prodTotalReset },
        /* :        */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* WS       */ { psNext: parseState.LFP_AfterSecondComma, term: false },
        /* [NS]     */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* [tf]     */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
        /* [rueals] */ { psNext: parseState.LookingForGame, term: false, production: prodTotalReset },
    ], /*LFP_ThirdNum*/
];

function prodTotalReset(source, ichCur, ichFirstMatch, ichLastMatch, tokenBuilding, key)
{
    return [ichCur, -1, -1, {}];
}

function prodCaptureCountedCompleteNotInclusiveAndStart(source, ichCur, ichFirstMatch, ichLastMatch, tokenBuilding, key)
{
    if (key)
    {
        var keyCounter = key + "Count";

        if (!tokenBuilding[keyCounter])
            tokenBuilding[keyCounter] = 0;

        tokenBuilding[key + tokenBuilding[keyCounter]] = source.substring(ichFirstMatch, ichCur);
        tokenBuilding[keyCounter]++;
    }

    return [ichCur, ichCur + 1, -1, tokenBuilding];
}

function prodCaptureCountedCompleteNotInclusive(source, ichCur, ichFirstMatch, ichLastMatch, tokenBuilding, key)
{
    if (key)
    {
        var keyCounter = key + "Count";

        if (!tokenBuilding[keyCounter])
            tokenBuilding[keyCounter] = 0;

        tokenBuilding[key + tokenBuilding[keyCounter]] = source.substring(ichFirstMatch, ichCur);
    }

    return [ichCur, ichFirstMatch, ichCur, tokenBuilding];
}

function prodCaptureReset(source, ichCur, ichFirstMatch, ichLastMatch, tokenBuilding, key)
{
    return [ichCur, -1, -1, tokenBuilding];
}

function prodCaptureStart(source, ichCur, ichFirstMatch, ichLastMatch, tokenBuilding, key)
{
    return [ichCur, ichCur, -1, tokenBuilding];
}

function prodCaptureEndNotInclusive(source, ichCur, ichFirstMatch, ichLastMatch, tokenBuilding, key)
{
    if (key)
        tokenBuilding[key] = source.substring(ichFirstMatch, ichCur);

    return [ichCur, ichFirstMatch, ichCur - 1, tokenBuilding];
}

function lex(transitionTable, dump, ichCur, ps)
{
    let ichFirstMatch = -1;
    let ichLastMatch = -1;
    let tokenBuilding = {};

    while (ichCur < dump.length)
    {
        const lexCh = lexChar(dump[ichCur]);
        const transition = transitionTable[ps][lexCh];

        if (transition)
        {
            if (transition.production)
                [ichCur, ichFirstMatch, ichLastMatch, tokenBuilding] = transition.production(dump, ichCur, ichFirstMatch, ichLastMatch, tokenBuilding, transition.key);

            ps = transition.psNext;
            if (transition.term)
                return [ps, ichCur + 1, ichFirstMatch, ichLastMatch, tokenBuilding];

            if (transition.unget)
                ichCur--;
        }

        ichCur++;
    }

    return [ps, -1, -1, -1]; // we hit EOF
}