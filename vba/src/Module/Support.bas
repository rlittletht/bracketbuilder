Attribute VB_Name = "Support"
Option Explicit
' Does this name exist in the workbook (as a global name)
Function IsCellNameDefinedGlobalWorkbook(cellName As String) As Boolean

    On Error GoTo NoName
    Dim nm As Name
    
    Set nm = ActiveWorkbook.Names(cellName)
    IsCellNameDefinedGlobalWorkbook = True
    
    On Error GoTo 0
    Exit Function
    
NoName:
    IsCellNameDefinedGlobalWorkbook = False
    On Error GoTo 0
    
End Function

'Does the current cell have a name?
Function CellHasName(rg As Range) As Boolean
    On Error GoTo NoName
    Dim nm As Name
    
    Set nm = rg.Name
    CellHasName = True
    
    On Error GoTo 0
    Exit Function
    
NoName:
    CellHasName = False
    On Error GoTo 0
End Function

' Get the game definition for this formula. The formula represuents the top game for the game
' definition unless fBottomGame is true
Function FillGameDefinitionFromFormula(fmla As String, ByRef gd As GameDefinition, fBottomGame As Boolean) As Boolean
    Dim bracket As String, gameNum As String, staticResult As String
    
    FillGameDefinitionFromFormula = False
    
    If (GetGameInfoFromFormula(fmla, bracket, gameNum, staticResult)) Then
        gd.bracket = bracket
        If (fBottomGame) Then
            gd.bottomSource = staticResult
            gd.isBottomFirstGame = IsGameSourceFirstGame(staticResult)
        Else
            gd.topSource = staticResult
            gd.isTopFirstGame = IsGameSourceFirstGame(staticResult)
        End If
        FillGameDefinitionFromFormula = True
    End If
    
End Function

' Extract all the info we can from a given game result formula
Function GetGameInfoFromFormula(fmla As String, ByRef template As String, ByRef gameNum As String, ByRef staticResult As String) As Boolean
    If (Mid$(fmla, 1, 1) <> "=") Then
        template = ""
        gameNum = ""
        staticResult = fmla
        GetGameInfoFromFormula = True
        Exit Function
    End If
    
    ' get the game source
    Dim i As Integer, i2 As Integer
    
    Dim cellName As String
    
    i = InStr(fmla, "OFFSET(")
    If i = 0 Then Exit Function

    i2 = InStr(i + 7, fmla, ",")
    If i2 = 0 Then Exit Function

    
    cellName = Mid$(fmla, i + 7, i2 - i - 7)
    
    Dim homeAway As String
    
    If Not GetGameInfoFromString(cellName, template, gameNum, homeAway) Then
        Exit Function
    End If
    
    If InStr(fmla, ">") = 0 Then
        ' this is a loser formula
        staticResult = "L"
    Else
        staticResult = "W"
    End If
    
    staticResult = staticResult + Mid$(gameNum, 2)
    GetGameInfoFromFormula = True
End Function

Function GetGameInfoFromString(cellName As String, ByRef template As String, ByRef gameName As String, ByRef homeAway As String) As Boolean
    Dim iSep1 As Integer
    Dim iSep2 As Integer
    
    iSep1 = InStr(cellName, "_")
    If (iSep1 <= 0) Then Exit Function
    
    iSep2 = InStr(iSep1 + 1, cellName, "_")
    If (iSep2 <= 0) Then Exit Function
    
    template = Mid$(cellName, 1, iSep1 - 1)
    gameName = Mid$(cellName, iSep1 + 1, iSep2 - iSep1 - 1)
    homeAway = Mid$(cellName, iSep2 + 1)

    GetGameInfoFromString = True
End Function
' Given a range whose .Cell(1,1) is the top cell of a game, fill in the template/gamenum/homeAway values
Function GetGameInfoValuesFromRangeCellName(rg As Range, ByRef template As String, ByRef gameName As String, ByRef homeAway As String) As Boolean
    GetGameInfoValuesFromRangeCellName = False

    On Error GoTo LError

    Dim cellName As String

    cellName = rg.Name.Name

    GetGameInfoValuesFromRangeCellName = GetGameInfoFromString(cellName, template, gameName, homeAway)
LError:
    On Error GoTo 0
End Function
' Is this a GameNumCell?
Function IsGameInfoGameNumCell(rg As Range) As Boolean
    IsGameInfoGameNumCell = False
    
    If Not CellHasName(rg.Cells(1, 1)) Then Exit Function
    If Not rg.MergeCells Then Exit Function
    
    If InStr(rg.Cells(1, 1).Name.Name, "Game") <= InStr(rg.Cells(1, 1).Name.Name, "_") Then Exit Function
    
    IsGameInfoGameNumCell = True
