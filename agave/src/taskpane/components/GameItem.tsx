import * as React from "react";
import { IAppContext } from "../../AppContext";
import { BracketGame, IBracketGame } from "../../BracketEditor/BracketGame";
import { InsertButton } from "./InsertButton";
import { ActionButton } from "./ActionButton";
import { StructureEditor } from "../../BracketEditor/StructureEditor/StructureEditor";
import { Stack, IStackStyles, IStackItemStyles } from '@fluentui/react';
import { FontIcon } from '@fluentui/react/lib/Icon';
import { mergeStyles, mergeStyleSets } from '@fluentui/react/lib/Styling';

export interface GameItemProps
{
    game: IBracketGame;
    bracketName: string;
    appContext: IAppContext;
    linkedToGrid: boolean;
}

export interface GameItemState
{
}


export class GameItem extends React.Component<GameItemProps, GameItemState>
{
    constructor(props, context) {
        super(props, context);
    }

    async DoInsertGame(appContext: IAppContext, bracketGame: IBracketGame): Promise<boolean>
    {
        appContext.Timer.pushTimer("DoInsertGame");
        await StructureEditor.insertGameAtSelectionClick(appContext, bracketGame);
        appContext.Timer.popTimer();
        return true; // we don't get an error back...
    }

    async DoRemoveGame(appContext: IAppContext, bracketGame: IBracketGame): Promise<boolean>
    {
        appContext.Timer.pushTimer("DoRemoveGame");
        await StructureEditor.findAndRemoveGameClick(appContext, bracketGame);
        appContext.Timer.popTimer();
        return true; // we don't get an error back...
    }

    render()
    {
        const iconClass = mergeStyles(
            {
                fontSize: 12,
                height: 0,
                width: 0,
                margin: '11px -12px'
            });

        const iconColors = mergeStyleSets(
            {
                branchColor: [{ color: 'white' }, iconClass]
            });
    
        let background = {};
        if (this.props.linkedToGrid)
            background = { background: "#cccccc" };

        const gameTitle: string =
            this.props.game.IsChampionship
                ? "Champion"
                : `${this.props.game.TopTeamName} vs ${this.props.game.BottomTeamName}`;

        const dirty =
            this.props.game.NeedsRepair
                ? (<FontIcon aria-label="Dirty" iconName="branchfork2" className={iconColors.branchColor}></FontIcon>)
                : "";

        return (
            <div className="singleGameItem" style={background}>
                <Stack horizontal gap={0}>
                    <Stack.Item grow={0}>
                        {dirty}
                    </Stack.Item>
                    <Stack.Item grow={0}>
                        <Stack horizontal gap={8}>
                            <Stack.Item align="center" grow={0}>
                                ({this.props.game.GameId.Value})
                            </Stack.Item>
                            <Stack.Item align="center" grow={2}>
                                {gameTitle}
                            </Stack.Item>
                            <Stack.Item align="center" grow={0}>
                                <Stack horizontal horizontalAlign="end">
                                    <Stack.Item grow={0}>
                                        <ActionButton
                                            appContext={this.props.appContext}
                                            tooltip="Insert Game"
                                            tooltipId={`gid-${this.props.game.GameId.Value}`}
                                            bracketGame={this.props.game}
                                            delegate={this.DoInsertGame}
                                            disabled={false}
                                            icon="Add"/>
                                    </Stack.Item>
                                    <Stack.Item grow={0}>
                                        <ActionButton
                                            appContext={this.props.appContext}
                                            tooltip="Remove Game"
                                            tooltipId={`gid-${this.props.game.GameId.Value}`}
                                            bracketGame={this.props.game}
                                            delegate={this.DoRemoveGame.bind(this)}
                                            disabled={false}
                                            icon="Remove"/>
                                    </Stack.Item>
                                </Stack>
                            </Stack.Item>
                        </Stack>
                    </Stack.Item>
                </Stack>
            </div>
        );
    }
}