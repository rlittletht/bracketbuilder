Attribute VB_Name = "VBUtils"
Option Explicit

Sub ExportAllModules()
    Dim i As Integer
    Dim s As String
    
    s = "d:\dev\bbld\vba\"

    If (Len(Dir(s, vbDirectory))) Then
        If (MsgBox("Directory " & s & " already exists.  If you continue, this will overwrite all files in the directory.  Continue?", vbOKCancel, "TrainWreck!") = vbCancel) Then
            Exit Sub
        End If
    Else
        MkDir s
    End If
    
    For i = 1 To Application.VBE.ActiveVBProject.VBComponents.Count
        If (Application.VBE.ActiveVBProject.VBComponents(i).Type = 1) Then
            Application.VBE.ActiveVBProject.VBComponents(i).Export s + Application.VBE.ActiveVBProject.VBComponents(i).Name + ".bas"
        ElseIf (Application.VBE.ActiveVBProject.VBComponents(i).Type = 2) Then
            Application.VBE.ActiveVBProject.VBComponents(i).Export s + Application.VBE.ActiveVBProject.VBComponents(i).Name + ".cls"
        End If
    Next
End Sub

Sub ImportAllModules()
    Dim i As Integer
    Dim s As String
    Dim sT As String
    
    s = "d:\dev\bbld\vba\"
    
    For i = 1 To Application.VBE.ActiveVBProject.VBComponents.Count
        If (Application.VBE.ActiveVBProject.VBComponents(i).Type = 1) Then
            If (Application.VBE.ActiveVBProject.VBComponents(i).Name <> "VBUtils") Then
                sT = Application.VBE.ActiveVBProject.VBComponents(i).Name
                Application.VBE.ActiveVBProject.VBComponents(i).Name = sT + "_OLD"
                Application.VBE.ActiveVBProject.VBComponents.Import s + sT + ".bas"
            End If
        End If
    Next
    
    For i = Application.VBE.ActiveVBProject.VBComponents.Count To 1 Step -1
        If (Right(Application.VBE.ActiveVBProject.VBComponents(i).Name, 4) = "_OLD") Then
            Application.VBE.ActiveVBProject.VBComponents.Remove Application.VBE.ActiveVBProject.VBComponents(i)
        End If
    Next
End Sub


