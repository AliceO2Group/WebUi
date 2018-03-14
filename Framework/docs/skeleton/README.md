# Starting a new project

A template project is available quickly bootstrap a new project. Sample code has been provided that can be adjusted to your needs.

### 1. Fetch skeleton template
...that contains a minimal code.

```bash
git clone https://github.com/AliceO2Group/WebUi.git
cp -R WebUi/Framework/docs/skeleton ./newproject
cd newproject
```

### 2. Add the framework to dependency list

```bash
npm init
npm install --save @aliceo2/aliceo2-gui
```
To learn how to follow `npm init` wizard in the [official documentation](https://docs.npmjs.com/files/package.json).

### 3. Launch the application

First, start the server

```bash
node index.js
```

Then, open your browser and navigate to [http://localhost:8080](http://localhost:8080).

To build a sample application step-by-step follow [Time server tutorial](../tutorial/time-server.md).
