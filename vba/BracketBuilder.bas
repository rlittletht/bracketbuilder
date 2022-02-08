Attribute VB_Name = "BracketBuilder"
Option Explicit

'all the possible info for a game. almost never completely filled out, but a good
' holder for information.
' gameNum = 0 will always denote an invalid GameDefinition
Type GameDefinition
    gameNum As Integer
    bracket As String
    isTopFirstGame As Boolean
    isBottomFirstGame As Boolean
    
    topSource As String
    bottomSource As String
    loserToGame As Integer
    winnerToGame As Integer
    
    fieldText As String
    gameTime As Date
    loserToGameText As String
    
    rgTop As Range
    rgBottom As Range
    rgGameInfo As Range
    
End Type

Function GetGameDefinitionFromBracketGame(bracket As String, Game As Integer) As GameDefinition
    Dim gd As GameDefinition
    
    gd.bracket = bracket
    gd.fieldText = "Field #1"
    gd.gameTime = 0.5
    
    ' find the table for this bracket
    Dim tableName As String
    tableName = bracket + "Bracket"
    
    Dim listBracket As ListObject
    
    Set listBracket = ActiveWorkbook.Worksheets("BracketStructure").ListObjects(tableName)
    
    Dim row As Integer
    
    row = Application.Evaluate("IFERROR(INDEX(" + listBracket + "[Game],MATCH(" + Str$(Game) + ", " + listBracket + "[Game], 0)),-1)")
    Dim listRow As listRow
    
    If (row = -1) Then
        gd.gameNum = 0
        GetGameDefinitionFromBracketGame = gd
        
        Exit Function
    End If
    
    Set listRow = listBracket.ListRows(row)
    
    gd.gameNum = Game
    
    
    gd.topSource = listRow.Range.Cells(1, 4)
    gd.bottomSource = listRow.Range.Cells(1, 5)
    
    gd.isTopFirstGame = IsGameSourceFirstGame(gd.topSource)
    gd.isBottomFirstGame = IsGameSourceFirstGame(gd.bottomSource)

    gd.winnerToGame = 0
    If (Len(listRow.Range.Cells(1, 2)) > 1) Then
        gd.winnerToGame = Int(Mid$(listRow.Range.Cells(1, 2), 2))
    End If
    gd.loserToGame = 0
    If (Len(listRow.Range.Cells(1, 3)) > 1) Then
        gd.loserToGame = Int(Mid$(listRow.Range.Cells(1, 3), 2))
    End If
    
    GetGameDefinitionFromBracketGame = gd
End Function

Sub InsertWinnerFormulaForCell(rg As Range, bracket As String, Game As String)
    rg.Formula = WinnerFormula(bracket, Game)
End Sub

Sub InsertWinnerFormula(bracket As String, Game As String)
    InsertWinnerFormulaForCell ActiveCell, bracket, Game
End Sub

Sub InsertFormulaForCell(rg As Range, bracket As String, Game As String)
    Dim gameNum As String
    
    gameNum = Mid$(Game, 2)
    
    If (UCase(Mid$(Game, 1, 1)) = "W") Then
        InsertWinnerFormulaForCell rg, bracket, gameNum
    ElseIf (UCase(Mid$(Game, 1, 1)) = "L") Then
        InsertLoserFormulaForCell rg, bracket, gameNum
    Else
        Stop
    End If
End Sub

Sub InsertFormula(bracket As String, Game As String)
    InsertFormulaForCell ActiveCell, bracket, Game
End Sub

Sub InsertGameFormulas(bracket As String, home As String, away As String)
    Dim rg As Range
    
    Set rg = ActiveCell
    
    If (rg.Height < 10) Then Stop
    
    InsertFormula bracket, home
    
    Set rg = rg.Offset(8, 0)
    
    If (rg.Height < 10) Then Stop
    
    rg.Select
    
    InsertFormula bracket, away
    
    rg.Offset(4, 0).Select
End Sub


Sub InsertLoserFormulaForCell(rg As Range, bracket As String, Game As String)
    rg.Formula = LoserFormula(bracket, Game)
End Sub

Sub InsertLoserFormula(bracket As String, Game As String)
    InsertLoserFormulaForCell ActiveCell, bracket, Game
End Sub


Function GetCellNameForGameTop(bracket As String, Game As Integer) As String
    GetCellNameForGameTop = bracket + "_G" + Mid$(Str$(Game), 2) + "_1"
End Function
Function GetCellNameForGameBottom(bracket As String, Game As Integer) As String
    GetCellNameForGameBottom = bracket + "_G" + Mid$(Str$(Game), 2) + "_2"
End Function
Function GetCellNameForGameNumber(bracket As String, Game As Integer) As String
    GetCellNameForGameNumber = bracket + "_Game" + Mid$(Str$(Game), 2)
