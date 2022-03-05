import * as React from "react";
import { IAppContext } from "../../AppContext";

export interface HeroListItem
{
    icon: string;
    primaryText: string;
    cursor: string;
    delegate: (appContext: IAppContext) => Promise<boolean>;
}

export interface HeroListProps
{
    message: string;
    items: HeroListItem[];
    appContext: IAppContext;
}

export default class HeroList extends React.Component<HeroListProps>
{
    render()
    {
        const { children, items, message } = this.props;
        const listItems = items.map((item, index) => (
            <li className={`ms-ListItem ${item.cursor}`} key={index} onClick={() =>
                {
                    item.delegate(this.props.appContext)
                }}>
                <i className={`ms-Icon ms-Icon--${item.icon}`}></i>
                <span className="ms-font-m ms-fontColor-neutralPrimary">{item.primaryText}</span>
            </li>
        ));
        return (
            <main className="ms-welcome__main">
                <h2 className="ms-font-xl ms-fontWeight-semilight ms-fontColor-neutralPrimary ms-u-slideUpIn20">{
                    message}</h2>
                <ul className="ms-List ms-welcome__features ms-u-slideUpIn10">{listItems}</ul>
                {children}
            </main>
        );
    }
}