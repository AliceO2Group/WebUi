# Installation

Follow these steps to install and set up Configuration.

## 1. Install Node.js (version 22.x or higher)

You can download and install Node.js from the official Node.js website: [https://nodejs.org/](https://nodejs.org/).

Make sure to install version 22.x or higher, as it is required for Configuration. The website provides installers for various operating systems and package managers for advanced users.

## 2. Clone the `WebUI` repository
Clone the repository for the `WebUI` project to your local machine using Git:

```bash
git clone https://github.com/AliceO2Group/WebUi.git
```

## 3. Setup Control backend dependencies
Navigate to the `Control` directory within the cloned repository and follow the setup instructions there. Control backend is dependency of this project.

Change port of Control to `8081`, as our app uses `8080` already.

Run the Control backend and continue here after success.

## 4. Run Configuration locally

### 1. Run Docker containers
Start the Configuration development servers by executing the following command:

```bash
docker compose up
```
This will launch the application and bind it to the default port (8080).

### 2. Open in browser 
Once the server is running, open your browser and navigate to [localhost:8080](http://localhost:8080) to access the Configuration interface.

Make sure your [browser is supported](https://github.com/AliceO2Group/WebUi/tree/dev/Framework#minimum-browser-version-support) to avoid any compatibility issues.
