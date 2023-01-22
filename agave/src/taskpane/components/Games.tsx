import * as React from "react";
import { IAppContext } from "../../AppContext";
import { BracketStructureBuilder } from "../../Brackets/BracketStructureBuilder";
import { BracketDefinition } from "../../Brackets/BracketDefinitions";
import { GameItem } from "./GameItem"

// import styles from '../taskpane.css';

export interface GamesProps {
    bracketName: string;
    appContext: IAppContext;
}

export interface GamesState {
}


export class Games extends React.Component<GamesProps, GamesState>
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
        const games = this.props.appContext.getGames();
        const gameItems = games.map((_item, index) => 
            (
            <GameItem appContext={this.props.appContext} bracketName={this.props.bracketName} game={_item} key={index} linkedToGrid={_item.IsLinkedToBracket}/>
            ));

        return (
            <div className="games">
                <table className="games">
                    <tbody>
                        <tr>
                            <td className="games">
                                {gameItems}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }
}