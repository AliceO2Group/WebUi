# Tutorial - Time server

This tutorial explains how to develop a time server. The server provides the time in two modes: via HTTP request or by pushing it via WebSocket protocol.

You will learn:
* How to create a new project based on this framework
* How to launch your project
* How to build a web user interface using [hyperscript](../guide/hyperscript-vnode.md)
* How server communicates with client

### Starting a new project

At first, use the [project skeleton](../skeleton/README.md) to start a new project.

This will provide you with basic web application. Start the server and open the application in the browser. Click on `++` and `--` to change the local counter.
You can also click on the two other buttons to request the server to push a current time.

### Files overview

* package.json - dependencies and scripts
* config.js - basic configuration
* index.js - server main file
* public - folder with client side application
* public/Model.js - the root class of your model
* public/view.js - the root function of the view
* public/index.html - main web pages, contains controller

If you need to create additional model just follow the guide on [how to scale](../guide/scale-app.md) your application.

### Explaining server side

Open the `index.js` file in an editor.

Starting from the first line, it is responsible for importing framework modules: `HttpServer`, `Log`, `WebSocket`, `WebSocketMessage`.
```js
const {HttpServer, Log, WebSocket, WebSocketMessage} = require('@aliceo2/aliceo2-gui');
```

Then the configuration file is loaded. It is good practice to include it in the root file of your project. Prefer using a `js` file instead of `json` to allow comments on values.
```js
const config = require('./config.js');
```

Afterwards an instanciate of the HTTP and WebSocket servers is created, and then `./public` folder served over HTTP (`http://localhost:8080/public`).
```js
const http = new HttpServer(config.http, config.jwt);
const ws = new WebSocket(http);
http.addStaticPath('./public');
```

Next step define of HTTP POST path (accessible byy `/api/getDate`) which provides current time.
```js
http.post('/getDate', (req, res) => {
  res.json({date: new Date()});
});
```

The other way to communicate with the server is WebSocket protocol. It allows to work use request-reply mode or broadcast the data to all connected WebSocket clients.
The code below will push the time every 100ms as a "server-date" message. This action will be trigged when clients sends a request with "stream-date" command. If the command is received once again it will stop the updates.

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

### Explaining client side - Controller

Open `index.html` file. First line imports the CSS bootstrap
```html
<link rel="stylesheet" href="/css/src/bootstrap.css">
```

It includes parameter service that recovers variables provided by the server via URL and store them in global context. Then, it clears the URL so variables are invisible for users of the application. You can use the [browser inspector](../guide/debug.md) to find out the original URL (go to "network" tab).

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

And finally, the instanciates of M, V, C are created.

```js
const model = new Model();
const debug = true; // shows when redraw is done
mount(document.body, view, model, debug);
```

### Explainig client side - Model

After going through the simple controller you can take a look at the model of the application, which is defined in the `public/Model.js` file. The model is a class which inherits from `Observable`. Class `Observable` notifies about any changes in the model. Based on these notification the controller re-renders the view.

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

First line imports client side of theframework:
- `Observable` to listen to the model changes
- `fetchClient` to hadle Ajax requests
- `WebSocketClient` to communicate with WebSocket server
See the [JS reference](../reference/frontend-js.md) for more details.

The export keyword of the `Model` class allows it to be improted in other files - see more information on [import/export](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import).

Extend the constructor with additional variables to define the full model. The model consists of a local counter `count`, the current `date`.
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

In both cases `notify` is called to inform `Observer` that the model has changed. This will cause the Controller to redraw the view. It is important to always `notify` when data has changed.

The next step is fetching the data from the server (in order to request current time). To make it asynchronous Ajax requests should be used. This can be done by the `fetchClient` method provided by the framework.
```js
  async fetchDate() {
    const response = await fetchClient('/api/getDate', {method: 'POST'});
    const content = await response.json();
    this.date = content.date;
    this.notify();
  }
```
The `fetchDate` uses `fetchClient` to request time from `'/api/getDate'` path using `POST` method. On success it returns JSON object. The object is parsed, model updated and then `notified` called.
If you look at the code, both `fetchClient` and `response.json` methods have `await` keyword in front. This is to make these method calls synchronous (it will block until the result is available). To read more about Ajax calls go to [this guide](../guide/async-calls.md).

The other way of communicating with server are WebSockets - bi-directional communication protocol. To use it an instanciate of the WebSocket client need to be created. Then you can either send or listen to messages. 
The following `this._prepareWebSocket()` method (note that by convention all method names prepended with `_` are private) listens to two events: 
 -  `authed` - notifies that client has successully authorized by the server (automatically generated by server)
 - `server-date` - custom message that includes server's time (as defined in the [Explaining servers](#Explaining-server-side) section - look for `ws.bind`)
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

The only missing part is sending the message, enabling time message streaming, to the server. The message should have a command name `stream-date`. In addition, server accepts filters (`ws.setFilter`). This filter is a fucntion assigned on client basis. This function should return `true` or `false` depending whether client wishes to receive it or not.
```js
  streamDate() {
    if (!this.ws.authed) {
      return alert('WebSocket not authenticated, please retry in a while');
    }
    this.ws.sendMessage({command: 'stream-date', message: 'message from client'});
    this.ws.setFilter(function(e) {return true;});
  }
```
### Client side - View.

Open `public/view.js` file.
This requires basic knowleadge of CSS and the DOM tree.

At first import the [hyperscript](../guide/hyperscript-vnode.md) function `h()` which represent the DOM elements. The `h()` function accepts three arguments:
1. Tag name
2. Object attributes
3. List of [vnodes](../guide/hyperscript-vnode.md) which can be recursevly created by `h()`.

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
Now focus on the the buttton, each on them spcified `onclick` attribute which calls the model's methods. As described in the [Explainig client side - Model](#Explainig-client-side-Model) section these methods modify the model what causes the controller to re-draw the view by calling the `view` method above.

When the application grows the view can easily scale by splitting it into multiple functions and files, see [components guide](../guide/components.md) explaining that.
