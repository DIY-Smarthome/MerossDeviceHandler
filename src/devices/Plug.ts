import device from './device';
import { plugData } from '../interfaces/frontendDataDefinitions';
import { PowerConsumption } from '../interfaces/dataDefinitions';

export default class Switch extends device {
	ledState: boolean = false;
	powerState: boolean = false;
	constructor(ip: string, model: string, uuid: string, name: string) {
		super(ip, model, uuid, name);
		this.logger.info("Device is running as type 'Plug'");
	}

	async init() {
		super.init();
		this.ledState = await this.getLEDState();
		this.powerState = await this.getPowerState();
	}

	async setLEDState(onoff: boolean): Promise<void> {
		this.logger.info(`Setting LED to ${onoff}`);
		await this.setValue("Appliance.System.DNDMode", {
			"DNDMode": {
				"mode": onoff ? 0 : 1
			}
		});
	}

	async setPowerState(onoff: boolean): Promise<void> {
		this.logger.info(`Setting Power to ${onoff}`);
		await this.setValue("Appliance.Control.ToggleX", {
			"togglex": {
				"onoff": onoff ? 1 : 0,
				"channel": 0
			}
		});
	}

	getChannelCount(): number {
		return 1;
	}

	async getCurrentPowerConsumption(): Promise<PowerConsumption> {
		return (await this.getValue("Appliance.Control.Electricity")).payload.electricity;
	}

	async getLEDState(): Promise<boolean> {
		return (await this.getValue("Appliance.System.DNDMode")).payload.DNDMode.mode == 0;
	}

	async getPowerState(): Promise<boolean> {
		let togglex = (await this.getValue("Appliance.System.All")).payload.all.digest.togglex;
		this.powerState = togglex[0].channel.togglex;
		return this.powerState;
	}

	async getValues(): Promise<plugData> {
		let superVals: plugData = <plugData> await super.getValues();
		this.ledState = await this.getLEDState();
		this.powerState = await this.getPowerState();
		superVals.ledState = this.ledState;
		superVals.powerState = this.powerState;
		return superVals;
	}
}