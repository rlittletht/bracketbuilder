Attribute VB_Name = "Module2"
Sub Macro3()
Attribute Macro3.VB_ProcData.VB_Invoke_Func = " \n14"
'
' Macro3 Macro
'

'
    Range("C8:E9").Select
    Selection.Cut
    Range("G8").Select
    ActiveSheet.Paste
End Sub
