import device from './device';
import { switchData } from '../interfaces/frontendDataDefinitions';

export default class Switch extends device{
	ledState: boolean = false;
	powerStates: boolean[] = [];
	lastPowerconsumption: any; 
	constructor(ip: string, model: string, uuid: string, name: string) {
		super(ip, model, uuid, name);
		this.logger.info("Device is running as type 'Switch'");
	}

	async init() {
		super.init();
		this.ledState = await this.getLEDState();
		this.powerStates = await this.getPowerStates();
	}

	async setLEDState(onoff: boolean): Promise<void> {
		this.logger.info(`Setting LED to ${onoff}`);
		await this.setValue("Appliance.System.DNDMode", {
			"DNDMode": {
				"mode": onoff ? 0 : 1
			}
		});
	}

	async setPowerState(onoff: boolean, channel = 0): Promise<void> {
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
		return 6;
	}

	async getLEDState(): Promise<boolean> {
		return (await this.getValue("Appliance.System.DNDMode")).payload.DNDMode.mode == 0;
	}

	async getPowerState(channel = 0): Promise<boolean> {
		return (await this.getPowerStates())[channel];
	}

	async getPowerStates(): Promise<boolean[]> {
		let togglex = (await this.getValue("Appliance.System.All")).payload.all.digest.togglex;
		let states = [];
		for (let channel of togglex) {
			states.push(channel.onoff == 1);
		}
		this.powerStates = states;
		return states;
	}

	async getValues(): Promise<switchData> {
		let superVals = <switchData> await super.getValues();
		this.ledState = await this.getLEDState();
		this.powerStates = await this.getPowerStates();
		superVals.ledState = this.ledState;
		superVals.powerStates = this.powerStates;
		return superVals;
	}
}