End Function
' There are 4 rows and 2 columns that make up the "Game Info" for a game
' (the Field #, the Time, the Advance To text, and the tiny underline
' row.  Given the top cell for a game, this will locate the Game Number
' cell (which is in the 2nd column), then return the range for the entire
' game information
Function GetGameInfoRangeForTopCell(rgTopTeam As Range) As Range
    Set GetGameInfoRangeForTopCell = Nothing
    
    Dim template As String, gameNum As String, homeAway As String
    Dim cChecked As Integer
    Dim rg As Range
    
    ' get a range for both cells
    Set rg = rgTopTeam.Worksheet.Range(rgTopTeam.Cells(1, 1), rgTopTeam.Cells(1, 2))
    
    cChecked = 0
    If (Not GetGameInfoValuesFromRangeCellName(rg.Cells(1, 1), template, gameNum, homeAway)) Then Exit Function
    If homeAway <> "1" Then Exit Function
    
    Set rg = rg.Offset(1, 0) ' skip the top team row
    
    ' now search for the game number cell -- it will be in the 2nd column
    While True
        ' abort when we get to the matching game bottom
        If (GetGameInfoValuesFromRangeCellName(rg.Cells(1, 1), template, gameNum, homeAway)) Then Exit Function
        If (cChecked > 10000) Then Stop
        
        If IsGameInfoGameNumCell(rg.Cells(1, 2)) Then
            Set GetGameInfoRangeForTopCell = rg.Worksheet.Range(rg.Cells(1, 1), rg.Cells(5, 2))
            Exit Function
        End If
        Set rg = rg.Offset(1, 0)
    Wend
End Function
' the top and bottom cells cannot be line rows, and the selection
' should be only 1 column wide
Function EnsureRangeIsOnlyGameAndSingleColumn(rg As Range) As Range
    Dim iRowStart As Integer
    Dim iRowEnd As Integer
    Dim iCol As Integer
    
    iRowStart = rg.Cells(1, 1).row
    iRowEnd = rg.Cells(rg.Rows.Count, 1).row

    If (rg.Cells(1, 1).Height < 2) Then
        iRowStart = iRowStart + 1
    End If
    
    If (rg.Cells(rg.Rows.Count, 1).Height < 2) Then
        iRowEnd = iRowEnd - 1
    End If
    
    iCol = rg.Cells(1, 1).Column
    If (rg.Cells(1, 1).Width < 2) Then
        iCol = iCol + 1
    End If
    
    ' now, there have to be enough rows
    
    If iRowEnd - iRowStart < 9 Then Exit Function
    
    Set EnsureRangeIsOnlyGameAndSingleColumn = rg.Worksheet.Range(rg.Worksheet.Cells(iRowStart, iCol), rg.Worksheet.Cells(iRowEnd, iCol))
End Function

' get all the game information we can about a game
Function FillGameDefintionFromCell(rg As Range, ByRef gd As GameDefinition) As Boolean
    FillGameDefintionFromCell = False
    
    Dim bracket As String, gameName As String, homeAway As String
    Dim fBottom As Boolean

    If (GetGameInfoValuesFromRangeCellName(rg, bracket, gameName, homeAway)) Then
        gd.gameNum = Int(Mid$(gameName, 2))
        fBottom = False
        If (homeAway = "2") Then
            fBottom = True
        End If
        If (Not (FillGameDefinitionFromFormula(rg.Formula, gd, fBottom))) Then Exit Function
    End If
    
    Set gd.rgGameInfo = GetGameInfoRangeForTopCell(rg)
    
    gd.fieldText = gd.rgGameInfo.Cells(1, 1).Value
    gd.gameTime = gd.rgGameInfo.Cells(3, 1).Value
    gd.loserToGameText = gd.rgGameInfo.Cells(5, 1).Value
    
    Dim rgMatch As Range
    
    Set rgMatch = GetMatchingGameLine(rg)
    
    If (fBottom) Then
        Set gd.rgTop = rgMatch
        Set gd.rgBottom = rg
    Else
        Set gd.rgTop = rg
        Set gd.rgBottom = rgMatch
    End If
    
    fBottom = Not (fBottom)
    If (Not (FillGameDefinitionFromFormula(rgMatch.Formula, gd, fBottom))) Then Exit Function
    FillGameDefintionFromCell = True
    
End Function


