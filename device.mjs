import * as util from './util.mjs';
import {
	getConfigKey,
	doRequest
} from './util.mjs';
import winston from 'winston';

export default class Device {
	ip;
	model;
	abilities;
	logger;
	uuid;
	constructor(ip, model, uuid) {
		this.ip = ip;
		this.model = model;
		this.uuid = uuid;
		this.logger = winston.createLogger({
			level: 'info',
			format: winston.format.combine(
				winston.format.timestamp({
					format: getConfigKey('timestampFormat') || 'YYYY-MM-DD HH:mm:ss'
				}),
				winston.format.align(),
				winston.format.printf(info => `[${info.timestamp}] [${info.level}]: ${info.message}`)),
			transports: [
				new winston.transports.Console(),
				new winston.transports.File({
					filename: (ip + model) + ".log"
				})
			]
		})
		this.logger.info("Connection established");
	}

	async init() {
		this.abilities = await this.getAbilities();
	}

	async setLEDState(onoff) {
		this.logger.info(`Setting LED to ${onoff}`);
		await this.setValue("Appliance.System.DNDMode", {
			"DNDMode": {
				"mode": onoff ? 0 : 1
			}
		});
	}

	async setPowerState(onoff) {
		this.logger.info(`Setting Power to ${onoff} for the device`);
		await this.setPowerState(onoff, 0);
	}

	async setPowerState(onoff, channel) {
		this.logger.info(`Setting Power to ${onoff} for channel ${channel}`);
		if (channel > this.getChannelCount()) {
			this.logger.error(`Invalid Channel ${channel}: Device only has ${this.getChannelCount()}`);
			return;
		}
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
		this.logger.info("Reloading device abilities");
		let request = await this.getValue("Appliance.System.Ability");
		let abilitiesTemp = [];
		for (var key in request.payload.ability) {
			abilitiesTemp.push(key);
		}
		return abilitiesTemp;
	}

	async getCurrentPowerConsumption() {
		return (await this.getValue("Appliance.Control.Electricity")).payload.electricity;
	}

	async getDebugData() {
		return (await this.getValue("Appliance.System.Debug")).payload.debug;
	}

	static async getDebugData(ip) {
		let options = util.getDefaultHeader("POST", ip);
		options.body = util.generateBody("GET", `http://${ip}/config`, "Appliance.System.Debug", {});
		return (await doRequest(options)).payload.debug;
	}

	async getLEDState() {
		return (await this.getValue("Appliance.System.DNDMode")).payload.DNDMode.mode == 0;
	}

	async getName() {
		return (await this.getValue);
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