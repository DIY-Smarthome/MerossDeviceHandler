<a name="readme-top"></a>

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]

<br />
<div align="center">
<h3 align="center">Devicehandler</h3>
  <p align="center">
    The MerossDeviceHandler module can be used in the DIY-Smarthome ecosystem to control smart devices from the company "Meross". The goal is to control devices locally, without using the company's servers.
    <br/>
    <a href="https://github.com/DIY-Smarthome/MerossDeviceHandler/issues">Report Bug</a>
    ·
    <a href="https://github.com/DIY-Smarthome/MerossDeviceHandler/issues">Request Feature</a>
  </p>
</div>



<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project

The proof of concept was achieved with the protoype that was submitted as an university exam. Currently, the code isn't functional because of some big API changes. We aim to repair the code and extend functionality (support more devices, etc.).\

There are already multiple benefits using this library:
* Get rid of Meross' Rate limts (formerly 1 Message per 10 min, currently unknown)
  * Enables features like realtime monitoring (i.e. Power consumption)
* Control devices independently of
  * internet connection
  * manifacturer server

<p align="right">(<a href="#readme-top">back to top</a>)</p>



### Built With

* [![TypeScript][TypeScript.org]][TypeScript-url]
* <img src="https://mqtt.org/assets/img/mqtt-logo-transp.svg" width="130" alt="MQTT">

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Currently supported devices
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
- more to come!

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->
## Getting Started

Currently, there is no dedicated installer for any module of the DIY-Smarthome ecosystem. You can clone this repository and try the example code (**not working atm!**) or clone the Dev-Environment and use the module with others.

### Prerequisites

You will need NodeJs and npm to use this module.

### Installation (in Dev-Environment)

1. Clone the Dev-Environment from [https://example.com](https://example.com)
   ```sh
   git clone https://github.com/DIY-Smarthome/Dev-Environment.git
   ```
2. Enter the lib folder
3. Clone the module
    ```sh
   git clone https://github.com/DIY-Smarthome/MerossDeviceHandler.git
   ```
4. Install NPM packages
   ```sh
   npm install
   ```
5. Build Dev-Environment and all modules
    ```sh
   npm run build
   ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ROADMAP -->
## Roadmap

- [ ] Repair code
- [ ] Extend supported functions of already supported devices
- [ ] Extend supported devices

See the [open issues](https://github.com/DIY-Smarthome/MerossDeviceHandler/issues) for a full list of proposed features (and known issues).

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Also check [contributing.md](../master/CONTRIBUTING.md) for more info!

Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- LICENSE -->
## License

Distributed under the MIT License. See [license.md](../master/LICENSE.md) for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- CONTACT -->
## Contact

- Quisel on Twitter: [@Quisel_](https://twitter.com/@Quisel_)
- Quisel via Email: contact@quisel.eu
- Contact the community on the [Discord](https://discord.gg/dEekZny)

Project Link: [https://github.com/DIY-Smarthome/MerossDeviceHandler](https://github.com/DIY-Smarthome/MerossDeviceHandler)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/DIY-Smarthome/MerossDeviceHandler.svg?style=for-the-badge
[contributors-url]: https://github.com/DIY-Smarthome/MerossDeviceHandler/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/DIY-Smarthome/MerossDeviceHandler.svg?style=for-the-badge
[forks-url]: https://github.com/DIY-Smarthome/MerossDeviceHandler/network/members
[stars-shield]: https://img.shields.io/github/stars/DIY-Smarthome/MerossDeviceHandler.svg?style=for-the-badge
[stars-url]: https://github.com/DIY-Smarthome/MerossDeviceHandler/stargazers
[issues-shield]: https://img.shields.io/github/issues/DIY-Smarthome/MerossDeviceHandler.svg?style=for-the-badge
[issues-url]: https://github.com/DIY-Smarthome/MerossDeviceHandler/issues
[license-shield]: https://img.shields.io/github/license/DIY-Smarthome/MerossDeviceHandler.svg?style=for-the-badge
[license-url]: https://github.com/DIY-Smarthome/MerossDeviceHandler/blob/master/LICENSE.md
[TypeScript.org]: https://img.shields.io/badge/TypeScript-0769AD?style=for-the-badge&logo=typescript&logoColor=white
[TypeScript-url]: https://typescript.org
