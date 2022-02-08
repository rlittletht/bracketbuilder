VERSION 1.0 CLASS
BEGIN
  MultiUse = -1  'True
END
Attribute VB_Name = "BracketGame"
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

Function LoadFromGameBracket(bracket As String, Game As Integer) As Boolean
  m_gameDef = GetGameDefinitionFromBracketGame(bracket, Game)

  If (m_gameDef.gameNum = 0) Then
    LoadFromGameBracket = False
  Else
    LoadFromGameBracket = True
  End If
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

' We have a specific range we are being asked to insert in. It must meet
' the criteria for a game:
' * The first cell MUST be followed below by an underline row
' * The last cell MUST be preceded above by an underline row
' * There must be at least 5 rows between the underline rows (or 7 between top and bottom game)
Function IsRangeValidForGameInsert(rgInsert as Range) As Boolean
  Dim rgTopGame as Range
  Dim rgBottomGame as Range

  set rgTopGame = rgInsert.Cells(1,1)
  set rgBottomGame = rgInsert.Cells(rgInsert.Rows.Count,1)

  IsRangeValidForGameInsert = False

  if (Not IsCellSuitableForTopGame(rgTopGame)) Then Exit Function
  if (Not IsCellSuitableForBottomGame(rgBottomGame)) Then Exit Function

  if (rgBottomGame.Row - rgTopGame.Row < 7) Then Exit Function
  IsRangeValidForGameInsert = true
End Function

Function InsertAtRange(rgInsert as range) As Boolean
  InsertAtRange = False

  ' sanitize the range so its just one column
  set rgInsert = Application.Range(rgInsert.Cells(1,1), rgInsert.Cells(rgInsert.Rows.Count, 1))

  If (Not IsRangeValidForGameInsert(rgInsert)) Then Exit Function
  
  Dim rgTopGame as Range
  Dim rgBottomGame as Range
  Dim rgGameInfo as Range

  ' Calculate where these are going (don't modify our game yet)
  set rgTopGame = rgInsert.Cells(1,1)
  set rgBottomGame = rgInsert.Cells(rgInsert.Rows.Count, 1)
  set rgGameInfo = CalculateGameInfoRangeForTopAndBottomGames(rgTopGame, rgBottomGame)

  ' ===== First Row - Top Team Name and Score
  If (m_gameDef.isTopFirstGame) Then
      rgTopGame.Cells(1, 1).Value = m_gameDef.topSource
  Else
      InsertFormulaForCell rgTopGame, m_gameDef.bracket, m_gameDef.topSource
  End If
  
  NameCellForInsertGame rgTopGame, GetCellNameForGameTop(m_gameDef.bracket, m_gameDef.gameNum)
  
  FormatGameCell_TopBottomTeam rgTopGame
  FormatGameCell_TopBottomTeam rgTopGame.Offset(0,1)
  
  ' ===== Horizontal Line Row
  FormatGameCell_LineCell Application.Range(rgTopGame.Offset(1,0), rgTopGame.Offset(1,2))

  ' ===== Vertical Line for the right side of the game (top to bottom)
  FormatGameCell_LineCell Application.Range(rgTopGame.Offset(1,2), rgBottomGame.Offset(-1,2))

  ' ===== Body text for game description
  Dim loserToGameText As String
  
  loserToGameText = ""
  If (m_gameDef.loserToGame <> 0) Then
      loserToGameText = "(Loser to" + Str$(m_gameDef.loserToGame) + ")"
  End If
  
  InsertGameInfoCells rgGameInfo.Cells(1, 1), m_gameDef.bracket, m_gameDef.fieldText, m_gameDef.gameTime, loserToGameText, m_gameDef.gameNum
  
  ' ===== Horizontal line Row
  FormatGameCell_LineCell Application.Range(rgBottomGame.Offset(-1,0), rgBottomGame.Offset(-1,2))
  
  ' ===== Last Row - Bottom Team name and Score
  If (m_gameDef.isBottomFirstGame) Then
      rgBottomGame.Cells(1, 1).Value = m_gameDef.bottomSource
  Else
      InsertFormulaForCell rgBottomGame, m_gameDef.bracket, m_gameDef.bottomSource
  End If
  NameCellForInsertGame rgBottomGame, GetCellNameForGameBottom(m_gameDef.bracket, m_gameDef.gameNum)
  
  FormatGameCell_TopBottomTeam rgBottomGame
  FormatGameCell_TopBottomTeam rgBottomGame.Offset(1,0)

  ' Now record where we put things
  set m_gameDef.rgTop = rgTopGame
  set m_gameDef.rgBottom = rgBottomGame
  set m_gameDef.rgGameInfo = rgGameInfo
  m_isAttached = true
  
  InsertAtRange = True
End Function


' Insert this game at the given cell. since the cell is supposed to be a single cell,
' just take Cell(1,1)
Function InsertAtCell(rgInsert as Range) As Boolean
  InsertAtRange Application.Range(rgInsert.Cells(1,1), rgInsert.Cells(1,1).Offset(10,0))
End Function

Function InsertAtCellOld(rgInsert as Range) As Boolean
  set rgInsert = rgInsert.Cells(1,1)
  Dim rgCurGameRow As Range
    
  Set rgCurGameRow = Application.Range(rgInsert.Cells(1, 1), rgInsert.Cells(1, 1).Offset(0, 2))
  ' ===== First Row - Top Team Name and Score
  If (m_gameDef.isTopFirstGame) Then
      rgCurGameRow.Cells(1, 1).Value = m_gameDef.topSource
  Else
      InsertFormulaForCell rgCurGameRow.Cells(1, 1), m_gameDef.bracket, m_gameDef.topSource
  End If
  
  NameCellForInsertGame rgCurGameRow.Cells(1, 1), GetCellNameForGameTop(m_gameDef.bracket, m_gameDef.gameNum)
  
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
  If (m_gameDef.loserToGame <> 0) Then
      loserToGameText = "(Loser to" + Str$(m_gameDef.loserToGame) + ")"
  End If
  
  InsertGameInfoCells rgCurGameRow.Cells(1, 1), m_gameDef.bracket, m_gameDef.fieldText, m_gameDef.gameTime, loserToGameText, m_gameDef.gameNum
  
  Set rgCurGameRow = rgCurGameRow.Offset(5, 0) ' skip the underline
  
  ' ===== Line Row
  FormatGameCell_LineCell rgCurGameRow
  Set rgCurGameRow = rgCurGameRow.Offset(1, 0)
  
  ' ===== Last Row - Bottom Team name and Score
  If (m_gameDef.isBottomFirstGame) Then
      rgCurGameRow.Cells(1, 1).Value = m_gameDef.bottomSource
  Else
      InsertFormulaForCell rgCurGameRow.Cells(1, 1), m_gameDef.bracket, m_gameDef.bottomSource
  End If
  NameCellForInsertGame rgCurGameRow.Cells(1, 1), GetCellNameForGameBottom(m_gameDef.bracket, m_gameDef.gameNum)
  
  FormatGameCell_TopBottomTeam rgCurGameRow.Cells(1, 1)
  FormatGameCell_TopBottomTeam rgCurGameRow.Cells(1, 2)
  
  set m_gameDef.rgTop = rgInsert.Cells(1,1)
  set m_gameDef.rgBottom = rgCurGameRow.Cells(1,1)
  m_isAttached = true
  InsertAtCell = True
end function

function GetBottomGameRange() as Range
  if (not m_isAttached) then stop

  set GetBottomGameRange = m_gameDef.rgBottom
end function