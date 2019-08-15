var savingSystem;
var lastMouseEvent;

function canvasMouseHandler(event)
{
	if (savingSystem && savingSystem.loadingEnded)
	{
		lastMouseEvent = event;
		panes.mouseHandler(event);
	}
}

function canvasKeyHandler(event)
{
	panes.keyHandler(event);
}

document.addEventListener("mousemove", canvasMouseHandler);
document.addEventListener("mousedown", canvasMouseHandler);
document.addEventListener("mouseup", canvasMouseHandler);
document.addEventListener("click", canvasMouseHandler);
document.addEventListener("dblclick", canvasMouseHandler);
document.addEventListener("keydown", canvasKeyHandler);

var canvas = document.getElementById("canvasMain");
var ctxActive = canvas.getContext("2d");

function resizeCanvas()
{
	if (mainPane.centerX)
	{
		mainPane.centerX -= Math.trunc(canvas.width / 2);
		mainPane.centerY -= Math.trunc(canvas.height / 2) - 100;
	}

	canvas.width = document.body.clientWidth - 20;
	canvas.height = document.body.clientHeight - 20;

	path = new Path2D();
	path.rect(0, 0, canvas.width, canvas.height - 100);
	mainPane.boundaryPath = path;

	path = new Path2D();
	path.rect(0, 0, canvas.width, canvas.height);
	panes.mainBoundary = path;

	if (mainPane.centerX)
	{
		mainPane.centerX += Math.trunc(canvas.width / 2);
		mainPane.centerY += Math.trunc(canvas.height / 2) - 100;
	}
	else
	{
		mainPane.centerX = Math.trunc(canvas.width / 2);
		mainPane.centerY = Math.trunc(canvas.height / 2) - 100;
	}

	var path = new Path2D();
	path.rect(0, 0, canvas.width, 99);
	trackerPane.boundaryPath = path;
	trackerPane.resize();
}
var borderGlow = {
	precolors:
	{
		purple: "rgba(255,55,205,",
		blue: "rgba(5,55,255,",
		yellow: "rgba(255,255,0,",
		cyan: "rgba(0,255,255,",
	},
	colors:
	{
		darkfill: "#101010",
		brightfill: "686868"
	},
	radius: 4,
	ticks: 0,
	alpha: 1,
	cycleTime: 240,
	prepareColor: function (color, alpha)
	{
		return this.precolors[color] + alpha + ")";
	},
	preparationTick: function ()
	{
		var tempGlowCycleTime = this.ticks++ % (this.cycleTime + 1) / this.cycleTime;
		tempGlowCycleTime *= Math.PI * 2;
		tempGlowCycleTime = (Math.sin(tempGlowCycleTime) + 1) / 2;
		tempGlowCycleTime = tempGlowCycleTime * 0.98 + 0.02;
		this.alpha = tempGlowCycleTime / 2;
		this.solidalpha = 1;
		for (var col in this.precolors)
		{
			if (col == "purple")
			{
				this.colors[col] = this.prepareColor(col, 0.5 + 0.5 * tempGlowCycleTime);
			}
			else
			{
				this.colors[col] = this.prepareColor(col, tempGlowCycleTime);
			}
			this.colors["solid" + col] = this.prepareColor(col, 1);
		}
	},
};

function draw()
{
	borderGlow.preparationTick();
	ctxActive.restore();
	ctxActive.save();
	ctxActive.clearRect(0, 0, canvas.width, canvas.height);
	ctxActive.font = "14px Arial";
	ctxActive.textBaseline = "middle";
	ctxActive.textAlign = "center";
	ctxActive.strokeStyle = "#DDDDDD";
	ctxActive.lineWidth = 2;
	ctxActive.fillStyle = "#101010";

	for (var i = panes.list.length - 1; i >= 0; i--)
	{
		panes.list[i].draw(ctxActive);
	}
}

function drawNumber(ctx, num, x, y, mode = "", align = "left", prefix = "", suffix = "")
{
	ctx.save();
	ctx.textAlign = align;
	if (num < 0)
	{
		num *= -1;
		prefix += "-";
	}
	if (num > 1e6 && mode != "exp")
	{
		mode = "exp";
	}
	if ((num == 0 || num >= 0.001 & num < 1000) && mode == "exp")
	{
		mode = "fixed";
	}
	if (mode == "exp")
	{
		var e = 0;
		while (num >= 10)
		{
			e++;
			num /= 10;
		}
		while (num < 1)
		{
			e--;
			num *= 10;
		}
		ctx.fillText(prefix + (Math.trunc(num * 100) / 100).toFixed(2) + "e" + e + suffix, x, y);
	}
	else if (mode == "fixed")
	{
		ctx.fillText(prefix + (Math.trunc(num * 1000) / 1000).toFixed(3).slice(0, 5) + suffix, x, y);
	}
	else
	{
		ctx.fillText(prefix + Math.trunc(num) + suffix, x, y);
	}

	ctx.restore();
}


