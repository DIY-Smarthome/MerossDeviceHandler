# Local IO Broker
#### A little library that logs on to your Meross Cloud Account to find all devices, then handles all functions locally via HTTP.
- No static IP Config needed
- Easy setup
- Devices are cached
  - Credentials only necessary on initial start and changed configs (IP changes, etc.)
  - Credentials are not stored (except for API Key and token)
- Get rid of meross API rate limit (1 Message per 10 minutes)
  - Enables realtime monitoring of Power consumption, etc.
- Be able to control your devices in case of internet outage

# Supported Devices:
#### MSS310
Supported functions:
- LED State (Get/Set)
- Powerstate (Get/Set)
- Get current Powerconsumption
- more to come!
#### MSS425f 
Supported functions:
- LED State (Get/Set)
- Powerstate (Get/Set)
- Powerstate per Channel (Get/Set)
#### More to come

## Project is still work in progress! Feel free to [contribute](../master/CONTRIBUTING.md).

## Community (Help, Assistance, Promote your project with the devicehandler, etc.)
Discord https://discord.gg/dEekZny

---

Contact Owner at contact@quisel.eu
