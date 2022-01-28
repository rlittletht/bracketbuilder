VERSION 1.0 CLASS
BEGIN
  MultiUse = -1  'True
END
Attribute VB_Name = "Game"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = False
Attribute VB_Exposed = False
Option Explicit

Private m_gameDef As GameDefinition
Private m_isAttached As Boolean

' Return whether or not this Game object is attached to a range in the worksheet
Function IsAttached() As Boolean
    IsAttached = m_fIsAttached
End Function


Function LoadFromRange(rg As Range) As Boolean
    Dim rgStart As Range
    Dim rgEnd As Range
    
    LoadFromRange = False
    
    Set rgStart = FindPreviousGameOrCurrent(rg.Cells(1, 1))
    Set rgEnd = GetMatchingGameLine(rgStart)
    
    Set rg = Range(rgStart, rgEnd.Offset(0, 2)).Select
    
    ' now we have the whole game range
End Function

