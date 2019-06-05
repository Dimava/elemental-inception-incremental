var loopId = null;
var gameVersion = 44;
var elapsed = 0;
var formattedElapsed = 0;
savingSystem = {
	migrationMessage: "",
	reccurentPaneSave: function (pane)
	{
		var returnData = {
			pinned: pane.pinned,
			subPanes:
			{},
		};
		for (var i = 0; i < pane.subRegions.length; i++)
		{
			if (pane.subRegions[i] == regionData.dragRegion)
			{
				returnData.x = pane.x;
				returnData.y = pane.y;
			}
		}
		if (pane.centerX)
		{
			returnData.centerX = pane.centerX;
			returnData.centerY = pane.centerY;
		}
		if (pane.boundaryPathMax)
		{
			returnData.minimized = true;
			regionData.maxRegion.action(pane);
		}
		else
		{
			returnData.minimized = false;
		}
		if (pane.boundaryPath)
		{
			returnData.visible = true;
		}
		if (pane.hiddenPath)
		{
			returnData.hidden = true;
		}
		for (var i = 0; i < pane.subPanes.length; i++)
		{
			if (pane.subPanes[i].id)
			{
				returnData.subPanes[pane.subPanes[i].id] = this.reccurentPaneSave(pane.subPanes[i]);
			}
		}
		if (returnData.minimized)
		{
			regionData.minRegion.action(pane);
		}
		return returnData;
	},
	saveData: function ()
	{
		var dataToSave = [gameVersion];
		var numi = 0;
		for (var i = 0; i < data.aElements.length; i++)
		{
			if (data.aElements[i].amount > 0 || data.aElements[i].type == "Time")
			{
				numi = i + 1;
			}
		}
		for (var i = 0; i < numi; i++)
		{
			dataToSave.push(Math.trunc(Math.max(0, data.aElements[i].amount) * 1000) / 1000);
			if (data.aElements[i].type == "Time")
			{
				dataToSave.push(-Date.now());
			}
			else
			{
				dataToSave.push(-1 - Math.trunc(data.aElements[i].possibleAmount * 1000) / 1000);
			}
		}
		numi = 0;
		for (var i = 0; i < machines.dataTranslator.length; i++)
		{
			var machine = machineData[machines.dataTranslator[i]];
			if (machine.upped)
			{
				numi = i + 1;
			}
		}
		for (var i = 0; i < numi; i++)
		{
			var machine = machineData[machines.dataTranslator[i]];
			if (machine.upped)
			{
				var temp = [];
				for (var j = 0; j < machine.recipes.length; j++)
				{
					var recipeData = machine.recipes[j].upData.slice();
					recipeData[0] *= 3;
					if (machine.recipes[j].activated)
					{
						recipeData[0] += 0.5;
					}
					if (machine.recipes[j].enabled)
					{
						recipeData[0]++;
						if (machine.paused)
						{
							recipeData[0]++;
						}
					}
					for (var k = 1; k < recipeData.length; k++)
					{
						recipeData[k]--;
					}
					while (recipeData.length > 0 && recipeData[recipeData.length - 1] == 0)
					{
						recipeData.length--;
					}
					temp.push(recipeData);
				}
				while (temp.length > 0 && temp[temp.length - 1].length == 0)
				{
					temp.length--;
				}
				dataToSave.push(temp);
			}
			else
			{
				dataToSave.push([]);
			}
		}
		localStorage.setItem("saveData", JSON.stringify(dataToSave));

		var localDataToSave = {
			pP: this.reccurentPaneSave(mainPane),
			oD: optionData,
		};
		localStorage.setItem("localSaveData", JSON.stringify(localDataToSave));

		return dataToSave;
	},
	reccurentPaneLoad: function (data, pane)
	{
		if (data.x)
		{
			pane.x = data.x;
		}
		if (data.y)
		{
			pane.y = data.y;
		}
		if (data.centerX)
		{
			pane.centerX = data.centerX;
			pane.centerY = data.centerY;
		}
		for (var i = 0; i < pane.subPanes.length; i++)
		{
			if (pane.subPanes[i].id && data.subPanes[pane.subPanes[i].id])
			{
				this.reccurentPaneLoad(data.subPanes[pane.subPanes[i].id], pane.subPanes[i]);
			}
		}
		if (data.pinned)
		{
			regionData.pinRegion.action(pane);
		}
		if (data.minimized)
		{
			regionData.minRegion.action(pane);
		}
		if (data.visible)
		{
			if (pane.hiddenPath)
			{
				pane.boundaryPath = pane.hiddenPath;
				pane.hiddenPath = null;
			}
		}
		if (data.hidden)
		{
			if (pane.boundaryPath)
			{
				pane.hiddenPath = pane.boundaryPath;
				pane.boundaryPath = null;
			}
		}
	},
	loadData: function ()
	{
		localDataToLoad = JSON.parse(localStorage.getItem("localSaveData"));
		if (localDataToLoad && localDataToLoad.oD)
		{
			optionData = localDataToLoad.oD;
		}

		this.reloadData();
		dataToLoad = JSON.parse(localStorage.getItem("saveData"));
		if (dataToLoad && dataToLoad[0] != gameVersion)
		{
			dataToLoad = versionMigrator(dataToLoad);
			if (Array.isArray(dataToLoad))
			{
				if (this.migrationMessage)
				{
					alert(this.migrationMessage);
				}
				else
				{
					alert("Save system has beed updated. Save was migrated, but there is a chance it could not work properly. If that's the case, please consider hard resetting.");
				}
			}
			else
			{
				if (dataToLoad == -100)
				{
					alert("Cleared leftover data from Open Beta.");
				}
				else
				{
					alert("Save system has beed updated. There is 99.5% chance previous save wouldn't load properly. Game did hard reset, but you have recieved a lot of turbo time as an apology.");
				}
				data.oElements.Time.amount += dataToLoad;
				dataToLoad = null;
				this.saveData();
			}
		}
		if (dataToLoad)
		{
			var z = 0;
			var eCount = 0;
			var mCount = 0;
			while (++z < dataToLoad.length)
			{
				if (!Array.isArray(dataToLoad[z]))
				{
					data.aElements[eCount].amount = dataToLoad[z];
					if (dataToLoad[z] > 0)
					{
						data.aElements[eCount].known = true;
						data.elementsKnown++;
						if (machineDisplayElements[data.aElements[eCount].type] && machineDisplayElements[data.aElements[eCount].type] != "machineTime")
						{
							machineData[machineDisplayElements[data.aElements[eCount].type]].region.boundaryPath = machines.displayRegionPath;
						}
					}
					z++;
					if (data.aElements[eCount].type == "Time")
					{
						elapsed = Date.now() + dataToLoad[z];
						data.aElements[eCount].amount += elapsed * 0.8;
						formattedElapsed = Math.trunc(elapsed / 3600000) + ":" + ("0" + Math.trunc(elapsed % 3600000 / 60000)).slice(-2) + ":" + ("0" + Math.trunc(elapsed % 60000 / 1000)).slice(-2);
						setTimeout(() =>
						{
							elapsed = 0;
						}, 25000);
					}
					else
					{
						data.aElements[eCount].possibleAmount = -dataToLoad[z] - 1;
					}
					eCount++;
				}
				else
				{
					var mach = dataToLoad[z];
					var machine = machineData[machines.dataTranslator[mCount++]];
					if (mach.length)
					{
						machine.region.boundaryPath = machines.displayRegionPath;
					}
					for (var i = 0; i < mach.length; i++)
					{
						var rec = mach[i];
						var recipe = machine.recipes[i];
						var toActivate = false;
						if (rec[0] % 1 > 0)
						{
							rec[0] -= rec[0] % 1;
							toActivate = true;
						}
						if (rec[0] % 3)
						{
							recipe.enabled = true;
						}
						while (rec[0] > 2)
						{
							recipe.region.paymentSuccess(false);
							if (recipe.markedToUpgrade)
							{
								recipe = machine.hiddenRecipes[recipe.upgradeTo];
								machine.upgradeRecipe(i, false);
							}

							rec[0] -= 3;
						}

						if (rec[0] > 1)
						{
							machine.paused = true;
						}
						var iCount = 0;
						var searchNext = true;
						var slider = null;
						for (var j = 1; j < rec.length; j++)
						{
							rec[j]++;
							while (searchNext)
							{
								if (iCount < recipe.inputs.length)
								{
									if (recipe.inputs[iCount].sliderRegion)
									{
										searchNext = false;
										slider = recipe.inputs[iCount].sliderRegion;
									}
									else
									{
										iCount++;
									}
								}
								else
								{
									if (recipe.outputs[iCount - recipe.inputs.length].sliderRegion)
									{
										searchNext = false;
										slider = recipe.outputs[iCount - recipe.inputs.length].sliderRegion;
									}
									else
									{
										iCount++;
									}
								}
							}
							while (rec[j] > 2)
							{
								slider.paymentSuccess();
								rec[j] -= 3;
							}
							slider.mouseHandler(null, slider.target.sliderRegion.x + 10 + 40 * (rec[j]), 0, "mouseup");
							iCount++;
							searchNext = true;
						}
						recipe.activated = toActivate;
					}
				}
			}
			machines.glowCheckCD = 0;
			machines.glowCheck();
			if (machineData.golemInfuser)
			{
				iconLegendPane.markedToSuperGlow = !machineData.golemInfuser.recipes[0].unlocked;
				educationalPane.markedToSuperGlow = !machineData.golemInfuser.recipes[0].unlocked;
			}
			if (localDataToLoad)
			{
				resizeCanvas();
				this.reccurentPaneLoad(localDataToLoad.pP, mainPane);
			}
		}
		savingSystem.loadingEnded = true;

		tickLore();
		reccurentLoreUnTick(lore.dataTree);
		lorePane.region.markedToSuperGlow = false;
	},
	reloadData: function ()
	{
		preprocessAdditionalCircles();

		preprocessIcons();
		preprocessData();
		preprocessRegionData();
		preprocessPaneData();
		preprocessMachines();

		preprocessMachinesData(simplifiedMachineData);
		preprocessLore();
		preprocessSplosions();
		preprocessParticles();
		resizeCanvas();
		preprocessBackgrounds();

		postprocessRandomStuff();

		cancelAnimationFrame(loopId);
		loopId = requestAnimationFrame(loop);

		c = cMax;
		saveCD = 5400;
		s = saveCD / 2;
	},
	toConsole: function ()
	{
		return btoa(JSON.stringify(this.saveData()));
	},
	load: function (data)
	{
		if (confirm(locale.exchangeStringLoad))
		{
			localStorage.setItem("saveData", atob(data));
			this.loadData();
		}
	},
	initiatePasteLoad: function ()
	{
		this.attemptedPaste = 1800;
	},
	hardReset: function ()
	{
		if (confirm(locale.hardReset))
		{
			this.reloadData();
			this.saveData();
		}
	},
	attemptedPaste: 0,
}

