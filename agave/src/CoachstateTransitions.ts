// state machine for Coachstates

import { Coachstate } from "./Coachstate";
import { CoachTransition } from "./CoachTransition";

export class CoachstateTransitions
{
    static Transitions = new Map<Coachstate, Map<CoachTransition, Coachstate>>(
        [
            [Coachstate.Unknown,
            new Map<CoachTransition, Coachstate>(
                [
                    [CoachTransition.AddGame, Coachstate.DuringConstruction],
                    [CoachTransition.BuildBracket, Coachstate.AddFirstGame],
                    [CoachTransition.RemoveGame, Coachstate.DuringConstruction],
                    [CoachTransition.FinishTouches, Coachstate.Done],
                    [CoachTransition.Undo, Coachstate.DuringConstruction],
                    [CoachTransition.Redo, Coachstate.DuringConstruction],
                    [CoachTransition.PullChanges, Coachstate.DuringConstruction],
                    [CoachTransition.DirtyGameFound, Coachstate.GameDirty],
                    [CoachTransition.AllGamesLinked, Coachstate.AllGamesPlaced],
                    [CoachTransition.NoGamesLinked, Coachstate.AddFirstGame],
                    [CoachTransition.OneGameLinked, Coachstate.AfterFirstAdd]
                ]
            )],
            [
                Coachstate.InitialState,
                new Map<CoachTransition, Coachstate>(
                    [
                        [CoachTransition.AddGame, Coachstate.DuringConstruction],
                        [CoachTransition.BuildBracket, Coachstate.AddFirstGame],
                        [CoachTransition.RemoveGame, Coachstate.DuringConstruction],
                        [CoachTransition.FinishTouches, Coachstate.Done],
                        [CoachTransition.Undo, Coachstate.DuringConstruction],
                        [CoachTransition.Redo, Coachstate.DuringConstruction],
                        [CoachTransition.PullChanges, Coachstate.DuringConstruction],
                        [CoachTransition.DirtyGameFound, Coachstate.GameDirty],
                        [CoachTransition.AllGamesLinked, Coachstate.AllGamesPlaced],
                        [CoachTransition.NoGamesLinked, Coachstate.AddFirstGame],
                        [CoachTransition.OneGameLinked, Coachstate.AfterFirstAdd]
                    ]
                )
            ],
            [
                Coachstate.BracketCreation,
                new Map<CoachTransition, Coachstate>(
                    [
                        [CoachTransition.AddGame, Coachstate.DuringConstruction],
                        [CoachTransition.BuildBracket, Coachstate.AddFirstGame],
                        [CoachTransition.RemoveGame, Coachstate.DuringConstruction],
                        [CoachTransition.FinishTouches, Coachstate.Done],
                        [CoachTransition.Undo, Coachstate.DuringConstruction],
                        [CoachTransition.Redo, Coachstate.DuringConstruction],
                        [CoachTransition.PullChanges, Coachstate.DuringConstruction],
                        [CoachTransition.DirtyGameFound, Coachstate.GameDirty],
                        [CoachTransition.AllGamesLinked, Coachstate.AllGamesPlaced],
                        [CoachTransition.NoGamesLinked, Coachstate.AddFirstGame],
                        [CoachTransition.OneGameLinked, Coachstate.AfterFirstAdd]
                    ]
                )
            ],
            [
                Coachstate.AddFirstGame,
                new Map<CoachTransition, Coachstate>(
                    [
                        [CoachTransition.AddGame, Coachstate.AfterFirstAdd],
                        [CoachTransition.BuildBracket, Coachstate.Unknown],
                        [CoachTransition.RemoveGame, Coachstate.Unknown],
                        [CoachTransition.FinishTouches, Coachstate.Unknown],
                        [CoachTransition.Undo, Coachstate.DuringConstruction],
                        [CoachTransition.Redo, Coachstate.DuringConstruction],
                        [CoachTransition.PullChanges, Coachstate.DuringConstruction],
                        [CoachTransition.DirtyGameFound, Coachstate.GameDirty],
                        [CoachTransition.AllGamesLinked, Coachstate.AllGamesPlaced],
                        [CoachTransition.NoGamesLinked, Coachstate.AddFirstGame],
                        [CoachTransition.OneGameLinked, Coachstate.AfterFirstAdd]
                    ]
                )
            ],
            [
                Coachstate.AfterFirstAdd,
                new Map<CoachTransition, Coachstate>(
                    [
                        [CoachTransition.AddGame, Coachstate.DuringConstruction],
                        [CoachTransition.BuildBracket, Coachstate.Unknown],
                        [CoachTransition.RemoveGame, Coachstate.Unknown],
                        [CoachTransition.FinishTouches, Coachstate.Unknown],
                        [CoachTransition.Undo, Coachstate.DuringConstruction],
                        [CoachTransition.Redo, Coachstate.DuringConstruction],
                        [CoachTransition.PullChanges, Coachstate.DuringConstruction],
                        [CoachTransition.DirtyGameFound, Coachstate.GameDirty],
                        [CoachTransition.AllGamesLinked, Coachstate.AllGamesPlaced],
                        [CoachTransition.NoGamesLinked, Coachstate.AddFirstGame],
                        [CoachTransition.OneGameLinked, Coachstate.AfterFirstAdd]
                    ]
                )
            ],
            [
                Coachstate.DuringConstruction,
                new Map<CoachTransition, Coachstate>(
                    [
                        [CoachTransition.AddGame, Coachstate.DuringConstruction],
                        [CoachTransition.BuildBracket, Coachstate.Unknown],
                        [CoachTransition.RemoveGame, Coachstate.Unknown],
                        [CoachTransition.FinishTouches, Coachstate.Unknown],
                        [CoachTransition.Undo, Coachstate.DuringConstruction],
                        [CoachTransition.Redo, Coachstate.DuringConstruction],
                        [CoachTransition.PullChanges, Coachstate.DuringConstruction],
                        [CoachTransition.DirtyGameFound, Coachstate.GameDirty],
                        [CoachTransition.AllGamesLinked, Coachstate.AllGamesPlaced],
                        [CoachTransition.NoGamesLinked, Coachstate.AddFirstGame],
                        [CoachTransition.OneGameLinked, Coachstate.AfterFirstAdd]
                    ]
                )
            ],
            [
                Coachstate.Championship,
                new Map<CoachTransition, Coachstate>(
                    [
                        [CoachTransition.AddGame, Coachstate.DuringConstruction],
                        [CoachTransition.BuildBracket, Coachstate.Unknown],
                        [CoachTransition.RemoveGame, Coachstate.Unknown],
                        [CoachTransition.FinishTouches, Coachstate.Unknown],
                        [CoachTransition.Undo, Coachstate.DuringConstruction],
                        [CoachTransition.Redo, Coachstate.DuringConstruction],
                        [CoachTransition.PullChanges, Coachstate.DuringConstruction],
                        [CoachTransition.DirtyGameFound, Coachstate.GameDirty],
                        [CoachTransition.AllGamesLinked, Coachstate.AllGamesPlaced],
                        [CoachTransition.NoGamesLinked, Coachstate.AddFirstGame],
                        [CoachTransition.OneGameLinked, Coachstate.AfterFirstAdd]
                    ]
                )
            ],
            [
                Coachstate.AllGamesPlaced,
                new Map<CoachTransition, Coachstate>(
                    [
                        [CoachTransition.AddGame, Coachstate.DuringConstruction],
                        [CoachTransition.BuildBracket, Coachstate.Unknown],
                        [CoachTransition.RemoveGame, Coachstate.Unknown],
                        [CoachTransition.FinishTouches, Coachstate.Unknown],
                        [CoachTransition.Undo, Coachstate.DuringConstruction],
                        [CoachTransition.Redo, Coachstate.DuringConstruction],
                        [CoachTransition.PullChanges, Coachstate.DuringConstruction],
                        [CoachTransition.DirtyGameFound, Coachstate.GameDirty],
                        [CoachTransition.AllGamesLinked, Coachstate.AllGamesPlaced],
                        [CoachTransition.NoGamesLinked, Coachstate.AddFirstGame],
                        [CoachTransition.OneGameLinked, Coachstate.AfterFirstAdd]
                    ]
                )
            ],
            [
                Coachstate.AfterInsertGameFailed,
                new Map<CoachTransition, Coachstate>(
                    [
                        [CoachTransition.AddGame, Coachstate.DuringConstruction],
                        [CoachTransition.BuildBracket, Coachstate.Unknown],
                        [CoachTransition.RemoveGame, Coachstate.Unknown],
                        [CoachTransition.FinishTouches, Coachstate.Unknown],
                        [CoachTransition.Undo, Coachstate.DuringConstruction],
                        [CoachTransition.Redo, Coachstate.DuringConstruction],
                        [CoachTransition.PullChanges, Coachstate.DuringConstruction],
                        [CoachTransition.DirtyGameFound, Coachstate.GameDirty],
                        [CoachTransition.AllGamesLinked, Coachstate.AllGamesPlaced],
                        [CoachTransition.NoGamesLinked, Coachstate.AddFirstGame],
                        [CoachTransition.OneGameLinked, Coachstate.AfterFirstAdd]
                    ]
                )
            ],
            [
                Coachstate.AfterInsertGameFailedOverlapping,
                new Map<CoachTransition, Coachstate>(
                    [
                        [CoachTransition.AddGame, Coachstate.DuringConstruction],
                        [CoachTransition.BuildBracket, Coachstate.Unknown],
                        [CoachTransition.RemoveGame, Coachstate.Unknown],
                        [CoachTransition.FinishTouches, Coachstate.Unknown],
                        [CoachTransition.Undo, Coachstate.DuringConstruction],
                        [CoachTransition.Redo, Coachstate.DuringConstruction],
                        [CoachTransition.PullChanges, Coachstate.DuringConstruction],
                        [CoachTransition.DirtyGameFound, Coachstate.GameDirty],
                        [CoachTransition.AllGamesLinked, Coachstate.AllGamesPlaced],
                        [CoachTransition.NoGamesLinked, Coachstate.AddFirstGame],
                        [CoachTransition.OneGameLinked, Coachstate.AfterFirstAdd]
                    ]
                )
            ],
            [
                Coachstate.GameDirty,
                new Map<CoachTransition, Coachstate>(
                    [
                        [CoachTransition.AddGame, Coachstate.DuringConstruction],
                        [CoachTransition.BuildBracket, Coachstate.Unknown],
                        [CoachTransition.RemoveGame, Coachstate.Unknown],
                        [CoachTransition.FinishTouches, Coachstate.Unknown],
                        [CoachTransition.Undo, Coachstate.DuringConstruction],
                        [CoachTransition.Redo, Coachstate.DuringConstruction],
                        [CoachTransition.PullChanges, Coachstate.DuringConstruction],
                        [CoachTransition.DirtyGameFound, Coachstate.GameDirty],
                        [CoachTransition.AllGamesLinked, Coachstate.AllGamesPlaced],
                        [CoachTransition.NoGamesLinked, Coachstate.AddFirstGame],
                        [CoachTransition.OneGameLinked, Coachstate.AfterFirstAdd]
                    ]
                )
            ],
            [
                Coachstate.Done,
                new Map<CoachTransition, Coachstate>(
                    [
                        [CoachTransition.AddGame, Coachstate.DuringConstruction],
                        [CoachTransition.BuildBracket, Coachstate.Unknown],
                        [CoachTransition.RemoveGame, Coachstate.Unknown],
                        [CoachTransition.FinishTouches, Coachstate.Unknown],
                        [CoachTransition.Undo, Coachstate.DuringConstruction],
                        [CoachTransition.Redo, Coachstate.DuringConstruction],
                        [CoachTransition.PullChanges, Coachstate.DuringConstruction],
                        [CoachTransition.DirtyGameFound, Coachstate.GameDirty],
                        [CoachTransition.AllGamesLinked, Coachstate.AllGamesPlaced],
                        [CoachTransition.NoGamesLinked, Coachstate.AddFirstGame],
                        [CoachTransition.OneGameLinked, Coachstate.AfterFirstAdd]
                    ]
                )
            ],
        ]);

    static GetNextState(currentState: Coachstate, transition: CoachTransition): Coachstate
    {
        const row = this.Transitions.get(currentState);
        const newState = row?.get(transition) ?? Coachstate.Unknown;

        return newState;
    }
}