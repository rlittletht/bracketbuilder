Attribute VB_Name = "BracketEditor"
Option Explicit

Sub RemoveGameInfoCells(gd As GameDefinition)
    ' first, remove the name
    If (Not CellHasName(gd.rgGameInfo.Cells(1, 2))) Then Stop
        
    gd.rgGameInfo.Cells(1, 2).Name.Delete
    gd.rgGameInfo.Cells(1, 2).UnMerge
    gd.rgGameInfo.Clear
End Sub

Sub SwapHomeAway()
Attribute SwapHomeAway.VB_ProcData.VB_Invoke_Func = "H\n14"
    Dim rgHome As Range
    Dim rgAway As Range
    
    Set rgHome = FindPreviousGameOrCurrent(ActiveCell)
    Set rgAway = GetMatchingGameLine(rgHome)
    
    Dim s As String
    
    s = rgHome.Formula
    rgHome.Formula = rgAway.Formula
    rgAway.Formula = s
End Sub

Sub SelectGame()
Attribute SelectGame.VB_ProcData.VB_Invoke_Func = "A\n14"
    Dim rg1 As Range
    Dim rg2 As Range
    
    Set rg1 = FindPreviousGameOrCurrent(ActiveCell)
    If rg1 Is Nothing Then Exit Sub
    
    Set rg2 = GetMatchingGameLine(rg1)
    If rg2 Is Nothing Then Exit Sub
    
    Range(rg1, rg2.Offset(0, 2)).Select
End Sub

Sub ToggleUnderline()
Attribute ToggleUnderline.VB_ProcData.VB_Invoke_Func = "L\n14"
    Dim rg As Range
    
    Set rg = Selection
    
    If rg.Interior.Pattern = xlPatternSolid Then
        FormatGameCell_NoLineCell rg
    Else
        FormatGameCell_LineCell rg
    End If
End Sub

Function CalculateGameInfoRangeForTopAndBottomGames(rgTopGame as Range, rgBottomGame as Range) As Range
    Dim rgTarget as Range
    Dim cBodyTextRows As Integer
    dim iTopBodyText As Integer
    
    set rgTarget = Application.Range(rgTopGame.Cells(1,1), rgBottomGame.Cells(1,1))

    if (rgTarget.Rows.Count < 11) Then Stop

    ' now figure out where the body text goes    
    cBodyTextRows = Int((rgTarget.Rows.Count - 3 + 0.5) / 2)
    iTopBodyText = Int(((cBodyTextRows - 2) / 2) + 0.5)

    set CalculateGameInfoRangeForTopAndBottomGames = rgTarget.Cells(1, 1).Offset(2 + (iTopBodyText * 2), 0)
End Function

Sub StretchOrShrinkGame()
Attribute StretchOrShrinkGame.VB_ProcData.VB_Invoke_Func = "S\n14"
    Dim rgTarget As Range
    
    ' cleanup the selection
    
    Set rgTarget = CleanupRange(Selection)
    If rgTarget Is Nothing Then Exit Sub
    Dim iRowTopOriginal As Integer, iRowBottomOriginal As Integer
    
    Dim rgGameStart As Range
    Set rgGameStart = FindPreviousGameOrCurrent(rgTarget.Cells(rgTarget.Rows.Count, 1))
    
    Dim bracket As String, gameNum As String, homeAway As String
    
    If (Not GetGameInfo(rgGameStart, bracket, gameNum, homeAway)) Then Exit Sub
    If (homeAway = "2") Then
        Set rgGameStart = FindPreviousGameOrCurrent(rgGameStart.Offset(-1, 0))
        
        If rgGameStart Is Nothing Then Exit Sub
        If (Not GetGameInfo(rgGameStart, bracket, gameNum, homeAway)) Then Exit Sub
        
        If (homeAway <> "1") Then Exit Sub
    End If
    
    If rgGameStart Is Nothing Then Exit Sub
    
    ' get all the game info we can
    Dim gd As GameDefinition
    If Not FillGameDefintionFromCell(rgGameStart, gd) Then Stop
    iRowTopOriginal = gd.rgTop.row
    iRowBottomOriginal = gd.rgBottom.row
    
    ' they want the top team row at the top of the selection,
    ' and the bottom team row at the bottom of the selection
    
    ' first, lets move the TopTeam row to the destination
    Dim rgSource As Range
    Set rgSource = rgTarget.Worksheet.Range(gd.rgTop.Cells(1, 1), gd.rgTop.Cells(1.1).Offset(1, 2))
    
    rgSource.Cut
    rgTarget.Cells(1, 1).Select
    rgTarget.Worksheet.Paste
    
    Set rgSource = rgTarget.Worksheet.Range(gd.rgBottom.Cells(1, 1), gd.rgBottom.Cells(1.1).Offset(-1, 2))
    rgSource.Cut
    rgTarget.Cells(rgTarget.Rows.Count - 1, 1).Select
    rgTarget.Worksheet.Paste
    
    ' now figure out where the body text goes
    Dim iTopBodyText As Integer
    Dim cBodyTextRows As Integer
    
    cBodyTextRows = Int((rgTarget.Rows.Count - 3 + 0.5) / 2)
    iTopBodyText = Int(((cBodyTextRows - 2) / 2) + 0.5)
    
    RemoveGameInfoCells gd
    InsertGameInfoCells rgTarget.Cells(1, 1).Offset(2 + (iTopBodyText * 2), 0), gd.bracket, gd.fieldText, gd.gameTime, gd.loserToGameText, gd.gameNum
    
    Dim rgLine As Range
    
    ' now remove the right line if we shrank
    If (rgTarget.Rows.Count < (iRowBottomOriginal - iRowTopOriginal)) Then
        Set rgLine = rgTarget.Worksheet.Range(rgTarget.Worksheet.Cells(iRowTopOriginal + 1, rgTarget.Column + 2), rgTarget.Worksheet.Cells(iRowBottomOriginal - 1, rgTarget.Column + 2))
        FormatGameCell_NoLineCell rgLine
    End If
    
    Set rgLine = rgTarget.Worksheet.Range(rgTarget.Cells(2, 3), rgTarget.Cells(rgTarget.Rows.Count - 1, 3))
    FormatGameCell_LineCell rgLine
    
    ' Stop
    rgTarget.Select
    
End Sub

Function IsGameSelected(rg As Range) As Boolean

End Function
