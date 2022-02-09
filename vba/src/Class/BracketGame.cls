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
' CONSIDER using https://github.com/rubberduck-vba/Rubberduck to edit in VBE
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

Sub PushToGameWell(well as GameWell)
    well.PushGame m_gameDef
End Sub

Sub PopFromGameWell(well as GameWell)
    m_gameDef = well.PopGame()
End Sub

' ============================================================================
' LoadChampionshipPlaceholderIfPresent
'
' There are only 3 rows in a championship placeholder. Check for a formula
' in either non-underline cell and see if its a championship placeholder.
'
' if it is, load it and return true. else false
' ============================================================================
Function LoadChampionshipPlaceholderIfPresent(rgIn As Range) As Boolean
    dim c As Integer
    Dim bracket as String, gameName as String, staticResult As String
    Dim rgConnectingLine As Range
    Dim rg as Range
    
    set rg = rgIn.Cells(1,1)
    ' walk up at most 2 cells
    c = 3
    while (c > 0)
        if (Len(rg.Formula) > 0 And Left$(rg.Formula,1) = "=") Then
            if GetGameInfoFromFormula(rg.Formula, bracket, gameName, staticResult) Then
                if (Not CellHasName(rg)) Then
                    m_gameDef.gameNum = Int(Mid$(gameName, 2))
                    m_gameDef = GetGameDefinitionFromBracketGame(bracket, m_gameDef.gameNum + 1)
                    set m_gameDef.rgTop = rg.Cells(1,1)
                    set m_gameDef.rgGameInfo = m_gameDef.rgTop.Offset(2,0)
                    ' Now get the connecting lines
                    set rgConnectingLine = m_gameDef.rgTop.Offset(1,0)
                    if (Left$(m_gameDef.topSource,1) = "W") Then
                        if (ExtendConnectingLineRangeForGame(rgConnectingLine, Val(Mid$(m_gameDef.topSource, 2)), True)) Then
                            set m_gameDef.rgTopConnectingLine = rgConnectingLine
                        end if
                    end if                    
                    LoadChampionshipPlaceholderIfPresent = True
                    m_isAttached = True
                    Exit Function
                End If
            End If
        End If
        set rg = rg.Offset(-1,0)
        c = c - 1
    wend
End Function

' ============================================================================
' LoadFromRange
' ============================================================================
Function LoadFromRange(rgLoad As Range) As Boolean
    Dim rgFullGame as Range
    Dim rgTopGame as Range
    Dim rgBottomGame as Range
    Dim rgGameInfo as Range
    dim rgConnectingLine as Range
    Dim rg As Range

    set rg = rgLoad

    LoadFromRange = False

    ' First, Check for championship placeholder
    if (LoadChampionshipPlaceholderIfPresent(rg)) Then 
        LoadFromRange = True
        Exit Function
    End If

    Set rgFullGame = GetFullGameRangeFromCellWithinGameFirstColumn(rg)

    If (Not FillGameRangesFromFullGameRange(rgFullGame, rgTopGame, rgBottomGame, rgGameInfo)) Then Exit Function

    ' now that we have all the ranges, fill in all the details
    Dim bracket as String, gameName as String, homeAway As String, staticResult as String
    Dim gd as GameDefinition

    if (Not GetGameInfoValuesFromRangeCellName(rgTopGame, bracket, gameName, homeAway)) Then Exit Function
    gd.gameNum = Int(Mid$(gameName, 2)) ' doesn't have to be filled out early, just convenient storage space

    ' First, initialize with the static bracket definition for the game (this will fill in things
    ' like loserToGame and winnerToGame, which aren't easily extracted from the inserted game)
    gd = GetGameDefinitionFromBracketGame(bracket, gd.gameNum)
    gd.bracket = bracket
    gd.swapHomeAway = (homeAway <> "1")
    
    if (Not GetGameInfoFromFormula(rgTopGame.Formula, bracket, gameName, staticResult)) Then Exit Function
    gd.topSource = staticResult
    if (bracket = "") Then gd.isTopFirstGame = True
    
    ' Do some sanity checks to make sure the games are consistent
    if (Not GetGameInfoValuesFromRangeCellName(rgBottomGame, bracket, gameName, homeAway)) Then Exit Function

    if (gd.bracket <> bracket) Then Stop
    if (gd.gameNum <> Int(Mid$(gameName, 2))) Then Stop
    if (gd.swapHomeAway <> (homeAway <> "2")) Then Stop

    if (Not GetGameInfoFromFormula(rgBottomGame.Formula, bracket, gameName, staticResult)) Then Exit Function
    gd.bottomSource = staticResult
    if (bracket = "") Then gd.isBottomFirstGame = True
        
    gd.fieldText = rgGameInfo.Cells(1, 1).Value
    gd.gameTime = rgGameInfo.Cells(3, 1).Value
    gd.loserToGameText = rgGameInfo.Cells(5, 1).Value

    ' Now get the connecting lines
    set rgConnectingLine = rgTopGame.Offset(1,0)
    if (Left$(gd.topSource,1) = "W") Then
        if (ExtendConnectingLineRangeForGame(rgConnectingLine, Val(Mid$(gd.topSource, 2)), True)) Then
          set gd.rgTopConnectingLine = rgConnectingLine
        end if
    end if
    set rgConnectingLine = rgBottomGame.Offset(-1,0)
    if (Left$(gd.bottomSource,1) = "W") Then
        if (ExtendConnectingLineRangeForGame(rgConnectingLine, Val(Mid$(gd.bottomSource, 2)), True)) Then
          set gd.rgBottomConnectingLine = rgConnectingLine
        end if
    end if

    Set gd.rgGameInfo = rgGameInfo
    Set gd.rgTop = rgTopGame
    set gd.rgBottom = rgBottomGame

    m_gameDef = gd
    m_isAttached = True
    LoadFromRange = True
