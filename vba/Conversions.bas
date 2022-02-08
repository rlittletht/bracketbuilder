Attribute VB_Name = "Conversions"
Option Explicit

Function IsCellForGlobalLocalRename(rg As Range) As Boolean
    IsCellForGlobalLocalRename = False

    If Not CellHasName(rg) Then Exit Function
    Dim nm As Name
    
    Set nm = rg.Name
    If Mid$(nm.Name, 1, 1) = "'" Then IsCellForGlobalLocalRename = True
End Function

Function IsGameCellStaticResult(rg As Range) As Boolean
    IsGameCellStaticResult = False
    If (Mid$(rg.Text, 1, 1) <> "L" And Mid$(rg.Text, 1, 1) <> "W") Then IsGameCellStaticResult = True
    
End Function

Sub ConvertStaticResultToFormulaCell(rg As Range)
    If Not CellHasName(rg) Then Stop
    Dim template As String, gameNum As String, homeAway As String
    
    If Not GetGameInfo(rg, template, gameNum, homeAway) Then Stop
    
    If (Mid$(rg.Text, 1, 1) <> "L" And Mid$(rg.Text, 1, 1) <> "W") Then Exit Sub
    
    InsertFormulaForCell rg, template, rg.Text
End Sub

Sub ConvertOldFormulaToNew(rg As Range)
    Dim fmla As String
    
    fmla = rg.Formula
    
    Dim staticResult As String, template As String, gameNum As String
    
    If Not GetGameInfoFromFormula(fmla, template, gameNum, staticResult) Then Stop
    
    Dim winLoss As String, Game As String
    
    winLoss = Mid$(staticResult, 1, 1)
    Game = Mid$(staticResult, 2)
    Debug.Print fmla
    
    If (UCase(winLoss) = "W") Then
        InsertWinnerFormulaForCell rg, template, Game
    ElseIf (UCase(winLoss) = "L") Then
        InsertLoserFormulaForCell rg, template, Game
    Else
        Stop
    End If

End Sub

Sub ConvertOldFormulasToNew()
    Dim cellName As String
    Dim refersTo As String
    Dim newCellName As String
    
    While True
        If CellHasName(ActiveCell) Then
            ConvertOldFormulaToNew ActiveCell
        End If
        
        Stop
        ActiveCell.Offset(1, 0).Select
    Wend
End Sub


Sub ConvertStaticResultsToFormula()
    Dim cellName As String
    Dim refersTo As String
    Dim newCellName As String
    
    While True
        If CellHasName(ActiveCell) Then
            ConvertStaticResultToFormulaCell ActiveCell
        End If
        
        Stop
        ActiveCell.Offset(1, 0).Select
    Wend
End Sub
Sub ConvertToGlobal(newTValue As String)
'    newTValue = "T14"
    Dim cellName As String
    Dim refersTo As String
    Dim newCellName As String
    
    While True
        If IsCellForGlobalLocalRename(ActiveCell) Then
            cellName = ActiveCell.Name.Name
            refersTo = ActiveCell.Name.refersTo
            
            If Mid$(cellName, 1, 1) <> "'" Then Stop ' not a sheet scope
            
            
            newCellName = newTValue + Mid$(cellName, InStr(cellName, "_"))
            
            If IsCellNameDefinedGlobalWorkbook(newCellName) Then Stop ' can't already exist
            
            ActiveCell.Name.Delete
            ActiveWorkbook.Names.Add newCellName, refersTo
        End If
        
        Stop
        ActiveCell.Offset(1, 0).Select
    Wend
End Sub
