export interface switchData{
	abilities: string[],
	ip: string,
	uuid: string,
	name: string,
	model: string,
	ledState: boolean,
	powerStates: boolean[]
}

export interface plugData{
	abilities: string[],
	ip: string,
	uuid: string,
	name: string,
	model: string,
	ledState: boolean,
	powerState: boolean
}

export interface genericDeviceData{
	abilities: string[],
	ip: string,
	uuid: string,
	name: string,
	model: string
}