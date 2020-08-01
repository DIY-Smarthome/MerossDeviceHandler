import Device from './device';
export var deviceMap: Map<string, Device>;
export function init(forceIPReload: boolean): Promise<void>;