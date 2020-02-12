# Tutorial - Time server
This tutorial coverts development of a simple time server. The server provides time from two sources:
* HTTP server on a request
* WebSocket server via server push

You will learn:
* How to create a new project based on `WebUi` framework
* How to build a web user interface using MVC and [hyperscript](../guide/template-engine.md)
* How to communicate with server using Ajax and WebSockets

## Fetch project template

```bash
mkdir newproject
git clone https://github.com/AliceO2Group/WebUi.git
cp -R WebUi/Framework/docs/tutorial/* ./newproject
cd newproject
```

### 2. Add the framework to dependency list

```bash
npm init
npm install --save @aliceo2/web-ui
```
More details about `npm init` wizard in the [official documentation](https://docs.npmjs.com/files/package.json).

### 3. Launch the application

Start the server: `node index.js`.

Then, open your browser and navigate to [http://localhost:8080](http://localhost:8080). You should see the final result. Click on `++` and `--` to change the local counter, or use two other buttons to request the date.

### Files overview
* `package.json` - NodeJS file with dependencies and scripts
* `config.js` - Application configuration file (HTTP endpoint configuration)
* `index.js` - Server's root file
* `public/Model.js` - Front-end model
* `public/view.js` - Front-end view
* `public/index.html` - Main front-end web page, also contains simple controller

### Server side explained

Open the `index.js` file.

The first line is responsible for importing framework modules: `HttpServer`, `Log`, `WebSocket`, `WebSocketMessage`.
```js
const {HttpServer, Log, WebSocket, WebSocketMessage} = require('@aliceo2/web-ui');
```

Then, the configuration file is loaded. It is good practice to include it in the root file of the project.
```js
const config = require('./config.js');
```

#### HTTP
Afterwards an instance of the HTTP server is created and `./public` folder served (`http://localhost:8080/`).
```js
const httpServer = new HttpServer(config.httpM);
httpServer.addStaticPath('./public');
```

Next step defines HTTP POST path (accessible with `/api` prefix - `/api/getDate`) which provides current time.
```js
httpServer.post('/getDate', (req, res) => {
  res.json({date: new Date()});
});
```
#### WebSockets
It's also possible to speak with the server using WebSocket protocol. It happens either in request-reply mode or as server broadcast (to all connected clients).
The code below accepts `stream-date` as a signal to start sending time information. It will push the current time every 100ms with message command  set to `server-date`. If the `stream-date` command is received once again it will stop the updates.

```js
const wsServer = new WebSocket(httpServer);

let streamTimer = null;

wsServer.bind('stream-date', (body) => {
  if (streamTimer) {
    clearInterval(streamTimer);
    streamTimer = null;
    return;
  }

  Log.info('start timer');

  streamTimer = setInterval(() => {
    wsServer.broadcast(
      new WebSocketMessage().setCommand('server-date').setPayload({date: new Date()})
    );
  }, 100);
});
```

### Client side explained - Controller

Open `public/index.html` file. In the 3rd line CSS bootstrap is imported.
```html
<link rel="stylesheet" href="/css/src/bootstrap.css">
```

It includes session service that recovers variables provided by the server via URL and store them in a global context.
```js
import sessionService from '/js/src/sessionService.js';
sessionService.loadAndHideParameters();
```

Then the MVC files are imported using Javascript modules.
```js
import {mount} from '/js/src/index.js';
import view from './view.js';
import Model from './model.js';
```

And finally, the instance of model is created and `mount` called.
The `mount()` function attaches the root view and model to the `body` of the document. The last argument is a flag that enables timing of re-draw process. This value is printed in the console.
```js
const model = new Model();
const debug = true; // shows when redraw is done
mount(document.body, view, model, debug);
```

### Explaining client side - Model

After going through the controller you can take a look at the model of the application, which is defined in the `public/Model.js` file. The model is a class which inherits from `Observable`. Class `Observable` notifies about any changes in the model. Based on these notification the controller re-renders the view.

Here is a minimal code of a Model class
```js
// Import frontend framework
import {Observable, fetchClient, WebSocketClient} from '/js/src/index.js';

// The model
export default class Model extends Observable {
  constructor() {
    super();
  }
}
```

First line imports client side of the framework:
- `Observable` to listen to the model changes
- `fetchClient` to handle Ajax requests
- `WebSocketClient` to communicate with WebSocket server


The export keyword of the `Model` class allows it to be imported in other files - see more information on [import/export](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import).

Extend the constructor with additional variables to define the full model:
- `count` - local counter
- `date` - the current
- `ws` - WebSocket client (to be defined in the next steps)
```js
  constructor() {
    super();
    this.count = 0;
    this.date = null;
    this.ws = null;
  }
```

Now some operation on the model can be defined.
To increment and decrement the internal counter (eg. when a user clicks a button) two methods are defined:

```js
  increment() {
    this.count++;
    this.notify();
  }

  decrement() {
    this.count--;
    this.notify();
  }
```

In both cases `notify` is called to inform listeners that the model has changed. This will cause the controller to redraw the view. It is necessary to always call `notify` when data has changed.

The next step is fetching the data from the server (in order to get current time). To make it asynchronous Ajax requests should be used. This can be done by the `fetchClient` method provided by the framework.
```js
  async fetchDate() {
    const response = await fetchClient('/api/getDate', {method: 'POST'});
    const content = await response.json();
    this.date = content.date;
    this.notify();
  }
```
The `fetchDate` uses `fetchClient` to request time from `'/api/getDate'` path using `POST` method. On success it returns JSON object. The object is parsed, model updated and then `notify` called.
If you look at the code, both `fetchClient` and `response.json` methods have `await` keyword in front. This makes the method calls synchronous (it will block until the result is available). To read more about Ajax calls go to [Async calls guide](../guide/async-calls.md).

The other way of communicating with server are WebSockets - bi-directional communication protocol.
Create an instance of the WebSocket client. Then you can either send or listen to messages.
The following `this._prepareWebSocket()` method (note that by convention all method names prepended with `_` are private) listens to two events:
 -  `authed` - notifies that client has successfully authorized by the server (automatically generated by server)
 - `server-date` - custom message that includes server's time (as defined in the [Explaining server side](#explaining-server-side) section - look for `wsServer.bind`)
```js
_prepareWebSocket() {
  // Real-time communication with server
  this.ws = new WebSocketClient();

  this.ws.addEventListener('authed', (message) => {
    console.log('ready, let send a message');
  });

  this.ws.addEventListener('server-date', (e) => {
    this.date = e.detail.date;
    this.notify();
  });
}
```
Add this method call to the constructor.

The only missing part is sending the message, enabling time message streaming, to the server. The message should have a command name `stream-date`. In addition, server accepts filters (`ws.setFilter`). The filter is a function assigned on client basis. This function should return `true` or `false` depending whether client wishes to receive it or not.
```js
  streamDate() {
    if (!this.ws.authed) {
      return alert('WebSocket not authenticated, please retry in a while');
    }
    this.ws.sendMessage({command: 'stream-date', message: 'message from client'});
    this.ws.setFilter(function(e) {return true;});
  }
```

If you need to create additional model just follow the guide on [how to scale](../guide/scale-app.md) your application.

### Client side - View.

Open `public/view.js` file.
This requires basic knowledge of CSS and the DOM tree.

At first import the [hyperscript](../guide/template-engine.md) function `h()` which represent the DOM elements. The `h()` function accepts three arguments:
1. Tag name
2. Object attributes
3. List of [vnodes](../guide/template-engine.md) which can be recursively created by `h()`.

Then the `view` function is specified. It receives Model as argument.
```js
import {h} from '/js/src/index.js';

// The view
export default function view(model) {
  return h('div', {class: 'fill-parent flex-column items-center justify-center'},
    h('div', {class: 'bg-gray br3 p4'}, [
      h('h1', 'Hello World'),
      h('ul', [
        h('li', `local counter: ${model.count}`),
        h('li', `remote date: ${model.date}`),
      ]),
      h('div', [
        h('button', {onclick: e => model.increment()}, '++'),
        h('button', {onclick: e => model.decrement()}, '--'),
        h('button', {onclick: e => model.fetchDate()}, 'Get date from server'),
        h('button', {onclick: e => model.streamDate()}, 'Stream date from server'),
      ])
    ])
  );
}
```
Now focus on the button, each on them specified `onclick` attribute which calls the model's methods. As described in the [Explaining client side - Model](#explaining-client-side---model) section these methods modify the model what causes the controller to re-draw the view by calling the `view` method above.

When the application grows the view can easily scale by splitting it into multiple functions and files, see [components guide](../guide/components.md) explaining that.
