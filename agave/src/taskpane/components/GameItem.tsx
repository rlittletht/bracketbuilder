import * as React from "react";
import { IAppContext } from "../../AppContext";
import { ComboBox, IComboBoxOption, IComboBox, IComboBoxStyles } from '@fluentui/react';
import { BracketOption } from "../../Brackets/BracketStructureBuilder";
import { BracketGame, IBracketGame } from "../../BracketEditor/BracketGame";
import { Stack } from "@fluentui/react";
import InsertButton from "./InsertButton";

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
                                <InsertButton appContext={this.props.appContext} bracketGame={this.state.bracketGame}/>
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