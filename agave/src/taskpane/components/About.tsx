import * as React from "react";
import * as CSS from "csstype";
import { DialogType, IModalProps, IDialogContentProps, Stack, IStackStyles, IStackItemStyles, Coachmark, DirectionalHint, TeachingBubbleContent, IButtonProps, IContextualMenuProps, Dialog, DialogFooter, PrimaryButton, DefaultButton} from '@fluentui/react';
import { IAppContext, TheAppContext } from "../../AppContext/AppContext";
import { s_staticConfig } from "../../StaticConfig";
import { HelpLink } from "./HelpLink";
import { HelpInfo, HelpTopic } from "../../Coaching/HelpInfo";
import { ProductName } from "./ProductName";

export interface CloseAboutDelegate
{
    (): void;
}

export interface AboutProps
{
    showDialog: boolean;
    closeDelegate: CloseAboutDelegate;
}

export interface AboutState
{
}

export class About extends React.Component<AboutProps, AboutState>
{
    context!: IAppContext;
    static contextType = TheAppContext;

    constructor(props, context)
    {
        super(props, context);

        this.state =
        {
        }
    }

    hideDialog()
    {
        this.props.closeDelegate();
    }

    render()
    {
        const modalProps: IModalProps =
        {
            isBlocking: false,
//            styles: { main: { maxWidth: 450 } },
        };

        const titleLine = (
            <div style={{ verticalAlign: 'middle', height: '1.25rem' }}>
                <img src={require('./../../../assets/TR-logo.png')} height="100%" />
                <span style={{marginBottom: '1.4rem'}}> AboutBracketBuilder</span>
            </div>
            );

        const contentProps: IDialogContentProps =
        {
            type: DialogType.normal,
            title: titleLine,
            
        };

        const styles: CSS.Properties =
        {
            background: '#cccccc',
            textAlign: 'left'
        };

        const helpLink = HelpInfo.BuildHelpLink(HelpTopic.Root);
         
        return (
            <Dialog
                hidden={!this.props.showDialog}
                onDismiss={() => this.hideDialog()}
                dialogContentProps={contentProps}
                minWidth={360}
                modalProps={modalProps} >
                <p>
                   <ProductName isBold isFull/> is part of the traynrex suite of scheduling
                    programs.</p>
                <p>
                    Designed to make your scheduling a little less of a train wreck!
                </p>
                <p>
                    Developed by Thetasoft LLC. Version {s_staticConfig.version }
                </p>
                <p>
                    <HelpLink text="More help on the web" helpLink={helpLink} />
                </p>
                <DialogFooter>
                    <DefaultButton onClick={this.hideDialog.bind(this) } text="OK"/>
                </DialogFooter>
            </Dialog>
        );
    }
}