Function IsCellForGame(rg As Range) As Boolean
    IsCellForGame = False
    
    If Not (CellHasName(rg)) Then Exit Function
    
    Dim template As String, gameNum As String, homeAway As String

    If Not GetGameInfoValuesFromRangeCellName(rg, template, gameNum, homeAway) Then Exit Function
    '    Debug.Print "GameInfo: Template(" + template + "), GameNum(" + gameNum + "), homeAway(" + homeAway + ")"

    IsCellForGame = True
End Function

Function GetMatchingGameLine(rg As Range) As Range
    Set GetMatchingGameLine = Nothing
    
    Dim template As String, gameNum As String, homeAway As String
    Dim templateCheck As String, gameNumCheck As String, homeAwayCheck As String

    If Not GetGameInfoValuesFromRangeCellName(rg, template, gameNum, homeAway) Then Exit Function

    Dim iDirection As Integer
    
    If homeAway = "1" Then
        iDirection = 1
    Else
        iDirection = -1
    End If
    
    Dim cSearchLeft As Integer
    Dim rgCheck As Range
    
    Set rgCheck = rg.Offset(iDirection, 0)
    cSearchLeft = 50
    
    While (rgCheck.row > 1 And cSearchLeft > 0)
        If (GetGameInfoValuesFromRangeCellName(rgCheck, templateCheck, gameNumCheck, homeAwayCheck)) Then
            If (templateCheck = template And gameNumCheck = gameNum) Then
                If (homeAway = "1" And homeAwayCheck = "2") Then
                    Set GetMatchingGameLine = rgCheck
                    Exit Function
                End If
                If (homeAway = "2" And homeAwayCheck = "1") Then
                    Set GetMatchingGameLine = rgCheck
                    Exit Function
                End If
            End If
            Stop ' found an intervening game that wasn't out match
        End If
        Set rgCheck = rgCheck.Offset(iDirection, 0)
        cSearchLeft = cSearchLeft - 1
    Wend
    Stop
End Function

Function FindPreviousGameOrCurrent(rg As Range) As Range
    Set FindPreviousGameOrCurrent = Nothing
    
    While rg.row > 1
        If IsCellForGame(rg) Then
            Set FindPreviousGameOrCurrent = rg
            Exit Function
        End If
        Set rg = rg.Offset(-1, 0)
    Wend
'    Stop
End Function

' return true if the game source is not a winner or loser from a previous game
Function IsGameSourceFirstGame(gameSource As String) As Boolean
    IsGameSourceFirstGame = True
    
    If (Len(gameSource) < 2) Then Exit Function
    
    If (Mid$(gameSource, 1, 1) = "W" Or Mid$(gameSource, 1, 1) = "L") Then IsGameSourceFirstGame = False
    
End Function


Sub PrintGameInfo()
    Dim template As String, gameNum As String, homeAway As String

    Debug.Print GetGameInfoValuesFromRangeCellName(Selection, template, gameNum, homeAway)
    Debug.Print "GameInfo: Template(" + template + "), GameNum(" + gameNum + "), homeAway(" + homeAway + ")"
End Sub

Function CutAndPushToWell() As Boolean
    Dim well as New GameWell
    Dim game as New BracketGame

    CutAndPushToWell = False
    if (Not game.LoadFromRange(selection)) Then
        MsgBox "Can't push game to well"
        Exit Function
    End If

    game.PushToGameWell well
    game.DeleteFromAttachedRange
    CutAndPushToWell = True
End Function

Sub DoCutAndPushToWell()
    CutAndPushToWell
End Sub

Sub PopFromWellAndInsert()
    Dim well as New GameWell
    Dim game as New BracketGame
    Dim rgInsert as Range

    if (Selection.Rows.Count = 1 And Selection.Columns.Count = 1) Then
        set rgInsert = Application.Range(selection.Cells(1,1),selection.Cells(1,1).Offset(10,0))
    else
        set rgInsert = Selection
    end if

    If (Not game.IsRangeValidForGameInsert(rgInsert)) Then 
        MsgBox "Selection isn't valid for game insert"
        Exit Sub
    End If

    game.PopFromGameWell well
    game.InsertAtRange rgInsert
End Sub

Sub TestDelete()
    Dim game as New BracketGame
    game.LoadFromRange selection
    game.DeleteFromAttachedRange
End Sub

Sub TestWell()
    Dim well as New GameWell
    Dim game as New BracketGame

    game.LoadFromRange selection

    stop
    game.PushToGameWell well
    stop
    set game = new BracketGame
    game.PopFromGameWell well
    game.InsertAtCell Selection
End Sub

Sub TestExtend(n as integer)
    Dim rg as Range
    set rg = Selection

    Debug.Print ExtendWinnerConnectingLineRangeForGame(rg, n, False)
    stop
End Sub