End Function

' ============================================================================
' IsRangeValidForGameInsert
'
' We have a specific range we are being asked to insert in. It must meet
' the criteria for a game:
' * The first cell MUST be followed below by an underline row
' * The last cell MUST be preceded above by an underline row
' * There must be at least 5 rows between the underline rows (or 9 between
'   top and bottom game)
' ============================================================================
Function IsRangeValidForGameInsert(rg as Range) As Boolean
  Dim rgTopGame as Range
  Dim rgBottomGame as Range
  Dim rgInsert as Range

  set rgInsert = rg

  set rgTopGame = rgInsert.Cells(1,1)
  set rgBottomGame = rgInsert.Cells(rgInsert.Rows.Count,1)

  IsRangeValidForGameInsert = False

  if (Not IsCellSuitableForTopGame(rgTopGame)) Then Exit Function
  if (Not IsCellSuitableForBottomGame(rgBottomGame)) Then Exit Function

  if (rgBottomGame.Row - rgTopGame.Row < 7) Then Exit Function
  IsRangeValidForGameInsert = true
End Function

' ============================================================================
' InsertChampionPlaceholderAtRange
'
' Insert this game as a Champion placeholder
' ============================================================================
Function InsertChampionPlaceholderAtRange(rg As Range) As Boolean
  dim rgChampion as Range
  dim rgGameInfo as Range
  dim rgInsert as Range
  dim rgConnectingLine as Range

  set rgInsert = rg

  if (Not m_gameDef.isChampion) then stop

  set rgChampion = rgInsert.Cells(1,1)
  set rgGameInfo = rgChampion.Offset(2,0)

  InsertChampionPlaceholderAtRange = False

  if (Not IsCellSuitableForTopGame(rgChampion)) Then Exit Function

  ' ===== First Row - Top Team Name and Score
  InsertFormulaForCell rgChampion, m_gameDef.bracket, "W" + Mid$(Str$(m_gameDef.gameNum - 1), 2)
  FormatGameCell_TopBottomTeam rgChampion
    
  ' ===== Horizontal Line Row
  set rgConnectingLine = Application.Range(rgChampion.Offset(1,0), rgChampion.Offset(1,2))
  FormatGameCell_LineCell rgConnectingLine
  if (Left$(m_gameDef.topSource,1) = "W") Then
      if (ExtendConnectingLineRangeForGame(rgConnectingLine, Val(Mid$(m_gameDef.topSource, 2)), False)) Then
        FormatGameCell_LineCell rgConnectingLine
        set m_gameDef.rgTopConnectingLine = rgConnectingLine
      end if
  end if

  ' ===== Game Info
  FormatGameCell_BodyTextCell rgGameInfo
  rgGameInfo.Value = "Champion"

  set m_gameDef.rgTop = rgChampion
  set m_gameDef.rgGameInfo = rgGameInfo
  m_isAttached = true
  InsertChampionPlaceholderAtRange = True
End Function

