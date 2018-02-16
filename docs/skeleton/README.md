# Start a new project

A template project is available to begin with a working project containing a simple demo application that you will change according to your specifications.

### 1. Get the skeleton template

```bash
git clone this-repos
cp -R this-repos/docs/skeleton ./newproject
cd newproject
```

It contains a minimal application. Let's turn it on.

### 2. Install the framework as dependency

```bash
npm init # fill the questions
npm install --save @aliceo2/aliceo2-gui
```

You can fill with blank field, to understand those fields go [to the official doc](https://docs.npmjs.com/files/package.json).

### 3. See it in action

Start the project's server

```bash
node index.js
```

Open your browser and go to [http://127.0.0.1:8080](http://127.0.0.1:8080).

To understand it you can follow [this tutorial](../tutorial/time-server.md).