End Function
Sub FormatGameCell_TopBottomTeam(rg As Range)
    rg.Font.Name = "Arial Black"
    rg.Font.Size = 9
    rg.HorizontalAlignment = xlCenter
    rg.VerticalAlignment = xlCenter
End Sub
Sub FormatGameCell_LineCell(rg As Range)
    With rg.Interior
        .Pattern = xlSolid
        .PatternColorIndex = xlAutomatic
        .ThemeColor = xlThemeColorLight1
        .TintAndShade = 0
        .PatternTintAndShade = 0
    End With
End Sub
Sub FormatGameCell_NoLineCell(rg As Range)
    With rg.Interior
        .Pattern = xlNone
        .TintAndShade = 0
        .PatternTintAndShade = 0
    End With
End Sub
' body text cells are Field # and Field Time
Sub FormatGameCell_BodyTextCell(rg As Range)
    rg.Font.Name = "Calibri"
    rg.Font.Size = 9
    rg.HorizontalAlignment = xlCenter
    rg.VerticalAlignment = xlCenter
End Sub
' Footnote cells are "Loser to..." cells
Sub FormatGameCell_FootnoteTextCell(rg As Range)
    rg.Font.Name = "Calibri"
    rg.Font.Size = 6
    rg.HorizontalAlignment = xlCenter
    rg.VerticalAlignment = xlTop
End Sub
' Heading cells are Merged across the range, centered, and bold
Sub FormatGameCell_HeadingRegion(rg As Range)
    rg.Merge
    rg.HorizontalAlignment = xlCenter
    rg.VerticalAlignment = xlCenter
    rg.Font.Bold = True
    rg.Font.Name = "Calibri"
End Sub
Sub NameCellForInsertGame(rg As Range, cellName As String)
    ' first, is there already a cell name here?
    Dim fExists As Boolean
    Dim wkb As Workbook
    
    Set wkb = rg.Worksheet.Parent
    
    fExists = IsCellNameDefinedGlobalWorkbook(cellName)
    
    If CellHasName(rg) Then
        If (rg.Name.Name = cellName) Then Exit Sub ' nothing to do, already named the right name
        
        ' If (fExists) Then Stop ' name already exists -- don't delete this cells name before we know about the error
        rg.Name.Delete
    End If
    
    If fExists Then
        If (InStr(ActiveWorkbook.Names(cellName).refersTo, "#REF") = 0) Then Stop
        ActiveWorkbook.Names(cellName).Delete
        
    End If
    
    
    wkb.Names.Add cellName, rg
    
End Sub
Sub InsertChampionshipGame(rgInsert As Range, bracket As String, gameFinal As Integer)
    Dim gd As GameDefinition
    
    ' get the last game
    gd = GetGameDefinitionFromBracketGame(bracket, gameFinal)
    
    Dim rgCurGameRow As Range
    
    Set rgCurGameRow = rgInsert.Cells(1, 1)
    
    ' ===== First Row - Top Team Name and Score
    InsertFormulaForCell rgCurGameRow.Cells(1, 1), bracket, "W" + Mid$(Str$(gameFinal), 2)
    FormatGameCell_TopBottomTeam rgCurGameRow.Cells(1, 1)
    
    Set rgCurGameRow = rgCurGameRow.Offset(1, 0)
    
    ' ===== Line Row
    FormatGameCell_LineCell rgCurGameRow
    
    Set rgCurGameRow = rgCurGameRow.Offset(1, 0)
    FormatGameCell_BodyTextCell rgCurGameRow.Cells(1, 1)
    rgCurGameRow.Cells(1, 1).Value = "Champion"
    
    Set rgCurGameRow = rgCurGameRow.Offset(1, 0)
    rgCurGameRow.Select
End Sub

Sub InsertGameNumCell(rgGameNumTopCell As Range, bracket As String, Game As Integer)
    ' before we format the heading region, make sure its unmerged first
    If rgGameNumTopCell.MergeCells Then rgGameNumTopCell.UnMerge
    NameCellForInsertGame rgGameNumTopCell, GetCellNameForGameNumber(bracket, Game)
    FormatGameCell_HeadingRegion Application.Range(rgGameNumTopCell, rgGameNumTopCell.Offset(2, 0))
    With rgGameNumTopCell
        .Value = "G" + Mid$(Str$(Game), 2)
        .Font.Size = 8
        .HorizontalAlignment = xlRight
    End With
End Sub

