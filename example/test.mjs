import * as broker from '../broker.mjs';
import readline from 'readline-sync';

async function test() {
	await broker.init(false);
	var menu = [
		"Set Powerstate",
		"Get Powerstate",
		"Set LED State",
		"Get LED State",
		"Get Channel count",
		"Get Abilites",
		"Get current Powerconsumption",
		"Get Debug Data",
		"Get Custom Namespace"
	]
	let ipArr = [...broker.deviceMap.keys()];
	let ipIndex = readline.keyInSelect(ipArr, "Select IP to test on");
	if (ipIndex === -1) return;
	let ip = ipArr[ipIndex];
	let device = broker.deviceMap.get(ip);
	if (!device) throw new Error("Device not found!");
	let result
	do {
		let newState;
		result = readline.keyInSelect(menu, "Which Command to you want to run?");
		try {
			let channel = 0;
			switch (result) {
				case 0:
					if (device.getChannelCount() > 1) {
						let single = readline.keyInYN("Set single channel ? ");
						if (single) channel = readline.questionInt("Choose channel");
					}
					newState = readline.question("Toggle to on/off: ").toLowerCase() == "on";
					await device.setPowerState(newState, channel);
					break;
				case 1:
					if (device.getChannelCount() > 1) {
						let single = readline.keyInYN("Set single channel ? ");
						if (single) channel = readline.questionInt("Choose channel");
					}
					console.log(`${channel!=0?`Channel ${channel}`:'Device'} is currently ${await device.getPowerState(channel)?"":"not "}powered`);
					break;
				case 2:
					newState = readline.question("Toggle to on/off: ").toLowerCase() == "on";
					await device.setLEDState(newState);
					break;
				case 3:
					console.log(`The LEDs are currently ${await device.getLEDState()?"on":"off"}`);
					break;
				case 4:
					console.log(device.getChannelCount());
					break;
				case 5:
					console.log(await device.getAbilities());
					break;
				case 6:
					console.log(await device.getCurrentPowerConsumption());
					break;
				case 7:
					console.log(await device.getDebugData());
					break;
				case 8:
					let namespace = readline.question("Enter namespace to query: ");
					console.log(JSON.stringify(await device.getValue(namespace)));
					break;
			}
		} catch (e) {
			console.log(e);
		}
	} while (result != -1)
}
test();