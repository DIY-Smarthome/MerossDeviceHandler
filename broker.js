const crypto = require('crypto');
const request = require('request');
const fs = require('fs');
const read = require('read');
const mqtt = require('mqtt');

const SECRET = '23x17ahWarFH6w29';
const MEROSS_URL = 'https://iot.meross.com';
const LOGIN_URL = MEROSS_URL + '/v1/Auth/Login';
const DEV_LIST_URL = MEROSS_URL + '/v1/Device/devList';
var config;

function generateRandomString(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let nonce = '';
  while (nonce.length < length) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return nonce;
}

function encodeParams(parameters) {
  const jsonstring = JSON.stringify(parameters);
  return Buffer.from(jsonstring).toString('base64');
}

function doRequest(options) {
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

async function test() {
  let key = config["key"];
  let token = config["token"];
  let userid = config["userid"]
  if (!key || !token || !userid) {
    await new Promise((resolve) => {
      read({
        prompt: "No Key in config file found, please enter Meross login credentials:\r\nEmail: "
      }, (err, email) => {
        read({
          prompt: "Password: ",
          silent: true
        }, async (err, password) => {
          [token, key] = await login(email, password);
          resolve();
        })
      })
    })
    if (!key) throw new Error("Couldn't find key! Startup aborted!");
    setConfigKey("key", key);
    setConfigKey("token", token);
  }
  console.log(await getDeviceList());
}
var checkDone = false;
fs.exists('./config/config.json', (exists) => {
  if (exists) {
    fs.readFile('./config/config.json', (err, data) => {
      if (err) throw err;
      config = JSON.parse(data);
    })
    checkDone = true;
    return;
  }
  fs.exists('./config/', (existsDir) => {
    if (existsDir) {
      fs.writeFile('./config/config.json', '{}', (err) => {
        if (err) throw err;
        config = {};
      });
      checkDone = true;
      return;
    }
    fs.mkdir('./config/', (err) => {
      if (err) throw err;
      fs.writeFile('./config/config.json', '{}', (err) => {
        if (err) throw err;
        config = {};
        checkDone = true;
      });
    })
  })
})

new Promise(async (resolve, reject) => {
  while (!checkDone) {
    console.log("Waiting");
    await sleep(250);
  }
  resolve();
}).then(test);

async function login(email, password) {
  const options = {
    url: LOGIN_URL,
    method: 'POST',
    headers: getAuthHeaders(),
    form: generateForm({
      email: email,
      password: password
    })
  };
  let response = JSON.parse(await doRequest(options));
  return [response.data.token, response.data.key, response.data.userid];
}

async function getDeviceList() {
  //Get Devlist to obtain UUIDs of Devices
  let response = JSON.parse(await doRequest({
    url: DEV_LIST_URL,
    method: 'POST',
    headers: getAuthHeaders(),
    form: generateForm({})
  }));


  let innerIPs = [];
  let client;
  let responses = 0;

  //Connect mqtt client
  const appId = crypto.createHash('md5').update('API' + response.data[0].uuid).digest("hex");
  const clientId = 'app:' + appId;
  const hashedPassword = crypto.createHash('md5').update(config["userid"] + config["key"]).digest("hex");
  client = mqtt.connect({
    'protocol': 'mqtts',
    'host': "eu-iot.meross.com",
    'port': 2001,
    'clientId': clientId,
    'username': config["userid"],
    'password': hashedPassword,
    'rejectUnauthorized': true,
    'keepalive': 30,
    'reconnectPeriod': 5000
  });

  //Subscribe to events
  let clientResponseTopic = '/app/' + config.userid + '-' + appId + '/subscribe';
  client.on('connect', () => {
    client.subscribe('/app/' + config.userid + '/subscribe', (err) => {
      if (err) {
        throw err;
      }
    });

    client.subscribe(clientResponseTopic, (err) => {
      if (err) {
        throw err;
      }
    });
  });

  //Bind message eventlistener an receive Debuginfo
  client.on('message', (topic, message) => {
    if (!message) return;
    try {
      message = JSON.parse(message.toString());
    } catch (err) {
      console.log('error', 'JSON parse error: ' + err);
      return;
    }
    if (message.header.from && !isInArray(getFields(response.data, "uuid"), message.header.from)) return;
    responses++;
    innerIPs.push(message.payload.debug.network.innerIp);
  });

  for (let i = 0; i < response.data.length; i++) {
    let data = generateBody("GET", clientResponseTopic, "Appliance.System.Debug", {})
    if (!response.data[i].uuid || response.data[i].onlineStatus === 2) {
      responses++;
      continue;
    }
    client.publish('/appliance/' + response.data[i].uuid + '/subscribe', JSON.stringify(data));
  }
  while (responses != response.data.length) {
    await sleep(100);
  }
  client.end();
  return innerIPs;
}

async function getSystemAllData(ip) {
  //TODO Devicemap and custom data container
  return await doRequest({
    json: true,
    method: "POST",
    strictSSL: false,
    url: `http://${ip}/config`,
    headers: {
      "Content-Type": "application/json"
    },
    body: generateBody("GET", `http://${ip}/config`, "Appliance.System.All", {})
  });
}

function generateForm(data) {
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

function generateBody(method, from, namespace, payload) {
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

function setConfigKey(key, value) {
  config[key] = value;
  fs.writeFile('./config/config.json', JSON.stringify(config), (err) => {
    if (err) throw err;
  })
}

async function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

function isInArray(needles, string) {
  for (let i = 0; i < needles.length; i++) {
    if (string.includes(needles[i])) return true;
  }
  return false;
}

function getFields(input, field) {
  var output = [];
  for (var i = 0; i < input.length; i++)
    output.push(input[i][field]);
  return output;
}

function getAuthHeaders() {
  return {
    "Authorization": "Basic " + (config["token"] || ''),
    "vender": "Meross",
    "AppVersion": "1.3.0",
    "AppLanguage": "EN",
    "User-Agent": "okhttp/3.6.0"
  };
}