Sub InsertGameInfoCells(rgGameInfoTopCell As Range, bracket As String, fieldText As String, gameTime As Date, loserToGameText As String, Game As Integer)
    Dim rgCurGameRow As Range
    
    Set rgCurGameRow = rgGameInfoTopCell.Worksheet.Range(rgGameInfoTopCell.Cells(1, 1), rgGameInfoTopCell.Cells(1, 1).Offset(0, 1))
    
    ' ===== First body text for game description
    FormatGameCell_BodyTextCell rgCurGameRow.Cells(1, 1)
    With rgCurGameRow.Cells(1, 1)
        .Value = fieldText
        .VerticalAlignment = xlTop ' was bottom, but better center effect at the cost of spacing out?
    End With
    
    ' ===== Format the Game Number (merged region to the right)
    InsertGameNumCell rgCurGameRow.Cells(1, 2), bracket, Game
    
    Set rgCurGameRow = rgCurGameRow.Offset(2, 0) ' skip the underline
    
    ' ===== Second body text for game description (time slot)
    FormatGameCell_BodyTextCell rgCurGameRow.Cells(1, 1)
    With rgCurGameRow.Cells(1, 1)
        .Value = gameTime
        .NumberFormat = "h:mm AM/PM"
        .VerticalAlignment = xlBottom ' was Top, but better center effect at the cost of spacing out?
    End With

    Set rgCurGameRow = rgCurGameRow.Offset(2, 0) ' skip the underline
    FormatGameCell_FootnoteTextCell rgCurGameRow.Cells(1, 1)
    If (loserToGameText <> "") Then
        rgCurGameRow.Cells(1, 1).Value = loserToGameText
    End If
End Sub

Function InsertGameAtCell(rgInsert As Range, bracket As String, Game As Integer) As Boolean
    Dim gd As GameDefinition
    
    gd = GetGameDefinitionFromBracketGame(bracket, Game)
    If (gd.gameNum = 0) Then
        InsertGameAtCell = False
        Exit Function
    End If
    
    Dim rgCurGameRow As Range
    
    Set rgCurGameRow = Application.Range(rgInsert.Cells(1, 1), rgInsert.Cells(1, 1).Offset(0, 2))
    
    ' ===== First Row - Top Team Name and Score
    If (gd.isTopFirstGame) Then
        rgCurGameRow.Cells(1, 1).Value = gd.topSource
    Else
        InsertFormulaForCell rgCurGameRow.Cells(1, 1), bracket, gd.topSource
    End If
    
    NameCellForInsertGame rgCurGameRow.Cells(1, 1), GetCellNameForGameTop(bracket, Game)
    
    FormatGameCell_TopBottomTeam rgCurGameRow.Cells(1, 1)
    FormatGameCell_TopBottomTeam rgCurGameRow.Cells(1, 2)
    
    Set rgCurGameRow = rgCurGameRow.Offset(1, 0)
    
    ' ===== Line Row
    FormatGameCell_LineCell rgCurGameRow
    
    ' ===== Line for the right side of the game (top to bottom)
    FormatGameCell_LineCell Application.Range(rgCurGameRow.Cells(1, 3), rgCurGameRow.Cells(1, 3).Offset(7))
    
    Set rgCurGameRow = rgCurGameRow.Offset(3, 0) ' skip the blank line in the description and its underline
    
    ' ===== First body text for game description
    Dim loserToGameText As String
    
    loserToGameText = ""
    If (gd.loserToGame <> 0) Then
        loserToGameText = "(Loser to" + Str$(gd.loserToGame) + ")"
    End If
    
    InsertGameInfoCells rgCurGameRow.Cells(1, 1), bracket, gd.fieldText, gd.gameTime, loserToGameText, gd.gameNum
    
    Set rgCurGameRow = rgCurGameRow.Offset(5, 0) ' skip the underline
    
    ' ===== Line Row
    FormatGameCell_LineCell rgCurGameRow
    Set rgCurGameRow = rgCurGameRow.Offset(1, 0)
    
    ' ===== Last Row - Bottom Team name and Score
    If (gd.isBottomFirstGame) Then
        rgCurGameRow.Cells(1, 1).Value = gd.bottomSource
    Else
        InsertFormulaForCell rgCurGameRow.Cells(1, 1), bracket, gd.bottomSource
    End If
    NameCellForInsertGame rgCurGameRow.Cells(1, 1), GetCellNameForGameBottom(bracket, Game)
    
    FormatGameCell_TopBottomTeam rgCurGameRow.Cells(1, 1)
    FormatGameCell_TopBottomTeam rgCurGameRow.Cells(1, 2)
    
    Set rgCurGameRow = rgCurGameRow.Offset(2, 0)

    rgCurGameRow.Cells(1, 1).Select
    InsertGameAtCell = True
    
End Function
Function ReadGameDefinitionFromRange(rg As Range)

End Function
Sub InsertGamesForBracket(bracket As String)
    Dim gameNum As Integer
    
    gameNum = 1
    
    While True
        If Not (InsertGameAtCell(Selection, bracket, gameNum)) Then
            InsertChampionshipGame Selection, bracket, gameNum - 1
            Exit Sub
            
            Stop
        End If
        
        gameNum = gameNum + 1
    Wend
    
End Sub

Sub BuildBracketAtCell()
    Dim num As String
    
    num = InputBox("Number of Teams:", "Bracket Builder")
    
    If (num = "" Or num = "0") Then Exit Sub
    
    InsertGamesForBracket "T" + num
    
End Sub
