import * as React from "react";

import { ComboBox, IComboBox, IComboBoxOption, IComboBoxStyles, IStackItemStyles, Stack } from '@fluentui/react';
import { BracketOption } from "../../Brackets/BracketDefBuilder";

export interface BracketChooserProps
{
    alignment: any,
    initialBracket: string,
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

export class BracketChooser extends React.Component<BracketChooserProps, BracketChooserState>
{
    constructor(props, context)
    {
        super(props, context);
        this.state = {
            selectedBracket: props.initialBracket
        };
    }

    setSelectedBracket(selectedBracket: string)
    {
        this.setState(
            {
                selectedBracket: selectedBracket,
            });

        this.props.updateBracketChoiceDelegate(selectedBracket);
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

        this.setSelectedBracket(selectedBracket);
    }

    render()
    {
        const options: IComboBoxOption[] = [];
        const comboBoxStyles: Partial<IComboBoxStyles> =
        {
            root: {
                display: "flex",
                maxWidth: 150,
                paddingRight: 0,
//                alignItems: "right",
//                textAlign: "right",
                justifyContent: "end"
            }
        };

        this.props.bracketOptions.forEach(
            (value: BracketOption) =>
            {
                options.push({ key: value.key, text: value.name });
            });

        const stackStyles: IStackItemStyles = {
            root: {
                alignItems: 'baseline',
                display: 'flex',
                overflow: 'hidden',
            },
        };

        return (
            <div style={{ textAlign: this.props.alignment, display: "flex", justifyContent: "center" }}>
                <Stack horizontal tokens={{ childrenGap: 10 }} styles={stackStyles}>
                    <Stack.Item>Bracket:</Stack.Item>
                    <Stack.Item>
                        <ComboBox
                            label=""
                            defaultSelectedKey={this.state.selectedBracket}
                            onChange={this.updateSelectedBracket.bind(this)}
                            styles={comboBoxStyles}
                            options={options}
                        />
                    </Stack.Item>
                </Stack>
            </div>
        );
    }
}