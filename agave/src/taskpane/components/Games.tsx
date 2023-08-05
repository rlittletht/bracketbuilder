import * as React from "react";
import { IAppContext } from "../../AppContext/AppContext";
import { BracketStructureBuilder } from "../../Brackets/BracketStructureBuilder";
import { BracketDefinition } from "../../Brackets/BracketDefinitions";
import { GameItem } from "./GameItem"
import { Teachable } from "./Teachable";
import { DirectionalHint } from '@fluentui/react';
import { Coachstate } from "../../Coachstate";

// import styles from '../taskpane.css';

export interface GamesProps {
    bracketName: string;
    appContext: IAppContext;
}

export interface GamesState {
}


export class Games extends React.Component<GamesProps, GamesState>
{
    constructor(props, context)
    {
        super(props, context);
        this.state = {
        };
    }

    render()
    {
        let firstUnlinked = true;

        const games = this.props.appContext.getGames();
        const gameItems = [];

        for (let idx = 0; idx < games.length; idx++)
        {
            const game = games[idx];
            const teachable = firstUnlinked && !game.IsLinkedToBracket;
            if (teachable)
                firstUnlinked = false;

            gameItems.push((
                <GameItem idx={idx} teachableAdd=
                    {() => teachable} teachableRemove={() => false}
                    appContext={this.props.appContext} bracketName={this.props.bracketName} game={game} key={idx} linkedToGrid={game.IsLinkedToBracket} />
            ));
        }

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