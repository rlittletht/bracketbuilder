import * as React from "react";
import { IAppContext } from "../../AppContext";
import { ComboBox, IComboBoxOption, IComboBox, IComboBoxStyles } from '@fluentui/react';
import { BracketOption, BracketStructureBuilder } from "../../Brackets/BracketStructureBuilder";
import { BracketGame, IBracketGame } from "../../BracketEditor/BracketGame";
import { GameItemProps, GameItemState } from "./GameItem"
import GameItem from "./GameItem"
import { BracketDefinition } from "../../Brackets/BracketDefinitions";

export interface GamesProps {
    bracketName: string;
}

export interface GamesState {
}


export default class Games extends React.Component<GamesProps, GamesState>
{
    constructor(props, context) {
        super(props, context);
        this.state = {
        };
    }

    render() {

        //        this.props.bracketOptions.forEach(
        //            (value: BracketOption) => {
        //                options.push({ key: value.key, text: value.name });
        //            });
        let bracket: BracketDefinition = BracketStructureBuilder.getBracketDefinition(`${this.props.bracketName}Bracket`);

        const games = bracket.games.map((_item, index) =>
            (
            <GameItem bracketName={this.props.bracketName} gameNum={index}/>
            ));

        return (
            <div className="games">
                <table className="games">
                    <tr>
                        <td className="games">
                            {games}
                        </td>
                    </tr>
                </table>
            </div>
        );
    }
}