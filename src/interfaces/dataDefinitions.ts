export interface PowerConsumption{
	channel: number,
	current: number,
	voltage: number,
	power: number,
	config: {
		voltageRatio: number,
		electricityRatio: number
	}
}