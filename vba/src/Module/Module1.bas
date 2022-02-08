Attribute VB_Name = "Module1"
Option Explicit

Function foo(rg As Range) As Range
    Dim rg2 As Range
    Set rg2 = ActiveCell
    Set foo = rg2
    Debug.Print rg.row
    Debug.Print foo.row
    Exit Function
End Function
Sub foo2()
    Dim rg As Range
    
    Set rg = foo(ActiveCell)
    Debug.Print rg.row
    
End Sub

Sub DumpFormulas()
    Dim rg As Range
    
    Set rg = Selection
    
    While (rg.Formula <> "Champion")
        If (rg.Formula <> "") Then
            If (Left$(rg.Formula, 1) <> "=") Then
                Debug.Print "body text"
            Else
                Debug.Print rg.Formula
            End If
                
        End If
        
        Set rg = rg.Offset(1, 0)
    Wend
    
End Sub