function postprocessRandomStuff()
{
	machineData.machineTime.region.customDraw = machines.displayRegionStumpedDraw;
}
var c;
var cMax = 6401;
var winCheck = true;

function tick()
{
	tickLore();
	effectSystem.tick();

	coldCircle.decay();
	hotCircle.decay();
	gemCircle.decay();
	reachCircle.decay();

	machines.tick();

	for (var i = 0; i < data.aElements.length; i++) {
		var element = data.aElements[i];
		element.amount = Math.min(1e300, Math.max(-1e300, element.amount + element.flow));
		element.reachedAmount = Math.max(element.amount, element.reachedAmount);
		element.flow = 0;
	}

	if (data.oElements.Alkahest.amount >= 42)
	{
		splosions.start("Alkaplosion");
	}
	splosions.tick();

	if (winCheck && data.oElements.PureGolemEarth.amount + data.oElements.PureGolemWater.amount + data.oElements.PureGolemAir.amount + data.oElements.PureGolemFire.amount > 3)
	{
		alert("You win. I hope you liked the stage 3 of The First Alkahistorian!\n\nBig thanks to my supporters and helpers:\nPhantomLemon\nVoid\nAeras Alum\nnaltronix\nranger10700\nNevahlif06\n\nAdditional art provided by:\nnononick\nDimava\nRubikium\n\nMy entire family\nEssi & Baster\n\n\\\\('_' )\nMade by Nagshell");
		winCheck = false;
	}
}

