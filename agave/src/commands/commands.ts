/*
 * Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
 * See LICENSE in the project root for license information.
 */

/* global global, Office, self, window */

Office.onReady(() =>
{
    // If needed, Office.js is ready to be called
});

/**
 * Shows a notification when the add-in command is executed.
 * @param event
 */
function action(event: Office.AddinCommands.Event)
{
    debugger;

    const message: Office.NotificationMessageDetails = {
        type: Office.MailboxEnums.ItemNotificationMessageType.InformationalMessage,
        message: "Performed action.",
        icon: "Icon.80x80",
        persistent: true,
    };

    console.log("Got in actions");

    // Show a notification message
    Office.context.mailbox.item.notificationMessages.replaceAsync("action", message);

    // Be sure to indicate when the add-in command function is complete
    event.completed();
}

async function SetupWorkbook(event: Office.AddinCommands.Event)
{
    Office.context.document.setSelectedDataAsync(
        "ExecuteFunction works. Button ID=" + event.source.id,
        function(asyncResult)
            {
                var error = asyncResult.error;
                if (asyncResult.status === Office.AsyncResultStatus.Failed)
                {
                    // Show error message.
                }
                else
                {
                    // Show success message.
                }
            });
    try
    {
        console.log("testing");
        await Excel.run(async (context) =>
        {
            /**
             * Insert your Excel code here
             */
            const range = context.workbook.getSelectedRange();

            // Read the range address
            range.load("address");

            // Update the fill color
            range.format.fill.color = "blue";

            await context.sync();
            console.log(`The range address was ${range.address}.`);
        });
    }
    catch (error)
    {
        console.error(error);
    }

    action(event);
    console.log("Got in setup");
    event.completed();
}

function getGlobal()
{
    return typeof self !== "undefined"
               ? self
               : typeof window !== "undefined"
                 ? window
                 : typeof global !== "undefined"
                   ? global
                   : undefined;
}

const g = getGlobal() as any;

// The add-in command functions need to be available in global scope
g.action = action;
g.SetupWorkbook = SetupWorkbook;