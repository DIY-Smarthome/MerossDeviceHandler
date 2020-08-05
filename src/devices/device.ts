import * as util from '../util';
import {
	getConfigKey,
	doRequest
} from '../util';
import winston from 'winston';
import { genericDeviceData } from '../interfaces/frontendDataDefinitions'
export default class Device {
	ip: string;
	model:string;
	abilities:string[] | undefined;
	logger: winston.Logger;
	uuid: string;
	name: string;
	constructor(ip:string, model:string, uuid:string, name:string) {
		this.ip = ip;
		this.model = model;
		this.uuid = uuid;
		this.name = name;
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
		this.logger.info("Device is running as type 'Device'");
	}

	async init(): Promise<void> {
		this.abilities = await this.getAbilities();
	}

	async getAbilities(): Promise<string[]> {
		if (this.abilities) return this.abilities;
		return await this.reloadAbilities();
	}

	async reloadAbilities(): Promise<string[]> {
		this.logger.info("Reloading device abilities...");
		let request = await this.getValue("Appliance.System.Ability");
		let abilitiesTemp = [];
		for (var key in request.payload.ability) {
			abilitiesTemp.push(key);
		}
		this.logger.info("Reload done.");
		this.logger.debug("Abilities: " + JSON.stringify(abilitiesTemp));
		return abilitiesTemp;
	}

	async getDebugData(): Promise<any> {
		return (await this.getValue("Appliance.System.Debug")).payload.debug;
	}

	static async getDebugData(ip: string): Promise<any> {
		let options = util.getDefaultHeader("POST", ip);
		options.body = util.generateBody("GET", `http://${ip}/config`, "Appliance.System.Debug", {});
		return (await doRequest(options)).payload.debug;
	}

	async getValue(namespace: string): Promise<any> {
		if (this.abilities && !this.abilities.includes(namespace)) {
			this.logger.error(`Namespace ${namespace} is not applicable to device ${this.model}`);
			return;
		}
		let options = util.getDefaultHeader("POST", this.ip);
		options.body = util.generateBody("GET", `http://${this.ip}/config`, namespace, {});
		return await doRequest(options);
	}

	async setValue(namespace:string, payload:any): Promise<any> {
		if (this.abilities && !this.abilities.includes(namespace)) {
			this.logger.error(`Namespace ${namespace} is not applicable to device ${this.model}`);
			return;
		}
		let options = util.getDefaultHeader("POST", this.ip);
		options.body = util.generateBody("SET", `http://${this.ip}/config`, namespace, payload);
		await doRequest(options);
	}

	async getValues(): Promise<genericDeviceData> {
		this.abilities = await this.reloadAbilities();
		return {
			abilities: this.abilities,
			ip: this.ip,
			uuid: this.uuid,
			name: this.name,
			model: this.model
		}
	}
}