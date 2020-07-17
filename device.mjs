import * as util from './util.mjs';
import {
	doRequest
} from './util.mjs';

export default class Device {
	ip;
	model;
	abilities;
	constructor(ip, model) {
		this.ip = ip;
		this.model = model;
	}

	async init() {
		this.abilities = await this.getAbilities();
	}

	async setLEDState(onoff) {
		await this.setValue("Appliance.System.DNDMode", {
			"DNDMode": {
				"mode": onoff ? 0 : 1
			}
		});
	}

	async setPowerState(onoff) {
		await this.setPowerState(onoff, 0);
	}

	async setPowerState(onoff, channel) {
		if (channel > this.getChannelCount()) throw new Error(`Invalid Channel ${channel}: Device only has ${this.getChannelCount()}`);
		await this.setValue("Appliance.Control.ToggleX", {
			"togglex": {
				"onoff": onoff ? 1 : 0,
				"channel": channel
			}
		});
	}

	getChannelCount() {
		switch (this.model) {
			case 'mss425f':
				return 6;
			case 'mss310':
				return 1;
			default:
				return 0;
		}
	}

	async getAbilities() {
		if (this.abilities) return this.abilities;
		return await this.reloadAbilities();
	}

	async reloadAbilities() {
		let request = await this.getValue("Appliance.System.Ability");
		let abilitiesTemp = [];
		for (var key in request.payload.ability) {
			abilitiesTemp.push(key);
		}
		return abilitiesTemp;
	}

	//TODO split payload
	async getCurrentPowerConsumption() {
		return (await this.getValue("Appliance.Control.Electricity")).payload;
	}

	async getDebugData() {
		return (await this.getValue("Appliance.System.Debug")).payload;
	}

	async getLEDState() {
		return (await this.getValue("Appliance.System.DNDMode")).payload;
	}

	async getValue(namespace) {
		if (this.abilities && !this.abilities.includes(namespace)) throw new Error(`Namespace ${namespace} is not applicable to device ${this.model}`);
		let options = util.getDefaultHeader("POST", this.ip);
		options.body = util.generateBody("GET", `http://${this.ip}/config`, namespace, {});
		return await doRequest(options);
	}

	async setValue(namespace, payload) {
		if (this.abilities && !this.abilities.includes(namespace)) throw new Error(`Namespace ${namespace} is not applicable to device ${this.model}`);
		let options = util.getDefaultHeader("POST", this.ip);
		options.body = util.generateBody("SET", `http://${this.ip}/config`, namespace, payload);
		await doRequest(options);
	}
}