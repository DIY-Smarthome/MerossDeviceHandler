
const crypto = require('crypto');
const request = require('request');
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});


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
  if(key){
    await new Promise((resolve)=>{
      rl.question("No Key in config file found, please enter Meross login credentials:\r\nEmail: ",(email)=>{
        rl.question("Password: ", (password)=>{
          key = await login(email, password);
          resolve();
        })
      })
    })    
    if(!key) throw new Error("Couldn't find key! Startup aborted!");
    setConfigKey("key",key);
  }
  //console.log(key);
  //console.log(key.data.key);
  const messageId = crypto.createHash('md5').update(generateRandomString(16)).digest("hex");
  const timestamp = Math.round(new Date().getTime() / 1000);  //int(round(time.time()))
  const signature = crypto.createHash('md5').update(messageId + key + timestamp).digest("hex");



  response = await doRequest({
    json: true,
    method: "POST",
    strictSSL: false,
    url: `http://10.10.10.8/config`,
    headers: {
      "Content-Type": "application/json"
    },
    body: {
      payload: {},
      header: {
        messageId: messageId,
        method: "GET",
        from: `http://10.10.10.8/config`,
        namespace: "Appliance.System.All",
        timestamp: timestamp,
        sign: signature,
        payloadVersion: 1
      }
    }
  });
  console.log(response);
  console.log(response.payload);
  console.log(JSON.stringify(response.payload));
}
var checkDone = false;
fs.exists('./config/config.json',(exists)=>{
  if (exists){
    fs.readFile('./config/config.json',(err, data)=>{
      if(err)throw err;
      config=JSON.parse(data);
    })
    checkDone = true;
    return;
  } 
  fs.exists('./config/',(existsDir)=>{
    if(existsDir){
      fs.writeFile('./config/config.json','{}',(err)=> {
        if (err) throw err;
        config={};
      }); 
      checkDone=true;
      return;
    } 
    fs.mkdir('./config/',(err)=>{
      if(err)throw err;
      fs.writeFile('./config/config.json','{}',(err)=> {
        if (err) throw err;
        config={};
        checkDone=true;
      }); 
    })
  })
})

fs.watchFile('./config/config.json',(curr,prev)=>{
  //TODO Log
  fs.readFile('./config/config.json',(err, data)=>{
    if(err)throw err;
    config=JSON.parse(data);
  })
});
new Promise(async (resolve,reject)=>{
  while(!checkDone){
    console.log("Waiting");
    await sleep(250);
  }
  resolve();
}).then(test);

async function login(email, password){
  const headers = {
    "Authorization": "Basic ",
    "vender": "Meross",
    "AppVersion": "1.3.0",
    "AppLanguage": "EN",
    "User-Agent": "okhttp/3.6.0"
  };

  const options = {
    url: LOGIN_URL,
    method: 'POST',
    headers: headers,
    form: generateForm({email:email, password:password})
  };
  let response = JSON.parse(await doRequest(options));
  console.log(response.data.key);
return response.data.key;
}

function generateForm(data){
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

function setConfigKey(key, value){
  config[key]=value;
  fs.writeFile('./config/config.json',JSON.stringify(config),(err)=>{
    if(err) throw err;
  })
}

async function sleep(ms) {
	return new Promise(resolve => {
		setTimeout(resolve, ms);
	});
}