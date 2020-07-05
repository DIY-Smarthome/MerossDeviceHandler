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
		let options = util.getDefaultHeader("POST", this.ip);
		options.body = util.generateBody("SET", `http://${this.ip}/config`, "Appliance.System.DNDMode", {
			"DNDMode": {
				"mode": onoff ? 0 : 1
			}
		});

		doRequest(options);
	}

	setPowerState(onoff) {
		this.setPowerState(onoff, 0);
	}

	setPowerState(onoff, channel) {
		if (channel > this.getChannelCount()) throw new Error(`Invalid Channel ${channel}: Device only has ${this.getChannelCount()}`);
		let options = util.getDefaultHeader("POST", this.ip);
		options.body = util.generateBody("SET", `http://${this.ip}/config`, "Appliance.Control.ToggleX", {
			"togglex": {
				"onoff": onoff ? 1 : 0,
				"channel": channel
			}
		});
		doRequest(options);
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

	async getDebugData() {
		let options = util.getDefaultHeader("POST", this.ip);
		options.body = util.generateBody("GET", `http://${this.ip}/config`, "Appliance.System.Debug", {})
		return await doRequest(options);
	}

	async getLEDState() {
		let options = util.getDefaultHeader(this.ip);
		options.body = util.generateBody("POST", `http://${this.ip}/config`, "Appliance.System.DNDMode", {}, "GET");
		let result = await doRequest(options);
		console.log(result) //TODO make return
	}
}