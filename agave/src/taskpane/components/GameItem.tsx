import * as React from "react";
import { IAppContext, TheAppContext } from "../../AppContext/AppContext";
import { BracketGame, IBracketGame } from "../../BracketEditor/BracketGame";
import { InsertButton } from "./InsertButton";
import { ActionButton } from "./ActionButton";
import { StructureEditor } from "../../BracketEditor/StructureEditor/StructureEditor";
import { Stack, IStackStyles, IStackItemStyles } from '@fluentui/react';
import { FontIcon } from '@fluentui/react/lib/Icon';
import { mergeStyles, mergeStyleSets } from '@fluentui/react/lib/Styling';
import { Teachable, TeachableActiveDelegate, TeachableId } from "./Teachable";
import { DirectionalHint } from '@fluentui/react';
import { Coachstate } from "../../Coaching/Coachstate";
import { _TimerStack } from "../../PerfTimer";

export interface GameItemProps
{
    idx: number;
    game: IBracketGame;
    bracketName: string;
    linkedToGrid: boolean;
    teachableAdd: TeachableActiveDelegate;
    teachableRemove: TeachableActiveDelegate;
}

export interface GameItemState
{
}


export class GameItem extends React.Component<GameItemProps, GameItemState>
{
    context!: IAppContext;
    static contextType = TheAppContext;

    constructor(props, context) {
        super(props, context);
    }

    static async DoInsertGame(appContext: IAppContext, bracketGame: IBracketGame): Promise<boolean>
    {
        _TimerStack.pushTimer("DoInsertGame");
        appContext.Teaching.clearCoachmark();
        await StructureEditor.insertGameAtSelectionClick(appContext, bracketGame);

        _TimerStack.popTimer();
        return true; // we don't get an error back...
    }

    static async DoRemoveGame(appContext: IAppContext, bracketGame: IBracketGame): Promise<boolean>
    {
        _TimerStack.pushTimer("DoRemoveGame");
        appContext.Teaching.clearCoachmark();
        await StructureEditor.findAndRemoveGameClick(appContext, bracketGame);
        _TimerStack.popTimer();
        return true; // we don't get an error back...
    }

    render()
    {
        const iconClass = mergeStyles(
            {
                fontSize: 12,
                height: 0,
                width: 0,
                margin: '11px -8px'
            });

        const iconColors = mergeStyleSets(
            {
                branchColor: [{ color: 'white' }, iconClass],
                brokenColor: [{ color: 'black' }, iconClass]
            });
    
        let background = {};
        if (this.props.linkedToGrid)
            background = { background: "#cccccc" };

        const gameTitle: string =
            this.props.game.IsChampionship
                ? "Champion"
                : `${this.props.game.TopTeamName} vs ${this.props.game.BottomTeamName}`;

        const broken =
            this.props.game.IsBroken
                ? (
                    <Teachable
                        id={TeachableId.BrokenGame}
                        idx={this.props.idx}
                        isWide={true}
                        title={"Broken Game!"}
                        text={"This game (and maybe others) is broken and needs to be removed from the bracket. Click the - button to remove the game."}
                        visibleDelay={1000}
                        directionalHint={DirectionalHint.rightBottomEdge}>
                        <FontIcon aria-label="Broken" iconName="HeartBroken" className={iconColors.brokenColor}></FontIcon>
                    </Teachable>
                )
                : ( <span/> );

        const dirty =
            this.props.game.NeedsDataPull && !this.props.game.IsBroken
                ? (
                    <Teachable
                        id={TeachableId.DirtyGame}
                        idx={this.props.idx}
                        isWide={true}
                        title={"Needs updated"}
                        text={"Some part of this game was manually changed, like the team name, field, or time. You can update the bracket data by clicking on the \"Update Brackets\" button on the top toolbar. Its next to the undo and redo buttons."}
                        visibleDelay={1000}
                        directionalHint={DirectionalHint.rightBottomEdge}>
                        <FontIcon aria-label="Dirty" iconName="branchfork2" className={iconColors.branchColor}></FontIcon>
                    </Teachable>
                )
                : "";

        const addButton = (
            <ActionButton
                tooltip="Insert Game"
                tooltipId={`gid-${this.props.game.GameId.Value}`}
                bracketGame={this.props.game}
                delegate={GameItem.DoInsertGame}
                disabled={false}
                icon="Add" />
        );
        const titleText = this.context.Teaching.Coachstate == Coachstate.AddFirstGame
            ? "Add a game"
            : "Add another";

        const text = this.context.Teaching.Coachstate == Coachstate.AddFirstGame
            ? "Click on the + sign to add this game to the bracket"
            : "Keep adding games to fill the bracket";

        const teachableId = this.context.Teaching.Coachstate == Coachstate.AddFirstGame
            ? TeachableId.AddFirstGame
            : TeachableId.AddGame;

        const addWrapped = (
            <Teachable
                id={teachableId}
                idx={this.props.idx}
                isWide={true}
                isActiveEx={this.props.teachableAdd}
                title={titleText}
                text={text}
                visibleDelay={1000}
                directionalHint={DirectionalHint.bottomRightEdge}>
                {addButton}
            </Teachable>
        );

        const removeButton = (
            <ActionButton
                tooltip="Remove Game"
                tooltipId={`gid-${this.props.game.GameId.Value}`}
                bracketGame={this.props.game}
                delegate={GameItem.DoRemoveGame.bind(this)}
                disabled={false}
                icon="Remove"/>
        );

        const removeWrapped = (
                <Teachable
                    id={TeachableId.RemoveGame}
                    isWide={true}
                    isActiveEx={this.props.teachableRemove}
                    title="Start adding games"
                    text="Click on the - sign to add this game to the bracket"
                    visibleDelay={1000}
                    directionalHint={DirectionalHint.bottomRightEdge}>
                    {removeButton}
                </Teachable>
            );

        const gameNumber = this.props.game.IsChampionship
            ? (<span />)
            : (<>{ this.props.game.GameId.Value }</>);

        return (
            <div className="singleGameItem" style={background}>
                <Stack horizontal tokens={{ childrenGap: 8 }}>
                    <Stack.Item>
                        {dirty}{broken}
                    </Stack.Item>
                    <Stack.Item align="center" grow={0}>
                        {gameNumber}
                    </Stack.Item>
                    <Stack.Item align="center" grow={2}>
                        {gameTitle}
                    </Stack.Item>
                    <Stack.Item align="center" grow={0}>
                        <Stack horizontal horizontalAlign="end">
                            <Stack.Item grow={0}>
                                {addWrapped}
                            </Stack.Item>
                            <Stack.Item grow={0}>
                                {removeWrapped}
                            </Stack.Item>
                        </Stack>
                    </Stack.Item>
                </Stack>
            </div>
        );
    }
}