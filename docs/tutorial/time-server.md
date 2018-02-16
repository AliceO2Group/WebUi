# Time server

We are going to build a time server allowing a user to get a remote date.

You will learn:
* how to create a new project using this framework
* how to start it and see it in action
* how to build a web application using [hyperscript](../guide/hyperscript-vnode.md)
* how communication is made between client and server
* how to change the interface

### Start a new project

First we will use the existing documentation to start a new project.

Just follow the instruction [here from the skeleton](../skeleton/README.md).

You have now a client/server working. Click on `++` and `--` to change the local counter.
You can also click on the two other button to ask the remote date of the server.

### Overview of the architecture

In your project you can see this files and folders:

* package.json - contains de dependencies
* config.js - contains the configuration, a basic one here
* index.js - the server main file
* public - folder with the web application
* public/Model.js - the root class of your model
* public/view.js - the root function of the view
* public/index.html - the page seen by users, containing the controller

When you need to create more models, you can follow [this guide on how to scale](../guide/scale-app.md) your application.

### Server side

Open the `index.js` file at the root of the skeleton.

To understand all classes and methods you will need to read the [backend API reference](../reference/backend.md).

First we import those tools to create a web server and socket server. `@aliceo2/aliceo2-gui` is the package you installed before with `npm install --save`.

```js
const {HttpServer, Log, WebSocket, WebSocketMessage} = require('@aliceo2/aliceo2-gui');
```

Before instanciating it, we need to require the configuration file. It is good practice to put it at the root of your project. Prefer using a `js` file instead of `json` to allow comments on values.

```js
const config = require('./config.js');
```

Then we instanciate the servers and expose the public folder we seen before.

```js
const http = new HttpServer(config.http, config.jwt);
const ws = new WebSocket(http);
http.addStaticPath('./public');
```

The application part is the API defined. For our time server, we want to provide a RPC way to get the date via the REST API.

```js
http.post('/getDate', (req, res) => {
  res.json({date: new Date()});
});
```

This will answer with an object containing the date for each POST request to the endpoint "/api/getDate".

We also want to stream the date via websocket, which acts like a TCP/IP socket. To broadcast a message we use the `ws` instance like this:

```js
ws.broadcast(
  new WebSocketMessage(STATUS).setCommand(COMMAND).setPayload(OBJECT)
);
```

We will send the date every 100ms as a "server-date" message if we receive the "stream-date" command from the client. If we receive it again, we will stop it by killing the timer of 100ms.

```js
let streamTimer = null;

ws.bind('stream-date', (body) => {
  if (streamTimer) {
    clearInterval(streamTimer);
    streamTimer = null;
    return;
  }

  Log.info('start timer');

  streamTimer = setInterval(() => {
    ws.broadcast(
      new WebSocketMessage(200).setCommand('server-date').setPayload({date: new Date()})
    );
  }, 100);
});
```

That's it, let's go to the frontend.

### Client side - index.html

The index.html contains what is needed to boot the framework, you may not need it to be modified. Except for the title.

It imports the CSS for make good looking interfaces.

```html
<link rel="stylesheet" href="/css/src/bootstrap.css">
```

It gets some variables sent from the server, store it, and remove it from the URL, you cannot see it, but it's good to know what's going on. You can use the [inspector](../guide/debug.md) of your browser to see the original page URL inside "network" tab.

```js
import sessionService from '/js/src/sessionService.js';
sessionService.loadAndHideParameters();
```

Then we import the MVC parts using Javascript modules.

```js
import {mount} from '/js/src/index.js';
import view from './view.js';
import Model from './model.js';
```

And finally we instanciate it. The application is running and the page should show something.

```js
const model = new Model();
const debug = true; // shows when redraw is done
mount(document.body, view, model, debug);
```

### Client side - Model.js

TODO
copy part of the pasta timer tuto
ajax
ws

### Client side - view.js

TODO
copy part of the pasta timer tuto
link hyperscript
link api reference

### Conclusion

TODO
link to how to scale to add more classes