function drawMachine(ctx, machine) {
    try {
        ctx.save();
        if (images[machine.id]) {
            ctx.drawImage(images[machine.id], -32, -32);
        }

        var amount, radius, angle, strokeStyle, fillStyle, steps, amt, maxStep, step, possibleAmount, el, element, amountCap
          , commonDivisor = 1.2;

        const outlineWidth = 1
          , scratchWidth = 0.5
          , dirUP = -Math.PI / 2
          , dirUP2 = 3 * Math.PI / 2
          , minRadius = 8 / 2
          , maxRadius = 16
          , nop = -1;

        if (machine.displayElement == 'Clay') {
            amt++;
        }

        if (machine.displayElement) {
            ctx.strokeStyle = strokeStyle = elementalColors[machine.displayElement][0];
            ctx.fillStyle = fillStyle = elementalColors[machine.displayElement][3];
            element = data.oElements[machine.displayElement];
            element.reachedAmount = Math.max(element.reachedAmount || 0, element.amount);
			possibleAmount = element.possibleAmount;
			commonDivisor = (Math.abs((possibleAmount * 30 / 1.2) % 1) < 0.001) ? 1.2 : 1;

            amount = element.amount / commonDivisor;
            amountCap = element.reachedAmount / commonDivisor;

            step = 0;
            maxStep = 1;

            for (amt = amount; amt > 1.03; amt /= 10) {
                step++;
            }
            amt = step ? Math.max(0, (amt - 0.1) * 10 / 9) : amt;
            if (amt > 1)
                amt = 1;
            for (let pamt = amountCap; pamt > 1.03; pamt /= 10) {
                maxStep++;
            }

            amt = amt

            drawScratches();

            drawPieInner();

            if (machine.displayArray && machine.displayArray.length == 4) {
                drawQuadOuter();
            } else {
                drawPieOuter();
            }

        }

        function stepRadius(step, maxs=maxStep) {
            // 0 - center, 
            if (!step)
                return 0;
            if (maxStep < 2 || step == maxs)
                return maxRadius;

            let pw = 0.8;
            let ajMaxStep = maxs < 4 ? maxs : maxs - (maxs - 4) / 2;
            let l = (maxRadius - minRadius) * (1 - pw) / (1 - pw ** ajMaxStep);
            return maxRadius - l * (1 - pw ** (maxStep - step)) / (1 - pw);

            // return minRadius + (maxRadius - minRadius) * (step - 1) / (maxStep - 1);
            // TODO
        }

        function drawScratches(minStep=1) {
            ctx.lineWidth = scratchWidth;
            for (let i = minStep; i <= maxStep; i++) {
                let radius = stepRadius(i, maxStep) + outlineWidth / 2;
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        function drawPieInner() {
            // step: 0 (0~1)
            if (amt < 0.001)
                return;
            ctx.lineWidth = outlineWidth * 2;

            let angle = amt * 2 * Math.PI;
            let radius = stepRadius(step + 1);
            ctx.beginPath();
            ctx.arc(0, 0, radius, dirUP, dirUP + angle);
            if (step == 0) {
                // ctx.lineTo(0, 0);
                // to prevent huge triangle
                ctx.arc(0, 0, 0.1, dirUP + angle, dirUP2);
            } else {
                ctx.arc(0, 0, stepRadius(step), dirUP + angle, dirUP2);
            }

            ctx.closePath();

            ctx.stroke();
            ctx.fill();
        }

        function drawPieOuter() {
            ctx.lineWidth = outlineWidth * 2;

            let amt = Math.min(1, amount / amountCap);
            let angle = amt * 2 * Math.PI;
            ctx.beginPath();
            ctx.arc(0, 0, 32, dirUP, dirUP + angle);
            ctx.arc(0, 0, 28, dirUP + angle, dirUP, true);
            ctx.closePath();
            ctx.stroke();
            ctx.fill();

        }

        function drawQuadOuter() {
            let amts = machine.displayArray.map(e=>data.oElements[e].amount / data.oElements[e].possibleAmount);
            let colors = machine.displayArray.map(e=>elementalColors[e][0]);
            let bcolors = machine.displayArray.map(e=>elementalColors[e][3]);

            ctx.lineWidth = outlineWidth * 2;

            for (let i = 0; i < 4; i++) {
                let dir = Math.PI * (i - 1) / 2;
                let angle = Math.PI * Math.min(1, Math.max(0, amts[i])) / 2 + 0.001; 
                ctx.strokeStyle = colors[i];
                ctx.fillStyle = bcolors[i];
                ctx.beginPath();
                ctx.arc(0, 0, 32, dir, dir + angle);
                ctx.arc(0, 0, 28, dir + angle, dir, true);
                ctx.closePath();
                ctx.stroke();
                ctx.fill();
            }
        }

        if (machine.displayElement) {
            // 				var angle = -Math.PI / 2 + Math.PI * 2 * Math.max(0, amount - 0.1) * 10 / 9;

            // 				if (machine.displayStep >= 1)
            // 				{
            // 					for (var rad2 = Math.min(radius + machine.displayStep * Math.trunc(Math.max(3, 10 / machine.displayStep)), 16); rad2 > radius; rad2 -= machine.displayStep)
            // 					{
            if (machine.displayArrayCD-- <= 0) {
                machine.displayArrayCD = machine.displayArrayCDMax;
                machine.displayArrayCurrent = (machine.displayArrayCurrent + 1) % machine.displayArray.length;
                machine.displayElement = machine.displayArray[machine.displayArrayCurrent];
            }
        }

        if (machine.paused) {
            ctx.drawImage(images.iconPauseTransparent, -optionData.iconSize / 2, 26 - optionData.iconSize / 2);
        } else {
            var num = 0;
            for (var i = 0; i < machine.recipes.length; i++) {
                if (machine.recipes[i].unlocked && !machine.recipes[i].enabled) {
                    num++;
                }
            }
            if (num > 0) {
                ctx.drawImage(images.iconOffTransparent, -optionData.iconSize / 2, 26 - optionData.iconSize / 2);
                //ctx.fillText(num, 0, 26);
            }
        }

        ctx.restore();

    } catch (e) {
        debugger ;
    }
}
