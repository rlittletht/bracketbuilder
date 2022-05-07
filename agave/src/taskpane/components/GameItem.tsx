import * as React from "react";
import { IAppContext } from "../../AppContext";
import { ComboBox, IComboBoxOption, IComboBox, IComboBoxStyles } from '@fluentui/react';
import { BracketOption } from "../../Brackets/BracketStructureBuilder";
import { BracketGame, IBracketGame } from "../../BracketEditor/BracketGame";
import { Stack } from "@fluentui/react";
import InsertButton from "./InsertButton";
import ActionButton from "./ActionButton";
import { StructureEditor } from "../../BracketEditor/StructureEditor";

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


export default class GameItem extends React.Component<GameItemProps, GameItemState>
{
    constructor(props, context) {
        super(props, context);
    }

    async DoInsertGame(appContext: IAppContext, bracketGame: IBracketGame): Promise<boolean>
    {
        await StructureEditor.insertGameAtSelectionClick(appContext, bracketGame);
        return true; // we don't get an error back...
    }

    async DoRemoveGame(appContext: IAppContext, bracketGame: IBracketGame): Promise<boolean>
    {
        await StructureEditor.findAndRemoveGameClick(appContext, bracketGame);
        return true; // we don't get an error back...
    }

    render() {

//        this.props.bracketOptions.forEach(
//            (value: BracketOption) => {
//                options.push({ key: value.key, text: value.name });
//            });
        let background = {};
        if (this.props.linkedToGrid)
            background = { background: "#cccccc" };

        const gameTitle: string =
            this.props.game.IsChampionship
                ? "Championship"
                : `${this.props.game.TopTeamName} vs ${this.props.game.BottomTeamName}`;

        return (
            <div className="singleGameItem" style={background}>
                <Stack horizontal gap={8}>
                    <Stack.Item align="center" grow={0}>
                        ({this.props.game.GameNum})
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
                                    tooltipId={`gid-${this.props.game.GameNum}`}
                                    bracketGame={this.props.game}
                                    delegate={this.DoInsertGame}
                                    icon="Add"/>
                            </Stack.Item>
                            <Stack.Item grow={0}>
                                <ActionButton
                                    appContext={this.props.appContext}
                                    tooltip="Remove Game"
                                    tooltipId={`gid-${this.props.game.GameNum}`}
                                    bracketGame={this.props.game}
                                    delegate={this.DoRemoveGame.bind(this)}
                                    icon="Remove"/>
                            </Stack.Item>
                        </Stack>
                    </Stack.Item>
                </Stack>
            </div>
        );
    }
}