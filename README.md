# Local IO Broker
A little library that logs on to your Meross Cloud Account to find all devices, then handles all functions locally via HTTP.
- No static IP Config needed
- Easy setup
- Devices are cached
  - Credentials only necessary on initial start and changed configs (IP changes, etc.)
  - Credentials are not stored (except for API Key)
- Get rid of meross API rate limit (1 Message per 10 minutes)
  - Enables realtime monitoring of Power consumption, etc.

Functions:
- [ ] Current Power Consuption
- [ ] Daily Power Consumption Summary
- [x] Toggle Power
- [x] Toggle Power per channel
- [x] LED (DND-Mode) Switching
- [ ] to be continued...

# Project is still work in progress! Feel free to contribute.
# Community (Help, Assistance, Promote your project with the devicehandler, etc.)
* Discord https://discord.gg/r4J3Eft
