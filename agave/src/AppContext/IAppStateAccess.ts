
export interface IAppStateAccess
{
    set HeroListDirty(dirty: boolean);
    get HeroListDirty(): boolean;
    set BracketDirtyForBracketEdit(dirty: boolean);
    get BracketDirtyForBracketEdit(): boolean;
    set RulesDirtyForRulesEdit(dirty: boolean);
    get RulesDirtyForRulesEdit(): boolean;
    set SheetsHidden(hidden: boolean);
    get SheetsHidden(): boolean;
    set DaysFrozen(frozen: boolean);
    get DaysFrozen(): boolean;
}