' ============================================================================
' InsertAtRange
' ============================================================================
Function InsertAtRange(rg as range) As Boolean
  InsertAtRange = False
  Dim rgInsert as Range

  set rgInsert = rg

  ' sanitize the range so its just one column
  set rgInsert = Application.Range(rgInsert.Cells(1,1), rgInsert.Cells(rgInsert.Rows.Count, 1))

  if (m_gameDef.isChampion) Then
    InsertAtRange = InsertChampionPlaceholderAtRange(rgInsert)
    exit function
  end if
  
  If (Not IsRangeValidForGameInsert(rgInsert)) Then Exit Function
  
  Dim rgTopGame as Range
  Dim rgBottomGame as Range
  Dim rgGameInfo as Range
  Dim rgConnectingLine As Range

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
  set rgConnectingLine = Application.Range(rgTopGame.Offset(1,0), rgTopGame.Offset(1,2))
  FormatGameCell_LineCell rgConnectingLine
  if (Left$(m_gameDef.topSource,1) = "W") Then
      if (ExtendConnectingLineRangeForGame(rgConnectingLine, Val(Mid$(m_gameDef.topSource, 2)), False)) Then
        FormatGameCell_LineCell rgConnectingLine
        set m_gameDef.rgTopConnectingLine = rgConnectingLine
      end if
  end if

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
  set rgConnectingLine = Application.Range(rgBottomGame.Offset(-1,0), rgBottomGame.Offset(-1,2))
  FormatGameCell_LineCell rgConnectingLine
  if (Left$(m_gameDef.bottomSource,1) = "W") Then
    if (ExtendConnectingLineRangeForGame(rgConnectingLine, Val(Mid$(m_gameDef.bottomSource, 2)), False)) Then
      FormatGameCell_LineCell rgConnectingLine
      set m_gameDef.rgTopConnectingLine = rgConnectingLine
    end if
  end if

  ' ===== Last Row - Bottom Team name and Score
  If (m_gameDef.isBottomFirstGame) Then
      rgBottomGame.Cells(1, 1).Value = m_gameDef.bottomSource
  Else
      InsertFormulaForCell rgBottomGame, m_gameDef.bracket, m_gameDef.bottomSource
  End If
  NameCellForInsertGame rgBottomGame, GetCellNameForGameBottom(m_gameDef.bracket, m_gameDef.gameNum)
  
  FormatGameCell_TopBottomTeam rgBottomGame
  FormatGameCell_TopBottomTeam rgBottomGame.Offset(0,1)

  ' Now record where we put things
  set m_gameDef.rgTop = rgTopGame
  set m_gameDef.rgBottom = rgBottomGame
  set m_gameDef.rgGameInfo = rgGameInfo
  m_isAttached = true

  InsertAtRange = True
End Function

' ============================================================================
' InsertAtCell
'
' Insert this game at the given cell. since the cell is supposed to be a single cell,
' just take Cell(1,1)
' ============================================================================
Function InsertAtCell(rgInsert as Range) As Boolean
  InsertAtRange Application.Range(rgInsert.Cells(1,1), rgInsert.Cells(1,1).Offset(10,0))
End Function

function GetBottomGameRange() as Range
  if (not m_isAttached) then stop

  if (m_gameDef.isChampion) Then
    set GetBottomGameRange = m_gameDef.rgGameInfo
  else
    set GetBottomGameRange = m_gameDef.rgBottom
  end if
end function

' ============================================================================
' DeleteFromAttachedRange
' ============================================================================
sub DeleteFromAttachedRange()
    if not m_isAttached then exit sub
    
    if m_gameDef.isChampion Then
        ' there are no cell names to delete, just content
        Application.Range(m_gameDef.rgTop.Cells(1,1), m_gameDef.rgGameInfo.Cells(1,3)).Clear
        FormatGameCell_NoLineCell Application.Range(m_gameDef.rgTop.Cells(1,1), m_gameDef.rgGameInfo.Cells(1,3))
        if (Not(m_gameDef.rgTopConnectingLine is Nothing)) Then
            FormatGameCell_NoLineCell m_gameDef.rgTopConnectingLine
        end if
        m_isAttached = False
        Exit Sub
    End If

    RemoveGameInfoCellsRange m_gameDef.rgGameInfo
    m_gameDef.rgTop.Name.Delete
    m_gameDef.rgBottom.Name.Delete
    Application.Range(m_gameDef.rgTop.Cells(1,1), m_gameDef.rgBottom.Cells(1,3)).Clear
    FormatGameCell_NoLineCell Application.Range(m_gameDef.rgTop.Cells(1,1), m_gameDef.rgBottom.Cells(1,3))
    if (Not(m_gameDef.rgTopConnectingLine is Nothing)) Then
        FormatGameCell_NoLineCell m_gameDef.rgTopConnectingLine
    end if
    if (Not(m_gameDef.rgBottomConnectingLine is Nothing)) Then
        FormatGameCell_NoLineCell m_gameDef.rgBottomConnectingLine
    end if    
    m_isAttached = False
end sub