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
    gameNum: number;
    bracketName: string;
    appContext: IAppContext;
}

export interface GameItemState
{
    bracketGame: IBracketGame;
}


export default class GameItem extends React.Component<GameItemProps, GameItemState>
{
    constructor(props, context) {
        super(props, context);

        let temp: BracketGame = new BracketGame();
        temp.Load(null, props.bracketName, props.gameNum);
        this.state = {
            bracketGame: temp
        };
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

        return (
            <div className="singleGameItem">
                <Stack>
                    <Stack.Item>
                        <Stack horizontal>
                            <Stack.Item grow align="center">
                                Game {this.state.bracketGame.GameNum}
                            </Stack.Item>
                            <Stack.Item grow={0}>
                                <ActionButton
                                    appContext={this.props.appContext}
                                    tooltip="Insert Game"
                                    tooltipId={`gid-${this.state.bracketGame.GameNum}`}
                                    bracketGame={this.state.bracketGame}
                                    delegate={this.DoInsertGame}
                                    icon="Add"/>
                                <ActionButton
                                    appContext={this.props.appContext}
                                    tooltip="Remove Game"
                                    tooltipId={`gid-${this.state.bracketGame.GameNum}`}
                                    bracketGame={this.state.bracketGame}
                                    delegate={this.DoRemoveGame.bind(this)}
                                    icon="Remove"/>
                            </Stack.Item>
                        </Stack>
                    </Stack.Item>
                    <Stack.Item>
                        {this.state.bracketGame.TopTeamName} vs {this.state.bracketGame.BottomTeamName} ({this.state.bracketGame.Field} {this.state.bracketGame.FormatTime()}) <br />
                    </Stack.Item>
                </Stack>
            </div>
        );
    }
}