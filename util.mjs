import request from 'request';
import crypto from 'crypto';
import fs from 'fs';

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

export function setConfigKey(key, value) {
	config[key] = value;
	fs.writeFile('./config/config.json', JSON.stringify(config), (err) => {
		if (err) throw err;
	})
}

export function getConfigKey(key) {
	return config[key];
}

export function refreshConfig(newConfig) {
	config = newConfig;
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
	await new Promise((resolve, reject) => {
		fs.exists('./config/config.json', (exists) => {
			if (exists) {
				fs.readFile('./config/config.json', (err, data) => {
					if (err) throw err;
					refreshConfig(JSON.parse(data.toString()));
					resolve();
				})
				return;
			}
			fs.exists('./config/', (existsDir) => {
				if (existsDir) {
					fs.writeFile('./config/config.json', '{}', (err) => {
						if (err) throw err;
						refreshConfig({});
					});
					resolve();
					return;
				}
				fs.mkdir('./config/', (err) => {
					if (err) throw err;
					fs.writeFile('./config/config.json', '{}', (err) => {
						if (err) throw err;
						refreshConfig({});
						resolve()
					});
				})
				resolve();
			})
		})
	});
}

export async function checkDevicesFile() {
	await new Promise((resolve, reject) => {
		fs.exists('./config/devices.json', (exists) => {
			if (exists) {
				fs.readFile('./config/devices.json', (err, data) => {
					if (err) throw err;
					devices = JSON.parse(data.toString());
					resolve();
				})
				return;
			}
			fs.writeFile('./config/devices.json', '[]', (err) => {
				if (err) throw err;
				devices = [];
			});
			resolve();
		})
	});
}

export function loadStoredIPs() {
	return devices;
}

export function refreshDeviceFile(newData) {
	fs.writeFile('./config/devices.json', JSON.stringify(newData), (err) => {
		if (err) throw err;
		devices = newData;
	})
}

export function findInObject(fieldname, needle, haystack) {
	for (let elem of haystack) {
		if (elem[fieldname] == needle) return elem;
	}
	return null;
}