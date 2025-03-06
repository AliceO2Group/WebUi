# Installation

Follow these steps to install and set up QCG (Web UI for O<sup>2</sup> Quality Control).

## 1. Install Node.js (version 22.x or higher)

To run the application, you'll need Node.js version `>= 22.x`. Choose your operating system below to install Node.js:

- **On CentOS 7 (CC7):**
This command installs the correct version of Node.js via the NodeSource repository.
    ```bash
    yum install https://rpm.nodesource.com/pub_16.x/el/8/x86_64/nodejs-16.9.1-1nodesource.x86_64.rpm
    ```


- **On macOS (using Homebrew):**
Homebrew installs Node.js 16 and updates your PATH environment variable to use the newly installed version.
    ```bash
    brew install node@16
    echo 'export PATH="/usr/local/opt/node@16/bin:$PATH"' >> $HOME/.bash_profile
    ```



- **For other operating systems**
If you are using a different OS, you can find installation instructions for Node.js via package managers here:
[Node.js Downloads](https://nodejs.org/en/download/package-manager)

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
- Provide your hostname in the `hostname` filed of `http` section of `config.js` file.