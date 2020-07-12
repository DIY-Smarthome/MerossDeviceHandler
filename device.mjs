import * as util from './util.mjs';
import {
	doRequest
} from './util.mjs';

export default class Device {
	ip;
	model;
	constructor(ip, model) {
		this.ip = ip;
		this.model = model;
	}

	setLEDState(onoff) {
		this.setValue("Appliance.System.DNDMode", {
			"DNDMode": {
				"mode": onoff ? 0 : 1
			}
		});
	}

	setPowerState(onoff) {
		this.setPowerState(onoff, 0);
	}

	setPowerState(onoff, channel) {
		if (channel > this.getChannelCount()) throw new Error(`Invalid Channel ${channel}: Device only has ${this.getChannelCount()}`);
		this.setValue("Appliance.Control.ToggleX", {
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

	async getCurrentPowerConsumption() {
		//TODO FIX TIMEOUT
		return (await this.getValue("Appliance.Control.Electricity")).payload;
	}

	async getDebugData() {
		return (await this.getValue("Appliance.System.Debug")).payload;
	}

	async getLEDState() {
		return (await this.getValue("Appliance.System.DNDMode")).payload;
	}

	async getValue(namespace) {
		let options = util.getDefaultHeader("POST", this.ip);
		options.body = util.generateBody("GET", `http://${this.ip}/config`, namespace, {});
		console.log(options);
		return await doRequest(options);
	}

	setValue(namespace, payload) {
		let options = util.getDefaultHeader("POST", this.ip);
		options.body = util.generateBody("SET", `http://${this.ip}/config`, namespace, payload);
		doRequest(options);
	}
}