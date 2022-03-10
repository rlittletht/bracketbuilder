import * as React from "react";
import { IAppContext } from "../../AppContext";
import { ComboBox, IComboBoxOption, IComboBox, IComboBoxStyles } from '@fluentui/react';
import { BracketOption } from "../../Brackets/BracketStructureBuilder";
import { BracketGame, IBracketGame } from "../../BracketEditor/BracketGame";

export interface GameItemProps
{
    gameNum: number;
    bracketName: string;
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
                Game {this.state.bracketGame.GameNum + 1} <br/>
                {this.state.bracketGame.TopTeamName} v. {this.state.bracketGame.BottomTeamName} ({this.state.bracketGame.Field} {this.state.bracketGame.FormatTime()}) <br />
            </div>
        );
    }
}