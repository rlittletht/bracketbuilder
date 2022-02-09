Attribute VB_Name = "BracketRanges"
Option Explicit

Function GetFullGameRangeFromCellWithinGameFirstColumn(rg as Range) As Range
    Dim rgStart As Range, rgEnd As Range

    Set rgStart = FindPreviousGameOrCurrent(rg.Cells(1, 1))
    Set rgEnd = GetMatchingGameLine(rgStart)

    Set GetFullGameRangeFromCellWithinGameFirstColumn = Range(rgStart, rgEnd.Offset(0, 2))
End Function

Function FillGameRangesFromFullGameRange(rgFullGame as Range, ByRef rgTopGame as Range, ByRef rgBottomGame as Range, ByRef rgGameInfo as Range) As Boolean
    FillGameRangesFromFullGameRange = False

    if (rgFullGame.Rows.Count < 9) Then Exit Function
    
    set rgTopGame = rgFullGame.Cells(1,1)
    set rgBottomGame = rgFullGame.Cells(rgFullGame.Rows.Count, 1)

    Dim bracket As String
    Dim gameNum As String
    Dim homeAway as String

    ' Check if the top and bottom games are actually top and bottom games
    If (Not GetGameInfoValuesFromRangeCellName(rgTopGame, bracket, gameNum, homeAway)) Then Exit Function
    If homeAway <> "1" Then Exit Function
    If (Not GetGameInfoValuesFromRangeCellName(rgBottomGame, bracket, gameNum, homeAway)) Then Exit Function
    If homeAway <> "2" Then Exit Function

    Set rgGameInfo = GetGameInfoRangeForTopCell(rgTopGame)
    If (rgGameInfo Is Nothing) Then Exit Function

    FillGameRangesFromFullGameRange = True
End Function
