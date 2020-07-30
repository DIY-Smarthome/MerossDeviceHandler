import request from 'request';
import crypto from 'crypto';
import fs, {
	write
} from 'fs';
import loadJsonFile from 'load-json-file';
import writeJsonFile from 'write-json-file';
export var config;
export var devices;

const SECRET = '23x17ahWarFH6w29';

export function doRequest(options) {
	return new Promise(function (resolve, reject) {
		request(options, function (error, res, body) {
			if (!error && res.statusCode == 200) {
				resolve(body);
			} else {
				reject(error);
			}
		});
	});
}

export function generateForm(data) {
	const nonce = generateRandomString(16);
	const timestampMillis = Date.now();
	const encodedData = encodeParams(data);

	// Generate the md5-hash (called signature)
	const datatosign = SECRET + timestampMillis + nonce + encodedData;
	const md5hash = crypto.createHash('md5').update(datatosign).digest("hex");

	return {
		'params': encodedData,
		'sign': md5hash,
		'timestamp': timestampMillis,
		'nonce': nonce
	};
}

export function generateBody(bodyMethod, from, namespace, payload) {
	const messageId = crypto.createHash('md5').update(generateRandomString(16)).digest("hex");
	const timestamp = Math.round(new Date().getTime() / 1000); //int(round(time.time()))
	const signature = crypto.createHash('md5').update(messageId + config["key"] + timestamp).digest("hex");
	let body = {
		payload: payload,
		header: {
			messageId: messageId,
			method: bodyMethod,
			from: from,
			namespace: namespace,
			timestamp: timestamp,
			sign: signature,
			payloadVersion: 1
		}
	}
	return body;
}

export function getConfigKey(key) {
	return config[key];
}

export function setConfigKey(key, value) {
	//TODO logging
	config[key] = value;
	writeJsonFile('./config/config.json', config);
}

export function refreshDeviceFile(newData) {
	devices = newData;
	writeJsonFile('./config/devices.json', devices);
}

export async function sleep(ms) {
	return new Promise(resolve => {
		setTimeout(resolve, ms);
	});
}

export function isInArray(needles, string) {
	for (let i = 0; i < needles.length; i++) {
		if (string.includes(needles[i])) return i;
	}
	return -1;
}

export function getFields(input, field) {
	var output = [];
	for (var i = 0; i < input.length; i++)
		output.push(input[i][field]);
	return output;
}

export function getAuthHeaders() {
	return {
		"Authorization": "Basic " + (config["token"] || ''),
		"vender": "Meross",
		"AppVersion": "1.3.0",
		"AppLanguage": "EN",
		"User-Agent": "okhttp/3.6.0"
	};
}

export function getDefaultHeader(method, ip) {
	return {
		json: true,
		method: method,
		timeout: 1000,
		strictSSL: false,
		url: `http://${ip}/config`,
		headers: {
			"Content-Type": "application/json",
		},
		body: {}
	}
}

export function generateRandomString(length) {
	const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
	let nonce = '';
	while (nonce.length < length) {
		nonce += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return nonce;
}

export function encodeParams(parameters) {
	const jsonstring = JSON.stringify(parameters);
	return Buffer.from(jsonstring).toString('base64');
}

export async function checkConfigFile() {
	if (fs.existsSync('./config/config.json')) {
		config = await loadJsonFile('./config/config.json');
		return;
	}
	if (!fs.existsSync('./config/')) fs.mkdirSync('./config/');
	config = {
		"logLevel": "info",
		"deviceLogLevel": "warning",
		"requestTimeout": 1000
	};
	await writeJsonFile('./config/config.json', config);
}

export async function checkDevicesFile() {
	if (fs.existsSync('./config/devices.json')) {
		devices = await loadJsonFile('./config/devices.json');
		return;
	}
	if (!fs.existsSync('./config/')) fs.mkdirSync('./config/');
	devices = [];
	await writeJsonFile('./config/devices.json', devices);
}

export function loadStoredIPs() {
	//TODO logging
	return devices;
}

/**
 * SQL like: SELECT * from @param haystack where @param fieldname = @param needle
 * @param fieldname 
 * @param needle 
 * @param haystack 
 */
export function findInObject(fieldname, needle, haystack) {
	for (let elem of haystack) {
		if (elem[fieldname] == needle) return elem;
	}
	return null;
}