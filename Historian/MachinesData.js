var chartColors = {
	null: "#080808",
	working: "#686868",
	full: "#A8A8A8",
	empty: "#282828",
};
var machineData;
var machineDisplayElements = {};

function plugin(){
	ml = Object.values(simplifiedMachineData)
	mls = ml.filter(e=>(e.baseStats[0] - 650)**2 + (e.baseStats[1] - 650)**2 < 200**2).map(e=>e.baseStats)

	mls.map(prep)
	function prep(e){
		let x = e[0] - 650;
		let y = e[1] - 650;
		e[0] = 650 - y;
		e[1] = 650 - x;
	}

// 	simplifiedMachineData.machinePressure.baseStats[0] += 50
// 	simplifiedMachineData.machinePressure.baseStats[1] -= 50
// 	simplifiedMachineData.machineCompress.baseStats[0] -= 50
// 	simplifiedMachineData.machineCompress.baseStats[1] += 50
	simplifiedMachineData.machineGemstone.baseStats[0] += 50 / 2
	simplifiedMachineData.machineGemstone.baseStats[1] += 50 / 2
	simplifiedMachineData.machineRandomGem.baseStats[0] =625 + 25
	simplifiedMachineData.machineRandomGem.baseStats[1] =625 + 25
	simplifiedMachineData.machineQuartz.baseStats[0] = 525
	simplifiedMachineData.machineQuartz.baseStats[1] = 700
}

function preprocessMachinesData(simplifiedDataToBeProcessed)
{
	machines.list = [];
	machines.dataTranslator = [];

	machines.glowCheckCD = 0;
	plugin();

	machineData = prepareTemplatedMachineData(simplifiedDataToBeProcessed);

	var count = 0;
	for (var title in machineData)
	{
		machineData[title].translatedID = count++;
		machines.dataTranslator.push(title);

		if (machineData[title].displayArray)
		{
			for (var i = 0; i < machineData[title].displayArray.length; i++)
			{
				machineDisplayElements[machineData[title].displayArray[i]] = title;
			}
		}
		else if (machineData[title].displayElement)
		{
			machineDisplayElements[machineData[title].displayElement] = title;
		}
		initMachine(title);
	}
}
