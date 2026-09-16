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

### FLP suite or related QCG instances

When QCG is deployed as part of an FLP suite or FLP inventory, certificates are installed and configured with nginx as part of the standard procedure — refer to the FLP documentation for details. For smaller, standalone deployments, the QCG back-end server supports `https` directly, with SSL certificate paths configurable in `config.js`.

In both cases, HTTPS should be configured using CERN-provided certificates, following CERN recommendations. [Request a CERN host certificate](https://ca.cern.ch/ca/host/Request.aspx?template=CERNHostCertificate2YearsCustomSubject)
