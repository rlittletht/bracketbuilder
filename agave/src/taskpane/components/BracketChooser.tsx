import * as React from "react";
import { IAppContext } from "../../AppContext";
import { ComboBox, IComboBoxOption, IComboBox, IComboBoxStyles } from '@fluentui/react';
import { BracketOption } from "../../Brackets/BracketStructureBuilder";

export interface BracketChooserProps
{
    bracketOptions: BracketOption[],
    updateBracketChoiceDelegate: UpdateBracketChoiceDelegate
}

export interface BracketChooserState
{
    selectedBracket: string;
}

export interface UpdateBracketChoiceDelegate
{
    (selectedBracket: string): void;
}

export default class BracketChooser extends React.Component<BracketChooserProps, BracketChooserState>
{
    constructor(props, context)
    {
        super(props, context);
        this.state = {
            selectedBracket: null
        };
    }

    /*----------------------------------------------------------------------------
        %%Function: BracketChooser.updateSelectedBracket

        when the users selection changes the bracket, change our state (which
        means doing a little massaging of the form so we always have a "T##"
        form)
    ----------------------------------------------------------------------------*/
    updateSelectedBracket(
        _event: React.FormEvent<IComboBox>,
        option?: IComboBoxOption,
        _index?: number,
        value?: string)
    {
        let selectedBracket: string;

        if (option)
        {
            selectedBracket = `${option.key}`;
        }
        else
        {
            // try to infer the bracket from the entered text

            if (!value)
                return;

            let start: number = 0;

            if (value.toLowerCase().startsWith("t"))
                start = 1;

            selectedBracket = `T${parseInt(value.substring(start))}`;
        }

        this.setState({
            selectedBracket: selectedBracket,
        });

        this.props.updateBracketChoiceDelegate(selectedBracket);
    }

    render()
    {
        const options: IComboBoxOption[] = [];
        const comboBoxStyles: Partial<IComboBoxStyles> = { root: { maxWidth: 100 } };

        this.props.bracketOptions.forEach(
            (value: BracketOption) =>
            {
                options.push({ key: value.key, text: value.name });
            });

        return (
            <div>
                <ComboBox
                    label="Size of Bracket"
                    allowFreeform={true}
                    onChange={this.updateSelectedBracket.bind(this)}
                    styles={comboBoxStyles}
                    options={options}
                />
            </div>
        );
    }
}