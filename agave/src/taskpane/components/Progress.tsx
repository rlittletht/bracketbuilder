import { classNamesFunction, IStyle, Overlay, Spinner, SpinnerSize } from "@fluentui/react";
import * as React from "react";
import { IAppContext, TheAppContext } from "../../AppContext/AppContext";

export interface ProgressProps
{
    logo: string;
    message: string;
    title: string;
    initialVisibility: boolean;
}

export interface ProgressState
{
    visible: boolean;
}

interface IOverlayStyle
{
    root: IStyle;
}

export class Progress extends React.Component<ProgressProps, ProgressState>
{
    context!: IAppContext;
    static contextType = TheAppContext;

    constructor(props, context)
    {
        super(props, context);

        this.state =
        {
            visible: props.initialVisibility
        }

        this.context.setProgressVisibilityDelegate(this.setVisibility.bind(this));
    }

    setVisibility(newVisible: boolean)
    {
        this.setState({ visible: newVisible });
    }

    render()
    {
        const overlayDivStyle: IOverlayStyle =
        {
            root:
            [
                'overlayStyle',
                {
                    top: '60px',
                    left: '0',
                    padding: '10px',
                    position: 'absolute',
                    right: '0'
                }
                ]
        };
        const getClassNames = classNamesFunction<{}, IOverlayStyle>();
        const classNames = getClassNames(overlayDivStyle, {});

        const { logo, message, title } = this.props;
        const maybeH1 =
            title != null && title.length > 0
                ? (<h1 className="ms-fontSize-su ms-fontWeight-light ms-fontColor-neutralPrimary">{title}</h1>)
                : "";
        const maybeLogo =
            logo != null
                ? (<img width="90" height="90" src={logo} alt={title} title={title}/>): "";

        const useOverlay = true;

        const whichType = useOverlay
            ? (
                <Overlay hidden={!this.state.visible}>
                    <div className={classNames.root}>
                        <section hidden={!this.state.visible} className="ms-welcome__progress ms-u-fadeIn500">
                            {maybeLogo}
                            {maybeH1}
                            <Spinner size={SpinnerSize.large} label={message} labelPosition="right"/>
                        </section>
                    </div>
                </Overlay>
                )
            : (<section hidden={!this.state.visible} className="ms-welcome__progress ms-u-fadeIn500">
                {maybeLogo}
                {maybeH1}
                <Spinner size={SpinnerSize.large} label={message}/>
            </section>
            );

        return whichType;
    }
}