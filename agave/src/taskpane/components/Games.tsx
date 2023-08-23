import * as React from "react";
import { IAppContext, TheAppContext } from "../../AppContext/AppContext";
import { GameItem } from "./GameItem";

// import styles from '../taskpane.css';

export interface GamesProps {
    bracketName: string;
}

export interface GamesState {
}


export class Games extends React.Component<GamesProps, GamesState>
{
    context!: IAppContext;
    static contextType = TheAppContext;

    constructor(props, context)
    {
        super(props, context);
        this.state = {
        };
    }

    render()
    {
        let firstUnlinked = true;

        const games = this.context.getGames();
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
                    bracketName={this.props.bracketName} game={game} key={idx} linkedToGrid={game.IsLinkedToBracket} />
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