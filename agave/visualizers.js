function parseCode(dump)
{
    let items = [];
    let ichCur = 0;
    let ps = parseStateCode.LookingForCoords;
    let ichFirst = -1;
    let ichLast = -1;
    let token;

    while (ichCur >= 0 && ichCur < dump.length)
    {
        [ps, ichCur, ichFirst, ichLast, token] = lex(transitionsCode, dump, ichCur, ps);

        if (token && token != null)
        {
            let item =
            {
                gameNumber: parseInt(token.gameNum),
                topLeft: [parseInt(token.coord0), parseInt(token.coord1)],
                bottomRight: [parseInt(token.coord2), parseInt(token.coord3)],
                swapped: token.swapHomeAway && token.swapHomeAway === "true"
            }
            items.push(item);
        }
    }
    return items;
}

function parseDump(dump)
{
    let items = [];
    let ichCur = 0;
    let ps = parseState.LookingForTitleOrGame;
    let ichFirst = -1;
    let ichLast = -1;
    let token;

    while (ichCur >= 0 && ichCur < dump.length)
    {
        [ps, ichCur, ichFirst, ichLast, token] = lex(transitionsDump, dump, ichCur, ps);

        if (token && token != null)
        {
            if (token.Title)
                setPageTitle(token.Title);
            else
            {
                let item =
                {
                    gameNumber: parseInt(token.gameNum),
                    topLeft: [parseInt(token.TopLeftFirstNum), parseInt(token.TopLeftSecondNum)],
                    bottomRight: [parseInt(token.BottomRightFirstNum), parseInt(token.BottomRightSecondNum)],
                    swapped: token.swapHomeAway && token.swapHomeAway === "S",
                    topPriority: token.Priority1,
                    bottomPriority: token.Priority2,
                    gamePriority: token.Priority3
                }
                items.push(item);
            }
        }
    }
    return items;
}

const dxSize = 40;
const dySize = 10;
const gameFontSize = 8;
const nonGameFontSize = 10;

const zoomStep = 1.25;
const minZoom = 0.25;
const maxZoom = 4.0;
let canvasZoom = 1.0;

function updateZoomUi()
{
    document.getElementById("zoomLabel").innerText = Math.round(canvasZoom * 100) + "%";
}

function applyCanvasZoom()
{
    let can = document.getElementById("canViz");
    can.style.width = (can.width * canvasZoom) + "px";
    can.style.height = (can.height * canvasZoom) + "px";
    updateZoomUi();
}

function zoomIn()
{
    canvasZoom = Math.min(maxZoom, canvasZoom * zoomStep);
    applyCanvasZoom();
}

function zoomOut()
{
    canvasZoom = Math.max(minZoom, canvasZoom / zoomStep);
    applyCanvasZoom();
}

function zoom100()
{
    canvasZoom = 1.0;
    applyCanvasZoom();
}

function drawVertLine(ctx, col, maxRow)
{
    ctx.beginPath();
    ctx.moveTo(col * dxSize, 0);
    ctx.lineTo(col * dxSize, (maxRow + 1) * dySize);
    ctx.strokeStyle = "#CCCCCC";
    ctx.stroke();
}

function drawHorizLine(ctx, row, maxCol)
{
    ctx.beginPath();
    ctx.moveTo(0, row * dySize);
    ctx.lineTo((maxCol + 1) * dxSize, row * dySize);
    ctx.strokeStyle = "#CCCCCC";
    ctx.stroke();
}

function drawItem(ctx, item)
{
    ctx.fillStyle = "#000000";
    ctx.fillRect(
        item.topLeft[1] * dxSize,
        item.topLeft[0] * dySize,
        item.bottomRight[1] * dxSize - item.topLeft[1] * dxSize + dxSize,
        item.bottomRight[0] * dySize - item.topLeft[0] * dySize + dySize);

    const text1 = "" + item.topLeft[0] + "," + item.topLeft[1];
    const priTop = item.topPriority ? ("(" + item.topPriority + ")") : "";

    ctx.fillStyle = "#ffffff";
    if (item.gameNumber == -1)
    {
        ctx.font = gameFontSize + "px Arial";
        ctx.fillText(
            text1,
            item.topLeft[1] * dxSize + dxSize / 8,
            item.topLeft[0] * dySize + dySize * 0.8);
    }
    else
    {
        ctx.font = nonGameFontSize + "px Arial";
        ctx.fillText(
            text1 + priTop,
            item.topLeft[1] * dxSize + dxSize / 8,
            item.topLeft[0] * dySize + dySize * 1.5);
    }

    if (item.gameNumber != -1)
    {
        const priBottom = item.bottomPriority ? ("(" + item.bottomPriority + ")") : "";
        const priGame = item.gamePriority ? ("(" + item.gamePriority + ")") : "";

        const text2 = priBottom + item.bottomRight[0] + "," + item.bottomRight[1];
        ctx.fillText(
            text2,
            priGame == "" ? item.bottomRight[1] * dxSize - dxSize / 8 : item.bottomRight[1] * dxSize - dxSize/4,
            item.bottomRight[0] * dySize);

        const game = "" + item.gameNumber + ((item.swapped && item.swapped == true) ? " (S)" : "") + priGame;
        ctx.fillText(
            game,
            (item.topLeft[1] + (item.bottomRight[1] - item.topLeft[1]) / 2) * dxSize + dxSize / 4,
            (item.topLeft[0] + (item.bottomRight[0] - item.topLeft[0]) / 2) * dySize + dySize);
    }
}

