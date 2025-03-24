# Installation

Follow these steps to install and set up QCG (Web UI for O<sup>2</sup> Quality Control).

## 1. Install Node.js (version 22.x or higher)

You can download and install Node.js from the official Node.js website: [https://nodejs.org/](https://nodejs.org/).

Make sure to install version 22.x or higher, as it is required for QCG. The website provides installers for various operating systems and package managers for advanced users.

## 2. Clone the `WebUI` repository
Clone the repository for the `WebUI` project to your local machine using Git:

```bash
git clone https://github.com/AliceO2Group/WebUi.git
```

## 3. Install QCG dependencies
Navigate to the `QualityControl` directory within the cloned repository and install the required dependencies using `npm`:
```bash
cd WebUi/QualityControl
npm ci
```
The `npm ci` command will install the dependencies listed in the `package-lock.json` file to ensure that the exact versions of packages are installed.

## 4. Copy the configuration file
Copy the default configuration file and update it according to your needs. The default configuration file is `config-default.js`, and the copied file will be named `config.js`:

```bash
cp config-default.js config.js
```

Here you can learn how to update this configuration file to suit your specific setup:
[Local Configuration](./Configuration.md)

## Run QCG Locally
**Note**: If you want to run QCG in development mode (with development features such as hot-reloading), refer to the instructions in [Development](./Development.md).

If you are not running QCG in **development mode**, follow these steps:

### 1. Run QCG Server
Start the QCG server by executing the following command:

```bash
npm run start
```
This will launch the application and bind it to the default port (8080).

### 2. Open a browser 
Once the server is running, open your browser and navigate to [localhost:8080](http://localhost:8080) to access the QCG interface.

Make sure your [browser is supported](https://github.com/AliceO2Group/WebUi/tree/dev/Framework#minimum-browser-version-support) to avoid any compatibility issues.

## Enable HTTPS
- Follow these [steps](https://ca.cern.ch/ca/host/HostSelection.aspx?template=ee2host&instructions=openssl) to request a new CERN Grid Host Certificate
- Set up file paths to the generated key and certificate in the `http` section of `config.js` file.
- Note that this HTTPS setup is implemented using the ExpressJS router and does not rely on a web proxy server such as Nginx.