function testPaste(event)
{
	if (savingSystem.attemptedPaste > 0)
	{
		navigator.clipboard.readText().then(
			clipText => console.log(clipText));
	}
}
document.addEventListener("paste", testPaste);
var lastTimestamp = null;
var accumulatedTime = 0;
var drain = 16.667;
var maxRounds = 32;
var fps;
var fpsQueue = new cReplacingQueue(37);
var tps;
var tpsQueue = new cReplacingQueue(97);
var lim = false;
var saveCD;
var s;

function loop(timestamp)
{
	var time = performance.now();
	var lastTime = fpsQueue.push(time);
	if (lastTime != "null")
	{
		fps = 37000 / (time - lastTime);
	}
	else
	{
		fps = "..."
	}
	loopId = null;
	if (!lastTimestamp)
	{
		lastTimestamp = timestamp;
	}
	data.oElements.Time.amount += timestamp - lastTimestamp;
	lastTimestamp = timestamp;
	if (machineData.machineTime.recipes[0].enabled && !machineData.machineTime.paused)
	{
		maxRounds = Math.floor(Math.random() * 1.25);
	}
	else if (machineData.machineTime.recipes[1].enabled && !machineData.machineTime.paused)
	{
		if (data.oElements.TurboLimit.amount < 2)
		{
			data.oElements.TurboLimit.amount = 2;
		}
		maxRounds = data.oElements.TurboLimit.amount;
		if (data.oElements.Time.amount > 1e4)
		{
			data.oElements.TurboLimit.amount = Math.min(32.1, data.oElements.TurboLimit.amount + 0.01);
		}
		else
		{
			data.oElements.TurboLimit.amount = Math.max(1.9, data.oElements.TurboLimit.amount - 0.01);
		}
		data.oElements.NormalLimit.amount = Math.min(3.1, data.oElements.NormalLimit.amount + 0.0001);
	}
	else
	{
		if (data.oElements.NormalLimit.amount < 1)
		{
			data.oElements.NormalLimit.amount = 1;
		}
		maxRounds = data.oElements.NormalLimit.amount;
		if (data.oElements.Time.amount >= 80)
		{
			data.oElements.NormalLimit.amount = Math.min(3.1, data.oElements.NormalLimit.amount + 0.001);
		}
		else
		{
			data.oElements.NormalLimit.amount = Math.max(0.9, data.oElements.NormalLimit.amount - 0.001);
		}
		data.oElements.TurboLimit.amount = Math.max(1.9, data.oElements.TurboLimit.amount - 0.001);
	}

	var rounds = 0;
	while (data.oElements.Time.amount > drain && rounds++ < maxRounds)
	{
		tick();
		time = performance.now();
		lastTime = tpsQueue.push(time);
		if (lastTime != "null")
		{
			tps = 97000 / (time - lastTime);
		}
		else
		{
			tps = "..."
		}
		data.oElements.Time.amount -= drain;
	}
	if (tps != "..." && fps != "...")
	{
		tpf = Math.round(tps / fps * 10) / 10;
	}
	else
	{
		tpf = "...";
	}
	if (tps != "...")
	{
		tps = Math.round(tps);
	}
	if (fps != "...")
	{
		fps = Math.round(fps);
	}
	lim = rounds > maxRounds && data.oElements.Time.amount > 1e4;

	if (s-- <= 0)
	{
		s = saveCD;
		savingSystem.saveData();
	}
	if (savingSystem.attemptedPaste > 0)
	{
		savingSystem.attemptedPaste--;
	}
	draw();
	loopId = requestAnimationFrame(loop);
}
savingSystem.loadData();
