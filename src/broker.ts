import crypto from 'crypto';
import fs from 'fs';
import readline from 'readline';
import request from 'request';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});


const SECRET = '23x17ahWarFH6w29';
const MEROSS_URL = 'https://iot.meross.com';
const LOGIN_URL = MEROSS_URL + '/v1/Auth/Login';
const DEV_LIST_URL = MEROSS_URL + '/v1/Device/devList';
var config:any;
function generateRandomString(length: number) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let nonce = '';
  while (nonce.length < length) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return nonce;
}

function encodeParams(parameters: any) {
  const jsonstring = JSON.stringify(parameters);
  return Buffer.from(jsonstring).toString('base64');
}

function doRequest(options: any): Promise<string> {
  return new Promise(function (resolve, reject) {
    request(options, function (error: any, res: any, body: any) {
      if (!error && res.statusCode == 200) {
        resolve(body);
      } else {
        reject(error);
      }
    });
  });
}

async function test() {
  
  let key:string = config["key"];
  if(key){
    await new Promise((resolve)=>{
      rl.question("No Key in config file found, please enter Meross login credentials:\r\nEmail: ",(email)=>{
        rl.question("Password: ", async (password)=>{
          key = await login(email, password);
          resolve();
        })
      })
    })    
    if(!key) throw new Error("Couldn't find key! Startup aborted!");
    setConfigKey("key",key);
  }  
  //TODO console.log(await getAllDevices());
}
var checkDone = false;
fs.exists('./config/config.json',(exists)=>{
  if (exists){
    fs.readFile('./config/config.json',(err, data:any)=>{
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
  fs.readFile('./config/config.json',(err, data:any)=>{
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

async function login(email:string, password:string){
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

async function getDeviceFromIP(ip:string){
  
  const messageId = crypto.createHash('md5').update(generateRandomString(16)).digest("hex");
  const timestamp = Math.round(new Date().getTime() / 1000);  //int(round(time.time()))
  const signature = crypto.createHash('md5').update(messageId + config["key"] + timestamp).digest("hex");
  //TODO Cleanup
  //TODO use generate function for request
  //TODO Devicemap and custom data container
  return await doRequest({
    json: true,
    method: "POST",
    strictSSL: false,
    url: `http://${ip}/config`,
    headers: {
      "Content-Type": "application/json"
    },
    body: {
      payload: {},
      header: {
        messageId: messageId,
        method: "GET",
        from: `http://${ip}/config`,
        namespace: "Appliance.System.All",
        timestamp: timestamp,
        sign: signature,
        payloadVersion: 1
      }
    }
  });
}

function generateForm(data:any){
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

function setConfigKey(key:string, value:any){
  config[key]=value;
  fs.writeFile('./config/config.json',JSON.stringify(config),(err)=>{
    if(err) throw err;
  })
}

async function sleep(ms:number) {
	return new Promise(resolve => {
		setTimeout(resolve, ms);
	});
}