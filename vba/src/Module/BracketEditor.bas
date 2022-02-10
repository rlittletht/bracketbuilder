Attribute VB_Name = "BracketEditor"
Option Explicit

Sub RemoveGameInfoCellsRange(rgGameInfo as Range)
    ' first, remove the name
    If (Not CellHasName(rgGameInfo.Cells(1, 2))) Then Stop
        
    rgGameInfo.Cells(1, 2).Name.Delete
    rgGameInfo.Cells(1, 2).UnMerge
    rgGameInfo.Clear
End Sub

Sub RemoveGameInfoCells(gd As GameDefinition)
    RemoveGameInfoCellsRange gd.rgGameInfo
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

Function IsCellFilledForLine(rg as Range) As Boolean
    IsCellFilledForLine = rg.Interior.Pattern = xlPatternSolid
End Function

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

    if (rgTarget.Rows.Count < 9) Then Stop

    ' now figure out where the body text goes    
    cBodyTextRows = Int((rgTarget.Rows.Count - 3 + 0.5) / 2)
    iTopBodyText = Int(((cBodyTextRows - 2) / 2) + 0.5)

    if (rgTarget.Rows.Count < 11) then
        iTopBodyText = 0
    End If

    set CalculateGameInfoRangeForTopAndBottomGames = rgTarget.Cells(1, 1).Offset(2 + (iTopBodyText * 2), 0)
End Function

Sub StretchOrShrinkGame()
    Attribute StretchOrShrinkGame.VB_ProcData.VB_Invoke_Func = "S\n14"

    if (not CutAndPushToWell()) Then Exit Sub
    PopFromWellAndInsert
End Sub

Function IsGameSelected(rg As Range) As Boolean

End Function
