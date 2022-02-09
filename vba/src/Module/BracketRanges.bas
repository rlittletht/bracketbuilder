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

' ============================================================================
' FillConnectingLineRangeForGame
'
' Given a range for an underline cell and the game we want to connect to,
' try to extend this range to the source game. All intervening cells must be
' empty and unfilled until we encounter the center of the souce gameNum cell
' ============================================================================
Function ExtendConnectingLineRangeForGame(ByRef rg as Range, fromGameNum as Integer, isLineFilled as Boolean) As Boolean
    ExtendConnectingLineRangeForGame = False
    dim rgCheck as Range

    set rgCheck = rg.Cells(1,1)

    if (Not IsCellInUnderlineRow(rgCheck)) Then Exit Function
    if (Not IsCellFilledForLine(rgCheck)) Then Exit Function
    
    set rgCheck = rgCheck.Offset(0,-1)
    
    ' move left until we get to a cell that is opposite of isLineFilled
    while (rgCheck.Column > 1 And IsCellFilledForLine(rgCheck) = isLineFilled)
        set rgCheck = rgCheck.Offset(0,-1)
    wend
    
    if (rgCheck.Column <= 1) Then Exit Function

    dim iAdjustCol As Integer
    
    ' we hit a filled line cell. If the cell to our left is a gameNum
    ' cell and its the gameNum we want, then we are set. (since we
    ' are looking for a merged region, we want offset -1,-1)
    iAdjustCol = -1
    if (isLineFilled) Then
        ' if we are looking for filled lines, then we will also match the vertial
        ' line of the connected game, so we will stop ON the merged region
        ' of the game number. if thats that case, don't adjust by -1
        iAdjustCol = 0
    End If
    if (IsGameInfoGameNumCell(rgCheck.Offset(-1,iAdjustCol))) Then
        ' Since the function returned true for the correct cell,
        ' we know we are in the correct row relative to the game.
        Dim s As String
        s = rgCheck.Offset(-1,iAdjustCol).Name.Name
        if (Mid$(s, InStr(s, "Game") + 4) = Mid$(Str(fromGameNum), 2)) Then
            ' matched! back off by one cell since we don't want to include
            ' the vertical line of the connected game
            set rg = Application.Range(rg.Cells(1,1), rgCheck.Offset(0,2 + iAdjustCol))
            ExtendConnectingLineRangeForGame = True
            Exit Function
        end if
    end if
End Function
