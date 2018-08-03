# Starting a new project

This template was made available quick project bootstrap. Sample code is provided and can be adjusted to the needs.

### 1. Fetch skeleton template
...that contains a minimal code.

```bash
mkdir newproject
git clone https://github.com/AliceO2Group/WebUi.git
cp -R WebUi/Framework/docs/skeleton ./newproject
cd newproject
```

### 2. Add the framework to dependency list

```bash
npm init
npm install --save @aliceo2/web-ui
```
More details about `npm init` wizard in the [official documentation](https://docs.npmjs.com/files/package.json).

### 3. Launch the application

1. Start the server
```bash
node index.js
```

2. Open your browser and navigate to [http://localhost:8080](http://localhost:8080).

##### Continue by following step-by-step tutorial and build [Time server using Ajax and WebSockets](../tutorial/time-server.md).
