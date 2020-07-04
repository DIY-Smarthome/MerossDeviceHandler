import request from 'request';
import crypto from 'crypto';

export var config;
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

export function generateBody(method, from, namespace, payload) {
	const messageId = crypto.createHash('md5').update(generateRandomString(16)).digest("hex");
	const timestamp = Math.round(new Date().getTime() / 1000); //int(round(time.time()))
	const signature = crypto.createHash('md5').update(messageId + config["key"] + timestamp).digest("hex");
	return {
		payload: payload,
		header: {
			messageId: messageId,
			method: method,
			from: from,
			namespace: namespace,
			timestamp: timestamp,
			sign: signature,
			payloadVersion: 1
		}
	}
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
		if (string.includes(needles[i])) return true;
	}
	return false;
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