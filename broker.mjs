import crypto from 'crypto';
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
  getAuthHeaders,
  checkConfigFile,
  checkDevicesFile,
  refreshDeviceFile,
  loadStoredIPs,
  devices
} from './util.mjs';
import Device from './device.mjs';

const MEROSS_URL = 'https://iot.meross.com';
const LOGIN_URL = MEROSS_URL + '/v1/Auth/Login';
const DEV_LIST_URL = MEROSS_URL + '/v1/Device/devList';
let deviceMap = new Map();

async function startup(forceIPReload) {
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
          [token, key, userid] = await login(email, password);
          resolve();
        })
      })
    })
    if (!key) throw new Error("Couldn't find key! Startup aborted!");
    setConfigKey("key", key);
    setConfigKey("token", token);
    setConfigKey("userid", userid);
  }
  let uuids = await getDevicesUUIDs();
  let ips;
  if (!(await checkDevices(uuids)) || forceIPReload) {
    console.log("Stored Devices are not up to date! Refresh!")
    ips = await getDeviceIPs(uuids);
    refreshDeviceFile(ips);
    ips = getFields(ips, "ip");
  } else {
    console.log("Using stored Devices!");
    ips = loadStoredIPs();
  }
  console.log(ips);
  ips.forEach((dev) => {
    deviceMap.set(dev, new Device(dev));
  })
  deviceMap.get("192.168.2.162").setLEDState(false);
  //[ '192.168.2.162', '10.10.10.2', '10.10.10.4' ]
}
new Promise(async (resolve, reject) => {
  await checkConfigFile();
  await checkDevicesFile();
  resolve();
}).then(startup);

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

async function getDevicesUUIDs() {
  let response = JSON.parse(await doRequest({
    url: DEV_LIST_URL,
    method: 'POST',
    headers: getAuthHeaders(),
    form: generateForm({})
  })).data;
  let uuids = [];
  for (let elem of response) {
    if (elem.onlineStatus === 2) continue;
    uuids.push(elem.uuid);
  }
  return uuids;
}

async function getDeviceIPs(uuids) {
  let innerIPs = [];
  let client;
  let responses = 0;

  //Connect mqtt client
  const appId = crypto.createHash('md5').update('API' + uuids[0]).digest("hex");
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
    let uuidIndex = isInArray(uuids, message.header.from);
    if (message.header.from && uuidIndex === -1) return;
    responses++;
    innerIPs.push({
      uuid: uuids[uuidIndex],
      ip: message.payload.debug.network.innerIp
    });
  });

  for (let i = 0; i < uuids.length; i++) {
    let data = generateBody("GET", clientResponseTopic, "Appliance.System.Debug", {})
    client.publish('/appliance/' + uuids[i] + '/subscribe', JSON.stringify(data));
  }
  let iteration = 0;
  while (responses != uuids.length && iteration <= 50) {
    await sleep(100);
    iteration++;
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

export async function checkDevices(uuids) {
  if (devices.length != uuids.length);
  let tempMap = new Map();
  devices.forEach(element => {
    tempMap.set(element.uuid, element);
  });

  for (let i = 0; i < uuids.length; i++) {
    let uuid = uuids[i];
    let devData = tempMap.get(uuid);
    if (!devData || uuid != devData.uuid) {
      console.log(devData);
      console.log(uuid);
      console.log("Not matching --> return false");
      return false;
    }
    let device = new Device(devData.ip);
    let debugData;
    try {
      debugData = await device.getDebugData();
    } catch (err) {
      //TODO remove later
      if (devData.ip == "192.168.2.162")
        return false;
      continue;
    }

    if (!debugData || debugData.payload.debug.network.innerIp != devData.ip) {
      console.log("IPs Not matching --> return false");
      return false;
    }
  }
  console.log("Returned true");
  return true;
}