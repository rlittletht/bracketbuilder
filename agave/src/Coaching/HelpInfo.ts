import * as React from "react";

export class HelpTopic
{
    static Root = "";
    static Starting = "start";
    static Editing = "edit";
    static Commands = "commands";
    static Commands_PickupGame = "commands#pickup";
    static Commands_LuckyOneGame = "faq#luckyOneGame";
    static Commands_LuckyRestGames = "faq#luckyRestGames";
    static Commands_RepairGame = "commands#repair";
    static Commands_ConvertBracket = "commands#convertBracket";
    static FAQ = "faq";
    static FAQ_ManuallySelect = "faq#manualSelect";
    static FAQ_InsertLocation = "faq#InsertLocation";
    static FAQ_GameDependencies = "faq#gameDependencies";
    static FAQ_BrokenBracket = "faq#broken";
    static FAQ_Exceptions = "faq#exceptions";
    static FAQ_InsertFailed = "faq.insertFailed";
    static FAQ_BracketNotReady = "faq.bracketNotReady";
    static FAQ_CustomBrackets = "faq.customBrackets";
}

export interface IHelpInfo
{
    node?: React.ReactNode;
    text?: string;
    topic: HelpTopic;
}

export class HelpInfo
{
    static mapTopics = new Map<HelpTopic, string>(
        [
            [HelpTopic.Root, "BracketBuilder.html"],
            [HelpTopic.Starting, "BracketBuilder.html"],
            [HelpTopic.Editing, "SheetEditing.html"],
            [HelpTopic.Commands, "Commands.html"],
            [HelpTopic.Commands_LuckyOneGame, "Commands.html#LuckyOneGame"],
            [HelpTopic.Commands_LuckyRestGames, "Commands.html#LuckyRestOfGames"],
            [HelpTopic.Commands_PickupGame, "Commands.html#PickUpGame"],
            [HelpTopic.Commands_RepairGame, "Commands.html#RepairGame"],
            [HelpTopic.Commands_ConvertBracket, "Commands.html#RemoveWhatIf"],
            [HelpTopic.FAQ, "FAQ.html"],
            [HelpTopic.FAQ_ManuallySelect, "FAQ.html#manuallySelect"],
            [HelpTopic.FAQ_GameDependencies, "FAQ.html#gameDependencies"],
            [HelpTopic.FAQ_InsertLocation, "FAQ.html#insertLocation"],
            [HelpTopic.FAQ_BrokenBracket, "FAQ.html#broken"],
            [HelpTopic.FAQ_Exceptions, "FAQ.html#exceptions"],
            [HelpTopic.FAQ_InsertFailed, "FAQ.html#insertFailed"],
            [HelpTopic.FAQ_BracketNotReady, "FAQ.html#bracketNotReady"],
            [HelpTopic.FAQ_CustomBrackets, "FAQ.html#customBrackets"],
        ]
    );

    static BuildHelpLink(topic: HelpTopic): string
    {
        if (!this.mapTopics.has(topic))
            return this.mapTopics.get(HelpTopic.Starting);

        return this.mapTopics.get(topic);
    }
}