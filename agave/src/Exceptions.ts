import { HelpInfo } from "./HelpInfo";

export class TrError extends Error
{
    _HelpInfo?: HelpInfo;
    _Messages: string[];

    constructor(messages: string[], helpInfo?: HelpInfo)
    {
        super(messages[0]);

        Object.setPrototypeOf(this, new.target.prototype);

        this._Messages = messages;
        this._HelpInfo = helpInfo;
    }

    static linesFromError(error): string[]
    {
        if (error.stack)
            return [
                "Something has gone very wrong.",
                "Its not your fault, its mine.",
                "It would be great if you would report this problem to me via email at red@traynrex.com.",
                "Copy and paste all of the details below.",
                "THANK YOU!",
                "Details:",
                `Exception caught: ${error.message}`,
                ...error.stack.split("\n")
            ];
        else
            return [
                "Something has gone very wrong.",
                "Its not your fault, its mine.",
                "It would be great if you would report this problem to me via email at red@traynrex.com.",
                "Copy and paste all of the details below.",
                "THANK YOU!",
                "Details:",
                `Exception caught: ${error.message}`,
                "BAD DEVELOPER, no stack trace!"
            ];
    }
}