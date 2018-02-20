# Starting a new project

A template project is available quickly bootstrap a new project. Sample code has been provided that can be adjusted to your needs.

### 1. Fetch skeleton template
...that contains a minimal code.

```bash
git clone https://github.com/AliceO2Group/Gui.git
cp -R Gui/docs/skeleton ./newproject
cd newproject
```

### 2. Add the framework to dependency list

```bash
npm init
npm install --save @aliceo2/aliceo2-gui
```
More about `npm init` and `package.json` in the [official documentation](https://docs.npmjs.com/files/package.json).

### 3. Launch the application

First, start the server

```bash
node index.js
```

Then, open your browser and navigate to [http://127.0.0.1:8080](http://127.0.0.1:8080).

To build a sample application step-by-step follow [Time server tutorial](../tutorial/time-server.md).
