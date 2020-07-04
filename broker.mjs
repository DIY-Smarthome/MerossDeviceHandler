import crypto from 'crypto';
import fs from 'fs';
import read from 'read';
import mqtt from 'mqtt';
import {
  doRequest,
  generateForm,
  generateBody,
  setConfigKey,
  getConfigKey,
  refreshConfig,
  sleep,
  isInArray,
  getFields,
  getAuthHeaders
} from './util.mjs';

const MEROSS_URL = 'https://iot.meross.com';
const LOGIN_URL = MEROSS_URL + '/v1/Auth/Login';
const DEV_LIST_URL = MEROSS_URL + '/v1/Device/devList';

async function test() {
  let key = getConfigKey("key");
  let token = getConfigKey("token");
  let userid = getConfigKey("userid");
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
      refreshConfig(JSON.parse(data));
    })
    checkDone = true;
    return;
  }
  fs.exists('./config/', (existsDir) => {
    if (existsDir) {
      fs.writeFile('./config/config.json', '{}', (err) => {
        if (err) throw err;
        refreshConfig({});
      });
      checkDone = true;
      return;
    }
    fs.mkdir('./config/', (err) => {
      if (err) throw err;
      fs.writeFile('./config/config.json', '{}', (err) => {
        if (err) throw err;
        refreshConfig({});
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
  const hashedPassword = crypto.createHash('md5').update(getConfigKey("userid") + getConfigKey("key")).digest("hex");
  client = mqtt.connect({
    'protocol': 'mqtts',
    'host': "eu-iot.meross.com",
    'port': 2001,
    'clientId': clientId,
    'username': getConfigKey("userid"),
    'password': hashedPassword,
    'rejectUnauthorized': true,
    'keepalive': 30,
    'reconnectPeriod': 5000
  });

  //Subscribe to events
  let clientResponseTopic = '/app/' + getConfigKey("userid") + '-' + appId + '/subscribe';
  client.on('connect', () => {
    client.subscribe('/app/' + getConfigKey("userid") + '/subscribe', (err) => {
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