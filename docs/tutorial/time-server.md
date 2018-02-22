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

The index.html contains what is needed to boot the framework, as a controller, it may not need it to be modified. Except for the title.

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

After viewing the main controller, we can go to the model of the application. In the skeleton one file provides it: "model.js" as seen in the importation of "index.html". The model is a class which inherit the `Observable` class, thus providing a way to listen to any change of it's internal data. The controller will listen to this and render the view.

Here is a simple example of a model declaration (you can open Model.js to see the while file):

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

We import everything about data from the framework:
- the `Observable` class, to listen to the model's changes
- a `fetchClient` function to make Ajax calls
- and a stream class `WebSocketClient`
See the [reference API](../reference/frontend-js.md) for more details.

As you can see, we also export the class as the default exportation, [see more information on import/export](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import) which is part of ES6 (Javascript version ECMAScript 6 or ECMAScript 2015, it's the same name for the same thing).

Basically, we need to declare the data structure first in the constructor.

```js
  constructor() {
    super();
    this.count = 0;
    this.date = null;
    this.ws = null;

    this._prepareWebSocket();
  }
```

We have a local counter `count`, the current `date` from the remote server and a websocket instance followed by a method instanciating it.

Let's go to the simplest action of a model, updating itself. We want to increment and decrement the internal counter for example when a user click on a button. So we provide an API of two methods here.

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

In both cases, we call `notify`, observers will understand that the model has changed, the controller is an observer and will redraw the view. It is important to always `notify` when data has changed.

Notice that all method in Javascript are public. By convention you can put a `_` before the name to say it's private, just like `_prepareWebSocket`.

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

