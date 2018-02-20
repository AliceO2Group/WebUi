# Tutorial - Time server

This tutorial explains how to develop a time server that pushes time updates to client side.

You will learn:
* How to create a new project based on this framework
* How to launch it
* How to build a web user interface using [hyperscript](../guide/hyperscript-vnode.md)
* How server communicates with client

### Starting a new project

At first use the [project skeleton](../skeleton/README.md) to start a new project.

This will provide you with sample web application. Open it in the browser and click on `++` and `--` to change the local counter.
You can also click on the two other buttons to request the server to push a current date.

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

First line is responsible for importing framework modules: `HttpServer`, `Log`, `WebSocket`, `WebSocketMessage`.

```js
const {HttpServer, Log, WebSocket, WebSocketMessage} = require('@aliceo2/aliceo2-gui');
```
Then the configuration file is loaded. It is good practice to include it in the root file of your project. Prefer using a `js` file instead of `json` to allow comments on values.

```js
const config = require('./config.js');
```

Afterwards an instanciate of the HTTP and WebSocket servers is created and `./public` folder serveed.

```js
const http = new HttpServer(config.http, config.jwt);
const ws = new WebSocket(http);
http.addStaticPath('./public');
```

Next step is definition of HTTP POST server path (`/api/getDate`) which provides current date.

```js
http.post('/getDate', (req, res) => {
  res.json({date: new Date()});
});
```

The date could be also server pushed via WebSocket. To broadcast a message to all connected client run:

```js
ws.broadcast(
  new WebSocketMessage(STATUS).setCommand(COMMAND).setPayload(OBJECT)
);
```

The date will be pushed by server every 100ms as a "server-date" message. This action will be trigged when clients sends "stream-date" command. If the command is received once again it will stop the updates.

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

### Client side - index.html

The `index.html` file contains includes the framework. It is unlikely that it needs any modifications.

It imports the CSS bootstrap

```html
<link rel="stylesheet" href="/css/src/bootstrap.css">
```

It includes parameter service that parses the URL to recover variables provided by the server and store them in global context. It also clears the URL so variables are invisible for users of the application. You can use the browsers [inspector](../guide/debug.md) to find out the original URL (go to "network" tab).

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

### Client side - Model.js

After going through the simple controller (`index.html`), you can take a look at the model of the application: `Model.js`. The model is a class which inherits the `Observable` class which  notifies about any changes in  the model. Based on this notifications the controller will re-render the view.

Here is a simple example of a model declaration (you can open Model.js to see it all):

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
- `Observable` to listen to the models changes
- `fetchClient` to hadle Ajax requests
- `WebSocketClient` to communicate with WebSocket server
See the [reference API](../reference/frontend-js.md) for more details.

Them the `Model` class is exported - [see more information on import/export](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import) which is part of ES6 (ECMAScript 6 or ECMAScript 2015).

The constructor should be extended to define data structure of the model.

```js
  constructor() {
    super();
    this.count = 0;
    this.date = null;
    this.ws = null;

    this._prepareWebSocket();
  }
```

The model consists of a local counter `count`, the current `date`  provided by the HTTP or WebSocket server via `fetchClient` or WebSocket client respectively..

Let's simply update the model. 
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

Notice that all the methods are public. By convention prepend method name with `_` to make it private (like `_prepareWebSocket`).

Then we want some communication with the server (to get the current date of it). We use Ajax for this, which makes request/response calls with the server. Its implementation is done though the framework's `fetchClient`, a wrapper of the native `fetch` function (it wraps the session key for you).

```js
  async fetchDate() {
    const response = await fetchClient('/api/getDate', {method: 'POST'});
    const content = await response.json();
    this.date = content.date;
    this.notify();
  }
```

This method `fetchDate` will ask `fetchClient` to make a request to the URL `'/api/getDate'` with the method `POST`. The result is a promise, an object that will contain the asked value in the future and will notice you if it successes or fails, see [this guide](../guide/async-calls.md) for more information. For this reason, put `wait` in front to wait the result, the method must also be declared as `async` because it can be blocked (waiting for all instructions to finish).

On success, the method will transform the `response` into a json content (object), and we can update the internal property with `this.date = content.date`, we also don't forget to `notify` to change the view.

The other way of communicating is a websocket (WS) for bi-directional communication. We need to instanciate the socket, then listen to some events and send some requests.

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

Here we listen to two events: `authed` and `server-date`. The first one is a `WebSocketClient` event just to let you know that the socket is authentified and can be used (session layer of OSI). The second one is a message from the server (application layer of OSI).

To receive some `server-date` events containing the date the server wants to the client to send `stream-date` (remember we did a `ws.bind` in index.js). The method is written like this:

```js
  streamDate() {
    if (!this.ws.authed) {
      return alert('WS not authed, wait and retry');
    }
    this.ws.sendMessage({command: 'stream-date', message: 'message from client'});
    this.ws.setFilter(function(e) {return true;});
  }
```

We check that the socket is open and authentified to avoid errors and then we can send a message containing a command and some other properties we want to send. Because streaming can use a lot of bandwidth, the WS connection has a filter on the server side for broadcasting. And because we don't want to filter for now we just put a function returning always true `function(e) {return true;}`. The function will be sent to the server, the argument `e` is the message to check.

Usually, a bigger project will nee more models, this means more files that you will place intro folders to tidy things up. You can follow [this guide on how to scale your application](../guide/scale-app.md) for this.

### Client side - view.js

For the last part, let's take a look at the view. You need to learn how to use CSS and the basic elements of the DOM tree, but the engine itself of the framework is simple.

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

From the framework we import the [hyperscript](../guide/hyperscript-vnode.md) function `h()` to represent the DOM elements. Its first argument is the tag name, the second (facultative) is an object of attributes and the third one is a text content or a list of [vnodes](../guide/hyperscript-vnode.md).

The critical part is on the buttons, under the `onclick` attribute, we define it as an arrow function from ES6 and we call the model's methods. It will be modified, then it will notify the controller and the function `view` above will be called again to redraw the screen.

The controller gives you the model as a single argument to the function `view`. This view is really simple, when the application grow it should be split into more functions and files, see [this guide](../guide/components.md) on how to do that.

### Going further

You can play with this interface to add buttons and change the model and multiply the counter. Maybe you could also change the colors and layout with the [CSS reference](https://aliceo2group.github.io/Gui/docs/reference/frontend-css.html) ?

