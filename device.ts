import * as util from './util';
import {
	getConfigKey,
	doRequest
} from './util';
import winston from 'winston';

export default class Device {
	ip: string;
	model:string;
	abilities:string[] | undefined;
	logger: winston.Logger;
	uuid: string;
	name: string;
	ledState: boolean = false;
	powerStates: boolean[] = [];
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
	}

	async init(): Promise<void> {
		this.abilities = await this.getAbilities();
		this.ledState = await this.getLEDState();
		this.powerStates = await this.getPowerStates();
	}

	async setLEDState(onoff: boolean):Promise<void> {
		this.logger.info(`Setting LED to ${onoff}`);
		await this.setValue("Appliance.System.DNDMode", {
			"DNDMode": {
				"mode": onoff ? 0 : 1
			}
		});
	}

	async setPowerState(onoff:boolean, channel = 0): Promise<void> {
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

	getChannelCount(): number {
		switch (this.model) {
			case 'mss425f':
				return 6;
			case 'mss310':
				return 1;
			default:
				return 0;
		}
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

	async getCurrentPowerConsumption():Promise<any> {
		return (await this.getValue("Appliance.Control.Electricity")).payload.electricity;
	}

	async getDebugData(): Promise<any> {
		return (await this.getValue("Appliance.System.Debug")).payload.debug;
	}

	static async getDebugData(ip: string): Promise<any> {
		let options = util.getDefaultHeader("POST", ip);
		options.body = util.generateBody("GET", `http://${ip}/config`, "Appliance.System.Debug", {});
		return (await doRequest(options)).payload.debug;
	}

	async getLEDState(): Promise<boolean> {
		return (await this.getValue("Appliance.System.DNDMode")).payload.DNDMode.mode == 0;
	}

	async getPowerState(channel=0): Promise<boolean> {
		return (await this.getPowerStates())[channel];
	}

	async getPowerStates(): Promise<boolean[]> {
		let togglex = (await this.getValue("Appliance.System.All")).payload.all.digest.togglex;
		let states = [];
		for (let channel of togglex) {
			states.push(channel.onoff == 1);
		}
		return states;
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

	async getValues() {
		this.abilities = await this.reloadAbilities();
		this.ledState = await this.getLEDState();
		this.powerStates = await this.getPowerStates();
		return {
			abilities: this.abilities,
			ledState: this.ledState,
			powerStates: this.powerStates,
			ip: this.ip,
			uuid: this.uuid,
			name: this.name,
			model: this.model
		}

	}
}