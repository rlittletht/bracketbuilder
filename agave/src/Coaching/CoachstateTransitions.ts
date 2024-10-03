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
                    [CoachTransition.BrokenGameFound, Coachstate.BrokenGame],
                    [CoachTransition.AllGamesLinked, Coachstate.AllGamesPlaced],
                    [CoachTransition.NoGamesLinked, Coachstate.AddFirstGame],
                    [CoachTransition.OneGameLinked, Coachstate.AfterFirstAdd],
                    [CoachTransition.LuckyNext, Coachstate.AfterLuckyNext]
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
                        [CoachTransition.BrokenGameFound, Coachstate.BrokenGame],
                        [CoachTransition.AllGamesLinked, Coachstate.AllGamesPlaced],
                        [CoachTransition.NoGamesLinked, Coachstate.AddFirstGame],
                        [CoachTransition.OneGameLinked, Coachstate.AfterFirstAdd],
                        [CoachTransition.LuckyNext, Coachstate.AfterLuckyNext]
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
                        [CoachTransition.BrokenGameFound, Coachstate.BrokenGame],
                        [CoachTransition.AllGamesLinked, Coachstate.AllGamesPlaced],
                        [CoachTransition.NoGamesLinked, Coachstate.AddFirstGame],
                        [CoachTransition.OneGameLinked, Coachstate.AfterFirstAdd],
                        [CoachTransition.LuckyNext, Coachstate.AfterLuckyNext]
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
                        [CoachTransition.BrokenGameFound, Coachstate.BrokenGame],
                        [CoachTransition.AllGamesLinked, Coachstate.AllGamesPlaced],
                        [CoachTransition.NoGamesLinked, Coachstate.AddFirstGame],
                        [CoachTransition.OneGameLinked, Coachstate.AfterFirstAdd],
                        [CoachTransition.LuckyNext, Coachstate.AfterLuckyNext]
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
                        [CoachTransition.BrokenGameFound, Coachstate.BrokenGame],
                        [CoachTransition.AllGamesLinked, Coachstate.AllGamesPlaced],
                        [CoachTransition.NoGamesLinked, Coachstate.AddFirstGame],
                        [CoachTransition.OneGameLinked, Coachstate.AfterFirstAdd],
                        [CoachTransition.LuckyNext, Coachstate.AfterLuckyNext]
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
                        [CoachTransition.BrokenGameFound, Coachstate.BrokenGame],
                        [CoachTransition.AllGamesLinked, Coachstate.AllGamesPlaced],
                        [CoachTransition.NoGamesLinked, Coachstate.AddFirstGame],
                        [CoachTransition.OneGameLinked, Coachstate.AfterFirstAdd],
                        [CoachTransition.LuckyNext, Coachstate.AfterLuckyNext]
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
                        [CoachTransition.BrokenGameFound, Coachstate.BrokenGame],
                        [CoachTransition.AllGamesLinked, Coachstate.AllGamesPlaced],
                        [CoachTransition.NoGamesLinked, Coachstate.AddFirstGame],
                        [CoachTransition.OneGameLinked, Coachstate.AfterFirstAdd],
                        [CoachTransition.LuckyNext, Coachstate.Unknown]
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
                        [CoachTransition.BrokenGameFound, Coachstate.BrokenGame],
                        [CoachTransition.AllGamesLinked, Coachstate.AllGamesPlaced],
                        [CoachTransition.NoGamesLinked, Coachstate.AddFirstGame],
                        [CoachTransition.OneGameLinked, Coachstate.AfterFirstAdd],
                        [CoachTransition.LuckyNext, Coachstate.DuringConstruction]
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
                        [CoachTransition.BrokenGameFound, Coachstate.BrokenGame],
                        [CoachTransition.AllGamesLinked, Coachstate.AllGamesPlaced],
                        [CoachTransition.NoGamesLinked, Coachstate.AddFirstGame],
                        [CoachTransition.OneGameLinked, Coachstate.AfterFirstAdd],
                        [CoachTransition.LuckyNext, Coachstate.Unknown]
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
                        [CoachTransition.BrokenGameFound, Coachstate.BrokenGame],
                        [CoachTransition.AllGamesLinked, Coachstate.AllGamesPlaced],
                        [CoachTransition.NoGamesLinked, Coachstate.AddFirstGame],
                        [CoachTransition.OneGameLinked, Coachstate.AfterFirstAdd],
                        [CoachTransition.LuckyNext, Coachstate.Unknown]
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
                        [CoachTransition.BrokenGameFound, Coachstate.BrokenGame],
                        [CoachTransition.AllGamesLinked, Coachstate.AllGamesPlaced],
                        [CoachTransition.NoGamesLinked, Coachstate.AddFirstGame],
                        [CoachTransition.OneGameLinked, Coachstate.AfterFirstAdd],
                        [CoachTransition.LuckyNext, Coachstate.Unknown]
                    ]
                )
            ],
            [
                Coachstate.BrokenGame,
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
                        [CoachTransition.BrokenGameFound, Coachstate.BrokenGame],
                        [CoachTransition.AllGamesLinked, Coachstate.AllGamesPlaced],
                        [CoachTransition.NoGamesLinked, Coachstate.AddFirstGame],
                        [CoachTransition.OneGameLinked, Coachstate.AfterFirstAdd],
                        [CoachTransition.LuckyNext, Coachstate.Unknown]
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
                        [CoachTransition.BrokenGameFound, Coachstate.BrokenGame],
                        [CoachTransition.AllGamesLinked, Coachstate.AllGamesPlaced],
                        [CoachTransition.NoGamesLinked, Coachstate.AddFirstGame],
                        [CoachTransition.OneGameLinked, Coachstate.AfterFirstAdd],
                        [CoachTransition.LuckyNext, Coachstate.Unknown]
                    ]
                )
            ],
            [
                Coachstate.AfterLuckyNext,
                new Map<CoachTransition, Coachstate>(
                    [
                        [CoachTransition.AddGame, Coachstate.AfterLuckyNext],
                        [CoachTransition.BuildBracket, Coachstate.Unknown],
                        [CoachTransition.RemoveGame, Coachstate.BeforeLuckyNext],
                        [CoachTransition.FinishTouches, Coachstate.Unknown],
                        [CoachTransition.Undo, Coachstate.BeforeLuckyNext],
                        [CoachTransition.Redo, Coachstate.AfterLuckyNext],
                        [CoachTransition.PullChanges, Coachstate.DuringConstruction],
                        [CoachTransition.DirtyGameFound, Coachstate.GameDirty],
                        [CoachTransition.BrokenGameFound, Coachstate.BrokenGame],
                        [CoachTransition.AllGamesLinked, Coachstate.AllGamesPlaced],
                        [CoachTransition.NoGamesLinked, Coachstate.BeforeLuckyNext],
                        [CoachTransition.OneGameLinked, Coachstate.AfterLuckyNext],
                        [CoachTransition.LuckyNext, Coachstate.AfterLuckyNext]
                    ]
                )
            ],
            [
                Coachstate.BeforeLuckyNext,
                new Map<CoachTransition, Coachstate>(
                    [
                        [CoachTransition.AddGame, Coachstate.AfterLuckyNext],
                        [CoachTransition.BuildBracket, Coachstate.Unknown],
                        [CoachTransition.RemoveGame, Coachstate.BeforeLuckyNext],
                        [CoachTransition.FinishTouches, Coachstate.Unknown],
                        [CoachTransition.Undo, Coachstate.BeforeLuckyNext],
                        [CoachTransition.Redo, Coachstate.AfterLuckyNext],
                        [CoachTransition.PullChanges, Coachstate.DuringConstruction],
                        [CoachTransition.DirtyGameFound, Coachstate.GameDirty],
                        [CoachTransition.BrokenGameFound, Coachstate.BrokenGame],
                        [CoachTransition.AllGamesLinked, Coachstate.AllGamesPlaced],
                        [CoachTransition.NoGamesLinked, Coachstate.BeforeLuckyNext],
                        [CoachTransition.OneGameLinked, Coachstate.AfterLuckyNext],
                        [CoachTransition.LuckyNext, Coachstate.AfterLuckyNext]
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