import winston from 'winston';
export default class Device {
	ip: string;
	model: string;
	uuid: string;
	name: string;
	abilities: string[];
	logger: winston.Logger;
	constructor(ip: string, model: string, uuid: string, name: string);
	init(): Promise<void>;

	setLEDState(onoff: boolean): Promise<void>;

	setPowerState(onoff: boolean, channel?: number): Promise<void>;

	getChannelCount(): number;

	getAbilities(): Promise<string[]>;

	reloadAbilities(): Promise<string[]>;

	getCurrentPowerConsumption(): Promise<any>;

	getDebugData(): Promise<any>;

	static getDebugData(ip: string): Promise<any>;

	getLEDState(): Promise<boolean>;

	getValue(namespace: string): Promise<any>;

	setValue(namespace: string, payload: any): Promise<void>;
}