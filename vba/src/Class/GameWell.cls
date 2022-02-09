VERSION 1.0 CLASS
BEGIN
  MultiUse = -1  'True
END
Attribute VB_Name = "GameWell"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = False
Attribute VB_Exposed = False
Option Explicit

Const iWellBracket           As Integer = 1
Const iWellGameNum           As Integer = 2
Const iWellIsChampion        As Integer = 3
Const iWellIsTopFirstGame    As Integer = 4
Const iWellIsBottomFirstGame As Integer = 5
Const iWellTopSource         As Integer = 6
Const iWellBottomSource      As Integer = 7
Const iWellLoserToGame       As Integer = 8
Const iWellWinnerToGame      As Integer = 9
Const iWellField             As Integer = 10
Const iWellGameTime          As Integer = 11
Const iWellLoserToGameText   As Integer = 12
Const iWellSwapHomeAway      As Integer = 13

Private m_well as ListObject

Private Function EnsureWellSheetExists() As Worksheet
    Dim sht As Worksheet

    On Error GoTo CreateSheet
    Set EnsureWellSheetExists = ActiveWorkbook.Sheets("GameWell")
    Exit Function
    
CreateSheet:
    Application.ScreenUpdating = False
    dim rgSave as Range
    set rgSave = Selection
    ActiveWorkbook.Sheets.Add(,ActiveWorkbook.Sheets("BracketStructure")).Name = "GameWell"
    Set EnsureWellSheetExists = ActiveWorkbook.Sheets("GameWell")
    rgSave.Worksheet.Select
    rgSave.Select
    Application.ScreenUpdating = True
End Function

Private Function EnsureWellObjectExists() As ListObject
    dim lo as ListObject
    dim sht as Worksheet

    set sht = EnsureWellSheetExists()

    on Error goto CreateObject
    set EnsureWellObjectExists = sht.ListObjects("GameWell")
    exit function
    
CreateObject:
    sht.Cells(1, iWellBracket          ).Value = "Bracket"
    sht.Cells(1, iWellGameNum          ).Value = "GameNum"
    sht.Cells(1, iWellIsChampion       ).Value = "IsChampion"
    sht.Cells(1, iWellIsTopFirstGame   ).Value = "IsTopFirstGame"
    sht.Cells(1, iWellIsBottomFirstGame).Value = "IsBottomFirstGame"
    sht.Cells(1, iWellTopSource        ).Value = "TopSource"
    sht.Cells(1, iWellBottomSource     ).Value = "BottomSource"
    sht.Cells(1, iWellLoserToGame      ).Value = "LoserToGame"
    sht.Cells(1, iWellWinnerToGame     ).Value = "WinnerToGame"
    sht.Cells(1, iWellField            ).Value = "Field"
    sht.Cells(1, iWellGameTime         ).Value = "GameTime"
    sht.Cells(1, iWellLoserToGameText  ).Value = "LoserToGameText"
    sht.Cells(1, iWellSwapHomeAway     ).Value = "SwapHomeAway"

    sht.ListObjects.Add(xlSrcRange,Range(sht.Cells(1,1), sht.Cells(1, iWellSwapHomeAway)),,xlYes).Name = "GameWell"
    set EnsureWellObjectExists = sht.ListObjects("GameWell")
End Function

Private Sub EnsureWellLoaded()
    if (m_well Is Nothing) Then
        set m_well = EnsureWellObjectExists()
    end if
End Sub

Public Function Count() As Integer
    EnsureWellLoaded
    
    Count = m_well.ListRows.Count
End Function

Public Function PushGame(gd as GameDefinition) As Boolean
    EnsureWellLoaded

    Dim rg as Range

    set rg = m_well.ListRows.Add().Range

    rg.Cells(1, iWellBracket          ).Value = gd.bracket
    rg.Cells(1, iWellGameNum          ).Value = gd.gameNum
    rg.Cells(1, iWellIsChampion       ).Value = gd.isChampion
    rg.Cells(1, iWellIsTopFirstGame   ).Value = gd.isTopFirstGame
    rg.Cells(1, iWellIsBottomFirstGame).Value = gd.isBottomFirstGame
    rg.Cells(1, iWellTopSource        ).Value = gd.topSource
    rg.Cells(1, iWellBottomSource     ).Value = gd.bottomSource
    rg.Cells(1, iWellLoserToGame      ).Value = gd.loserToGame
    rg.Cells(1, iWellWinnerToGame     ).Value = gd.winnerToGame
    rg.Cells(1, iWellField            ).Value = gd.fieldText
    rg.Cells(1, iWellGameTime         ).Value = gd.gameTime
    rg.Cells(1, iWellLoserToGameText  ).Value = gd.loserToGameText
    rg.Cells(1, iWellSwapHomeAway     ).Value = gd.swapHomeAway
End Function

Public Function PopGame() as GameDefinition
    dim gd as GameDefinition
    Dim rg as Range

    EnsureWellLoaded

    set rg = m_well.ListRows(m_well.ListRows.Count).Range
    gd.bracket = rg.Cells(1, iWellBracket          ).Value
    gd.gameNum = rg.Cells(1, iWellGameNum          ).Value
    gd.isChampion = rg.Cells(1, iWellIsChampion       ).Value
    gd.isTopFirstGame = rg.Cells(1, iWellIsTopFirstGame   ).Value
    gd.isBottomFirstGame = rg.Cells(1, iWellIsBottomFirstGame).Value
    gd.topSource = rg.Cells(1, iWellTopSource        ).Value
    gd.bottomSource = rg.Cells(1, iWellBottomSource     ).Value
    gd.loserToGame = rg.Cells(1, iWellLoserToGame      ).Value
    gd.winnerToGame = rg.Cells(1, iWellWinnerToGame     ).Value
    gd.fieldText = rg.Cells(1, iWellField            ).Value
    gd.gameTime = rg.Cells(1, iWellGameTime         ).Value
    gd.loserToGameText = rg.Cells(1, iWellLoserToGameText  ).Value
    gd.swapHomeAway = rg.Cells(1, iWellSwapHomeAway     ).Value

    m_well.ListRows(m_well.ListRows.Count).Delete
    PopGame = gd
End Function
