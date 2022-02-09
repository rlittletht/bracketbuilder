Attribute VB_Name = "FormulaBuilder"
Option Explicit
' My Test Comment 2
Function ScoreRef(teamRef As String)
    ScoreRef = "OFFSET(" + teamRef + ",0,1)"
End Function

Function Team1ScoreRef(bracket As String, Game As String)
    Team1ScoreRef = ScoreRef(Team1Ref(bracket, Game))
End Function

Function Team2ScoreRef(bracket As String, Game As String)
    Team2ScoreRef = ScoreRef(Team2Ref(bracket, Game))
End Function

Function Team1Ref(bracket As String, Game As String)
    Team1Ref = bracket + "_G" + Game + "_1"
End Function

Function Team2Ref(bracket As String, Game As String)
    Team2Ref = bracket + "_G" + Game + "_2"
End Function

Function CheckBuildingOutput(outputIfBuilding As String)
    CheckBuildingOutput = "IF($A$1=""BUILDING""," + outputIfBuilding + ", """")"
    
End Function

Function WinnerFormula(bracket As String, Game As String) As String
    Dim t1 As String
    Dim t2 As String
    Dim t1Score As String
    Dim t2Score As String
    Dim noTeamString As String
    
    noTeamString = CheckBuildingOutput("""W" + Game + """")
    
    t1Score = Team1ScoreRef(bracket, Game)
    t2Score = Team2ScoreRef(bracket, Game)
    t1 = Team1Ref(bracket, Game)
    t2 = Team2Ref(bracket, Game)
    
    WinnerFormula = "=IF(" + t1Score + "=" + t2Score + "," + noTeamString + ",IF(" + t1Score + ">" + t2Score + "," + t1 + "," + t2 + "))"

End Function


Function LoserFormula(bracket As String, Game As String) As String
    Dim t1 As String
    Dim t2 As String
    Dim t1Score As String
    Dim t2Score As String
    Dim noTeamString As String
    
    noTeamString = """L" + Game + """"
    
    t1Score = Team1ScoreRef(bracket, Game)
    t2Score = Team2ScoreRef(bracket, Game)
    t1 = Team1Ref(bracket, Game)
    t2 = Team2Ref(bracket, Game)
    
    LoserFormula = "=IF(" + t1Score + "=" + t2Score + "," + noTeamString + ",IF(" + t1Score + "<" + t2Score + "," + t1 + "," + t2 + "))"

End Function