function visualize()
{
    let dump = document.getElementById("textGridData").value;
    let items = parseDump(dump);

    visualizeCore(items);
}


function convertToCode()
{
    let dump = document.getElementById("textGridData").value;
    let items = parseDump(dump);

    if (items.length == 0)
        return;

    var sCode = "";

    for (const iItem in items)
    {
        const item = items[iItem];

        sCode += "grid.addGameRangeByIdValue(RangeInfo.createFromCornersCoord("
            + item.topLeft[0]
            + ", "
            + item.topLeft[1]
            + ", "
            + item.bottomRight[0]
            + ", "
            + item.bottomRight[1]
            + ", "
            + "), "
            + item.gameNumber
            + ", "
            + (item.swapped ? "true" : "false")
            + ").inferGameInternalsWithCache(bracketName);\n";
    }

    document.getElementById("textGridCode").value = sCode;
}

function visualizeCode()
{
    let dump = document.getElementById("textGridCode").value;
    let items = parseCode(dump);

    visualizeCore(items);
}

function visualizeCore(items)
{
    // "1: [9,6]-[19,8]  Grid.ts:1342 2: [23,6]-[33,8]  Grid.ts:1342 -1: [28,9]-[28,11]");

    if (items.length == 0)
        return;

    let minRow = items[0].topLeft[0];
    let maxRow = items[0].bottomRight[0];
    let minCol = items[0].topLeft[1];
    let maxCol = items[0].bottomRight[1];

    // figure out the extents of the grid
    for (const iItem in items)
    {
        const item = items[iItem];

        minRow = Math.min(minRow, item.topLeft[0]);
        maxRow = Math.max(maxRow, item.bottomRight[0]);
        minCol = Math.min(minCol, item.topLeft[1]);
        maxCol = Math.max(maxCol, item.bottomRight[1]);
    }

    // draw a grid on the canvas
    let x = 0;
    let y = 0;

    let can = document.getElementById("canViz");
    can.width = can.width;
    var ctx = can.getContext("2d");

    ctx.clearRect(0, 0, can.width, can.height);

    // draw the vertical lines
    while (x <= maxCol)
    {
        drawVertLine(ctx, x, maxRow);
        x++;
    }
    while (y <= maxRow)
    {
        drawHorizLine(ctx, y, maxCol);
        y++;
    }

    // and now draw each item
    for (const iItem in items)
    {
        const item = items[iItem];

        drawItem(ctx, item);
    }
}

function doTest()
{
    var batches = [];

    var batch = document.getElementById("textBatch").value
    var parts = batch.replace(
        /([^\|]+)\|([^\|]+)\|/gi,
        function(m, title, batchPart)
        {
            batches.push([title, batchPart]);
        });

    alert("Parts: " + batches.length);

    for (var logString of batches)
    {
        var url = window.location.href.replace(/\?.*/, "");

        window.open(url + "?title=" + logString[0] + "&log=" + logString[1]);
    }
    //                window.open(window.location.href);
}

function getUrlVars()
{
    var vars = {};
    var parts = window.location.href.replace(
        /[?&]+([^=&]+)=([^&]*)/gi,
        function(m, key, value)
        {
            vars[key] = value;
        });
    return vars;
}

function setPageTitle(title)
{
    var normalizedTitle = title ? title.trim() : "";

    document.title = normalizedTitle || "bbld debug";
    document.getElementById("canvasTitle").innerText = normalizedTitle;
    document.getElementById("textPageTitle").value = normalizedTitle;
}

function setPageTitleFromInput()
{
    setPageTitle(document.getElementById("textPageTitle").value);
}