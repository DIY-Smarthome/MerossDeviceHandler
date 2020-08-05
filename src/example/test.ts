import * as broker from '../broker';
import readline from 'readline-sync';

async function test() {
	await broker.init(false);
	let ipArr = [...broker.deviceMap.keys()];
	let ipIndex = readline.keyInSelect(ipArr, "Select IP to test on");
	if (ipIndex === -1) return;
	let ip = ipArr[ipIndex];
	let device = broker.deviceMap.get(ip);
	if (!device) throw new Error("Device not found!");
	var menu;
	switch (device.model) {
		case "mss310":
			menu = [
				"Set Powerstate",
				"Get Powerstate",
				"Set LED State",
				"Get LED State",
				"Get Channel count",
				"Get Abilites",
				"Get current Powerconsumption",
				"Get Debug Data",
				"Get Custom Namespace"
			];
			break;
		case "mss425f":
			menu = [
				"Set Powerstate",
				"Set LED State",
				"Get LED State",
				"Get Channel count",
				"Get Abilites",
				"Get current Powerconsumption",
				"Get Debug Data",
				"Get Custom Namespace"
			];
			break;
		default:
			menu = [
				"Get Abilites",
				"Get Debug Data",
				"Get Custom Namespace"
			];
			break;
	}

	let result
	do {
		let newState;
		result = readline.keyInSelect(menu, "Which Command to you want to run?");
		try {
			let channel = 0;
			switch (menu[result]) {
				case "Set Powerstate":
					if (device.getChannelCount() > 1) {
						let single = readline.keyInYN("Set single channel ? ");
						if (single) channel = readline.questionInt("Choose channel");
					}
					newState = readline.question("Toggle to on/off: ").toLowerCase() == "on";
					await device.setPowerState(newState, channel);
					break;
				case "Get Powerstate":
					if (device.getChannelCount() > 1) {
						let single = readline.keyInYN("Set single channel ? ");
						if (single) channel = readline.questionInt("Choose channel");
					}
					console.log(`${channel!=0?`Channel ${channel}`:'Device'} is currently ${await device.getPowerState(channel)?"":"not "}powered`);
					break;
				case "Set LED State":
					newState = readline.question("Toggle to on/off: ").toLowerCase() == "on";
					await device.setLEDState(newState);
					break;
				case "Get LED State":
					console.log(`The LEDs are currently ${await device.getLEDState()?"on":"off"}`);
					break;
				case "Get Channel count":
					console.log(device.getChannelCount());
					break;
				case "Get Abilites":
					console.log(await device.getAbilities());
					break;
				case "Get current Powerconsumption":
					console.log(await device.getCurrentPowerConsumption());
					break;
				case "Get Debug Data":
					console.log(await device.getDebugData());
					break;
				case "Get Custom Namespace":
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