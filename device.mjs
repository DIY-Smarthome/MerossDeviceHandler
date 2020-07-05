import * as util from './util.mjs';
import {
	doRequest
} from './util.mjs';

export default class Device {
	ip;
	constructor(ip) {
		this.ip = ip;
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