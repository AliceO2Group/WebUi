## Modules

<dl>
<dt><a href="#module_renderer">renderer</a></dt>
<dd><p>Template engine functions using vnode and DOM diff algo</p>
</dd>
<dt><a href="#module_sessionService">sessionService</a></dt>
<dd><p>Singleton to retrieve and hide the parameters passed as query string.</p>
</dd>
</dl>

## Classes

<dl>
<dt><a href="#EventEmitter">EventEmitter</a></dt>
<dd><p>Class EventEmitter for event-driven architecture
Similar to the one provided by NodeJS</p>
</dd>
<dt><a href="#Loader">Loader</a> ⇐ <code><a href="#Observable">Observable</a></code></dt>
<dd><p>Network loader, count current requests, handle errors, make ajax requests</p>
</dd>
<dt><a href="#Observable">Observable</a></dt>
<dd><p>Simple Observable class to notify others listening for changes</p>
</dd>
<dt><a href="#QueryRouter">QueryRouter</a> ⇐ <code><a href="#Observable">Observable</a></code></dt>
<dd><p>Router handle query history for Single Page Application (SPA)
It notifies when route change and it allows to push a new route.
Search parameters can be read directly via <code>params</code>, for example:
&#39;?page=list&#39; will give <code>.params ==== {page: &#39;list&#39;}</code>.</p>
</dd>
<dt><a href="#RemoteData">RemoteData</a></dt>
<dd><p>RemoteData is tagged union type representing remote data loaded via network.
<a href="http://blog.jenkster.com/2016/06/how-elm-slays-a-ui-antipattern.html">http://blog.jenkster.com/2016/06/how-elm-slays-a-ui-antipattern.html</a></p>
</dd>
<dt><a href="#WebSocketClient">WebSocketClient</a> ⇐ <code><a href="#EventEmitter">EventEmitter</a></code></dt>
<dd><p>Encapsulate WebSocket and provides the endpoint, filtering stream and authentification status.
It also handles session token by adding it in the handshake request
from sessionService transparently for developer. Authentification is done when <code>authed</code> event
is emitted.</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#tryCompatibility">`tryCompatibility(stringCode)`</a></dt>
<dd><p>Try to execute a string code with eval, on failure redirect to the compatibility page.</p>
</dd>
<dt><a href="#fetchClient">`fetchClient(URL)`</a> ⇒ <code>object</code></dt>
<dd><p>Extends the fetch() function by adding the session token in the request
by taking it from sessionService transparently for developer.
See <a href="https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API">https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API</a></p>
</dd>
<dt><a href="#switchCase">`switchCase(caseName, cases, defaultCaseValue)`</a> ⇒ <code>Any</code></dt>
<dd><p>Functional switch case</p>
</dd>
</dl>

<a name="module_renderer"></a>

## renderer
Template engine functions using vnode and DOM diff algo


* [renderer](#module_renderer)
    * [`~frameDebouncer(fn)`](#module_renderer..frameDebouncer) ⇒ <code>function</code>
    * [`~render(element, vnode)`](#module_renderer..render)
    * [`~h(selector, attributes, children)`](#module_renderer..h) ⇒ <code>Vnode</code>
    * [`~mount(element, view, model, debug)`](#module_renderer..mount)
    * [`~Hook`](#module_renderer..Hook) : <code>function</code>

<a name="module_renderer..frameDebouncer"></a>

### `renderer~frameDebouncer(fn)` ⇒ <code>function</code>
Register a callback to be called one time at browser render time if
the trigger was called before. Used to push new renderings efficitly.

**Kind**: inner method of [<code>renderer</code>](#module_renderer)  
**Returns**: <code>function</code> - The trigger to be called  
**Params**

- fn <code>function</code> - The callback to be registered

<a name="module_renderer..render"></a>

### `renderer~render(element, vnode)`
Renders a vnode tree inside the dom element.

**Kind**: inner method of [<code>renderer</code>](#module_renderer)  
**Params**

- element <code>Element</code> - the dom element
- vnode <code>Vnode</code> - the vnode tree

**Example**  
```js
import {h, render} from '/js/src/index.js';
let virtualNode = h('h1.title', 'World');
render(document.body, virtualNode);
```
<a name="module_renderer..h"></a>

### `renderer~h(selector, attributes, children)` ⇒ <code>Vnode</code>
Hyperscript function to represente a DOM element
it produces a vnode usable by render function.

**Kind**: inner method of [<code>renderer</code>](#module_renderer)  
**Returns**: <code>Vnode</code> - the Vnode representation  
**Params**

- selector <code>String</code> - Tag name (div, p, h1...) and optional classes as CSS selector (.foo.bar.baz), empty string =~ 'div'
- attributes <code>Object</code> - (optional) Properties and attributes of DOM elements and hooks (see description). Here is a non-exhaustive list of common uses:
    - .className <code>string</code> - Additional class names
    - .onclick <code>function</code> - On mouse click (DOM handler onclick)[https://developer.mozilla.org/fr/docs/Web/API/GlobalEventHandlers/onclick]
    - .oninput <code>function</code> - On content typed inside input tag (DOM handler oninput)[https://developer.mozilla.org/fr/docs/Web/API/GlobalEventHandlers/oninput]
    - .style <code>string</code> | <code>Object</code> - If string used, change HTML attribute (`style="..."`). If object used, change DOM property (`style = {}`).
    - .oncreate <code>Hook</code> - Hook called after a DOM element is created and attached to the document
    - .onupdate <code>Hook</code> - Hook is called after each render, while DOM element is attached to the document
    - .onremove <code>Hook</code> - Hook is called before a DOM element is removed from the document
    - .href <code>string</code> - Destination for links (DOM href property)[https://developer.mozilla.org/en-US/docs/Web/API/HTMLHyperlinkElementUtils/href]
    - .placeholder <code>string</code> - Placeholder for inputs (DOM input, all properties)[https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input]
    - .value <code>string</code> - Value for inputs (DOM input, all properties)[https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input]
- children <code>Array.&lt;(Vnode\|string)&gt;</code> | <code>string</code> - Children inside this tag

**Example**  
```js
import {h, render} from '/js/src/index.js';
const virtualNode1 = h('h1.text-center', 'World');
const virtualNode2 = h('h1.text-center', {className: 'primary'}, 'World');
const virtualNode3 = h('h1', {onclick: () => console.log('clicked')}, 'World');
const chart = h('div', {
  oncreate: (vnode) => chartlib.attachTo(vnode.dom),
  onremove: (vnode) => chartlib.detachFrom(vnode.dom)
});
const containerNode = h('div', [
  virtualNode1,
  virtualNode2,
  virtualNode3,
  chart
]);
render(document.body, containerNode);
```
<a name="module_renderer..mount"></a>

### `renderer~mount(element, view, model, debug)`
Bind together a model and a view to render both on a DOM element.
When the model change and is an `Observable`, view refresh by itself (unlike `render()`)

**Kind**: inner method of [<code>renderer</code>](#module_renderer)  
**Params**

- element <code>Element</code> - The DOM element
- view <code>function</code> - The functional view which produces a vnode tree
- model [<code>Observable</code>](#Observable) - The model containing the state
- debug <code>boolean</code> - Facultative. Shows the rendering time each time

**Example**  
```js
import {h, mount, Observable} from '/js/src/index.js';
const model = new Observable();
const view = (model) => h('h1.title', `hello ${model.name}`);
mount(document.body, view, model);
model.name = 'Joueur du Grenier';
model.notify();
```
<a name="module_renderer..Hook"></a>

### `renderer~Hook` : <code>function</code>
This callback type is a Hook.
Hooks are lifecycle methods of vnodes.
They are only called as a side effect of template engine (`render` or `mount`).
Properties of vnode argument must not be used, except `dom`.
It's very useful to connect with another template engine like a chart lib or a canvas.
Don't forget to remove any link to DOM element when `onremove` is called to avoid memory leaks.

**Kind**: inner typedef of [<code>renderer</code>](#module_renderer)  
**Params**

- vnode <code>Object</code>
    - .dom <code>Object</code> - DOM element

<a name="module_sessionService"></a>

## sessionService
Singleton to retrieve and hide the parameters passed as query string.


* [sessionService](#module_sessionService)
    * [`.loadAndHideParameters()`](#module_sessionService.loadAndHideParameters)
    * [`._loadParameters()`](#module_sessionService._loadParameters)
    * [`._hideParameters()`](#module_sessionService._hideParameters)
    * [`.get()`](#module_sessionService.get) ⇒ <code>object</code>

<a name="module_sessionService.loadAndHideParameters"></a>

### `sessionService.loadAndHideParameters()`
Load parameters from the query string inside sessionService
and remove them from the query string.

**Kind**: static method of [<code>sessionService</code>](#module_sessionService)  
<a name="module_sessionService._loadParameters"></a>

### `sessionService._loadParameters()`
Load the session parameters from query string into the session object

**Kind**: static method of [<code>sessionService</code>](#module_sessionService)  
<a name="module_sessionService._hideParameters"></a>

### `sessionService._hideParameters()`
Replace the current URL without the session parameters

**Kind**: static method of [<code>sessionService</code>](#module_sessionService)  
<a name="module_sessionService.get"></a>

### `sessionService.get()` ⇒ <code>object</code>
Returns the current session object with all server parameters inside

**Kind**: static method of [<code>sessionService</code>](#module_sessionService)  
**Returns**: <code>object</code> - session  
<a name="EventEmitter"></a>

## EventEmitter
Class EventEmitter for event-driven architecture
Similar to the one provided by NodeJS

**Kind**: global class  

* [EventEmitter](#EventEmitter)
    * [`new EventEmitter()`](#new_EventEmitter_new)
    * [`eventEmitter.addListener(eventName, listener)`](#EventEmitter+addListener) ⇒ <code>boolean</code>
    * [`eventEmitter.removeListener(eventName, listener)`](#EventEmitter+removeListener) ⇒ <code>boolean</code>
    * [`eventEmitter.emit(eventName)`](#EventEmitter+emit) ⇒ <code>boolean</code>

<a name="new_EventEmitter_new"></a>

### `new EventEmitter()`
Constructor

<a name="EventEmitter+addListener"></a>

### `eventEmitter.addListener(eventName, listener)` ⇒ <code>boolean</code>
Adds the listener function to the end of the listeners array for the event named eventName

**Kind**: instance method of [<code>EventEmitter</code>](#EventEmitter)  
**Returns**: <code>boolean</code> - - Returns a reference to the EventEmitter, so that calls can be chained.  
**Params**

- eventName <code>string</code> - the name of the event
- listener <code>function</code> - the callback function

<a name="EventEmitter+removeListener"></a>

### `eventEmitter.removeListener(eventName, listener)` ⇒ <code>boolean</code>
Removes the specified listener from the listener array for the event named eventName

**Kind**: instance method of [<code>EventEmitter</code>](#EventEmitter)  
**Returns**: <code>boolean</code> - - Returns a reference to the EventEmitter, so that calls can be chained.  
**Params**

- eventName <code>string</code> - the name of the event
- listener <code>function</code> - the callback function

<a name="EventEmitter+emit"></a>

### `eventEmitter.emit(eventName)` ⇒ <code>boolean</code>
Synchronously calls each of the listeners registered for the event named eventName,
in the order they were registered, passing the supplied arguments to each

**Kind**: instance method of [<code>EventEmitter</code>](#EventEmitter)  
**Returns**: <code>boolean</code> - - Returns true if the event had listeners, false otherwise.  
**Params**

- eventName <code>string</code>
            - .args <code>any</code> - arguments to be passed to the listeners

<a name="Loader"></a>

## Loader ⇐ [<code>Observable</code>](#Observable)
Network loader, count current requests, handle errors, make ajax requests

**Kind**: global class  
**Extends**: [<code>Observable</code>](#Observable)  

* [Loader](#Loader) ⇐ [<code>Observable</code>](#Observable)
    * [`new Loader()`](#new_Loader_new)
    * [`loader.watchPromise(promise)`](#Loader+watchPromise)
    * [`loader._promiseSuccess(data)`](#Loader+_promiseSuccess) ⇒ <code>Any</code>
    * [`loader._promiseError(err)`](#Loader+_promiseError)
    * [`loader.post(url, body)`](#Loader+post) ⇒ <code>object</code>
    * [`loader.observe(callback)`](#Observable+observe)
    * [`loader.unobserve(callback)`](#Observable+unobserve)
    * [`loader.notify()`](#Observable+notify)
    * [`loader.bubbleTo(observer)`](#Observable+bubbleTo)

<a name="new_Loader_new"></a>

### `new Loader()`
Initialize `activePromises` to 0

<a name="Loader+watchPromise"></a>

### `loader.watchPromise(promise)`
Register a promise and increase `activePromises` by 1,
on promise ends, decrease by 1.

**Kind**: instance method of [<code>Loader</code>](#Loader)  
**Params**

- promise <code>Promise</code>

<a name="Loader+_promiseSuccess"></a>

### `loader._promiseSuccess(data)` ⇒ <code>Any</code>
Private method. increase `activePromises` by 1

**Kind**: instance method of [<code>Loader</code>](#Loader)  
**Returns**: <code>Any</code> - data  
**Params**

- data <code>Any</code> - passthough

<a name="Loader+_promiseError"></a>

### `loader._promiseError(err)`
Private method. decrease `activePromises` by 1

**Kind**: instance method of [<code>Loader</code>](#Loader)  
**Throw**: <code>Any</code> err  
**Params**

- err <code>Any</code> - passthough

<a name="Loader+post"></a>

### `loader.post(url, body)` ⇒ <code>object</code>
Do a POST request with `body` as JSON content.

**Kind**: instance method of [<code>Loader</code>](#Loader)  
**Returns**: <code>object</code> - result, ok, status  
**Params**

- url <code>string</code> - any URL part
- body <code>object</code> - content

**Example**  
```js
import {Loader} from '/js/src/index.js';
const loader = new Loader();
const {result, ok} = await loader.post('/api/foo', {bar: 123, baz: 456})
```
<a name="Observable+observe"></a>

### `loader.observe(callback)`
Add an observer

**Kind**: instance method of [<code>Loader</code>](#Loader)  
**Params**

- callback <code>function</code> - will be called for each notification

<a name="Observable+unobserve"></a>

### `loader.unobserve(callback)`
Remove an observer

**Kind**: instance method of [<code>Loader</code>](#Loader)  
**Params**

- callback <code>function</code> - the callback to remove

<a name="Observable+notify"></a>

### `loader.notify()`
Notify every observer that something changed

**Kind**: instance method of [<code>Loader</code>](#Loader)  
<a name="Observable+bubbleTo"></a>

### `loader.bubbleTo(observer)`
All notifications from `this` will be notified to `observer`.

**Kind**: instance method of [<code>Loader</code>](#Loader)  
**Params**

- observer [<code>Observable</code>](#Observable) - the observable object which will notify its observers

**Example**  
```js
const model1 = new Observable();
const model2 = new Observable();
const model3 = new Observable();
model1.bubbleTo(model2);
model2.bubbleTo(model3);
model1.notify(); // model1, model2 and model3 notified
```
<a name="Observable"></a>

## Observable
Simple Observable class to notify others listening for changes

**Kind**: global class  

* [Observable](#Observable)
    * [`new Observable()`](#new_Observable_new)
    * [`observable.observe(callback)`](#Observable+observe)
    * [`observable.unobserve(callback)`](#Observable+unobserve)
    * [`observable.notify()`](#Observable+notify)
    * [`observable.bubbleTo(observer)`](#Observable+bubbleTo)

<a name="new_Observable_new"></a>

### `new Observable()`
Initialize with an empty array of observers

**Example**  
```js
const model = new Observable();
model.observe(() => console.log('model has changed'))
model.notify(); // callback called
```
<a name="Observable+observe"></a>

### `observable.observe(callback)`
Add an observer

**Kind**: instance method of [<code>Observable</code>](#Observable)  
**Params**

- callback <code>function</code> - will be called for each notification

<a name="Observable+unobserve"></a>

### `observable.unobserve(callback)`
Remove an observer

**Kind**: instance method of [<code>Observable</code>](#Observable)  
**Params**

- callback <code>function</code> - the callback to remove

<a name="Observable+notify"></a>

### `observable.notify()`
Notify every observer that something changed

**Kind**: instance method of [<code>Observable</code>](#Observable)  
<a name="Observable+bubbleTo"></a>

### `observable.bubbleTo(observer)`
All notifications from `this` will be notified to `observer`.

**Kind**: instance method of [<code>Observable</code>](#Observable)  
**Params**

- observer [<code>Observable</code>](#Observable) - the observable object which will notify its observers

**Example**  
```js
const model1 = new Observable();
const model2 = new Observable();
const model3 = new Observable();
model1.bubbleTo(model2);
model2.bubbleTo(model3);
model1.notify(); // model1, model2 and model3 notified
```
<a name="QueryRouter"></a>

## QueryRouter ⇐ [<code>Observable</code>](#Observable)
Router handle query history for Single Page Application (SPA)
It notifies when route change and it allows to push a new route.
Search parameters can be read directly via `params`, for example:
'?page=list' will give `.params ==== {page: 'list'}`.

**Kind**: global class  
**Extends**: [<code>Observable</code>](#Observable)  
**Properties**

- params <code>object</code> - Keys/values of search parameters  


* [QueryRouter](#QueryRouter) ⇐ [<code>Observable</code>](#Observable)
    * [`new QueryRouter()`](#new_QueryRouter_new)
    * [`queryRouter._attachEvents()`](#QueryRouter+_attachEvents)
    * [`queryRouter._handleLocationChange()`](#QueryRouter+_handleLocationChange)
    * [`queryRouter.handleLinkEvent(e)`](#QueryRouter+handleLinkEvent)
    * [`queryRouter.getUrl()`](#QueryRouter+getUrl) ⇒ <code>URL</code>
    * [`queryRouter.go(uri, replace, silent)`](#QueryRouter+go)
    * [`queryRouter.observe(callback)`](#Observable+observe)
    * [`queryRouter.unobserve(callback)`](#Observable+unobserve)
    * [`queryRouter.notify()`](#Observable+notify)
    * [`queryRouter.bubbleTo(observer)`](#Observable+bubbleTo)

<a name="new_QueryRouter_new"></a>

### `new QueryRouter()`
Constructor

**Example**  
```js
import {Observable, QueryRouter} from '/js/src/index.js';

export default class Model extends Observable {
  constructor() {
    super();

    // Setup router
    this.router = new QueryRouter();
    this.router.observe(this.handleLocationChange.bind(this));
    this.handleLocationChange(); // Init first page
  }

  handleLocationChange() {
    switch (this.router.params.page) {
      case 'list':
        // call some ajax to load list
        break;
      case 'item':
        // call some ajax to load item this.router.params.id
        break;
      default:
        // default route, replace the current one not handled
        this.router.go('?page=list', true);
        break;
    }
  }
}

import {h, switchCase} from '/js/src/index.js';

export default (model) => h('div', [
  menu(model),
  content(model),
]);

const content = (model) => h('div', [
  switchCase(model.router.params.page, {
    list: () => h('p', 'print list'),
    item: () => h('p', `print item ${model.router.params.id}`),
  })()
]);

const menu = (model) => h('ul', [
  h('a', {onclick: (e) => model.router.handleLinkEvent(e), href: '?page=list'}, 'List'),
  h('a', {onclick: (e) => model.router.handleLinkEvent(e), href: '?page=item&id=1'}, 'Item 1'),
  h('a', {onclick: (e) => model.router.handleLinkEvent(e), href: '?page=item&id=2'}, 'Item 2'),
  h('a', {onclick: (e) => model.router.handleLinkEvent(e), href: '?page=item&id=3'}, 'Item 3'),
]);
```
<a name="QueryRouter+_attachEvents"></a>

### `queryRouter._attachEvents()`
Listen to all history and location events and notify on change

**Kind**: instance method of [<code>QueryRouter</code>](#QueryRouter)  
<a name="QueryRouter+_handleLocationChange"></a>

### `queryRouter._handleLocationChange()`
Notify observers that the location has changed

**Kind**: instance method of [<code>QueryRouter</code>](#QueryRouter)  
<a name="QueryRouter+handleLinkEvent"></a>

### `queryRouter.handleLinkEvent(e)`
Handle internal SPA link clicks and new tab actions (CTRL + click on links).

**Kind**: instance method of [<code>QueryRouter</code>](#QueryRouter)  
**Params**

- e <code>object</code> - DOM event

<a name="QueryRouter+getUrl"></a>

### `queryRouter.getUrl()` ⇒ <code>URL</code>
Get the current URL object containing searchParams, pathname, etc.

**Kind**: instance method of [<code>QueryRouter</code>](#QueryRouter)  
<a name="QueryRouter+go"></a>

### `queryRouter.go(uri, replace, silent)`
Go to the specified `uri`. If `replace` is set, the current history point is replaced.

**Kind**: instance method of [<code>QueryRouter</code>](#QueryRouter)  
**Params**

- uri <code>string</code> - e.g. ?foo=bar
- replace <code>boolean</code> - true to replace history
- silent <code>boolean</code> - change URL bar and history, but do not notify observers

<a name="Observable+observe"></a>

### `queryRouter.observe(callback)`
Add an observer

**Kind**: instance method of [<code>QueryRouter</code>](#QueryRouter)  
**Params**

- callback <code>function</code> - will be called for each notification

<a name="Observable+unobserve"></a>

### `queryRouter.unobserve(callback)`
Remove an observer

**Kind**: instance method of [<code>QueryRouter</code>](#QueryRouter)  
**Params**

- callback <code>function</code> - the callback to remove

<a name="Observable+notify"></a>

### `queryRouter.notify()`
Notify every observer that something changed

**Kind**: instance method of [<code>QueryRouter</code>](#QueryRouter)  
<a name="Observable+bubbleTo"></a>

### `queryRouter.bubbleTo(observer)`
All notifications from `this` will be notified to `observer`.

**Kind**: instance method of [<code>QueryRouter</code>](#QueryRouter)  
**Params**

- observer [<code>Observable</code>](#Observable) - the observable object which will notify its observers

**Example**  
```js
const model1 = new Observable();
const model2 = new Observable();
const model3 = new Observable();
model1.bubbleTo(model2);
model2.bubbleTo(model3);
model1.notify(); // model1, model2 and model3 notified
```
<a name="RemoteData"></a>

## RemoteData
RemoteData is tagged union type representing remote data loaded via network.
http://blog.jenkster.com/2016/06/how-elm-slays-a-ui-antipattern.html

**Kind**: global class  

* [RemoteData](#RemoteData)
    * [`new RemoteData(kind, payload)`](#new_RemoteData_new)
    * [`remoteData.match(clauses)`](#RemoteData+match) ⇒ <code>Any</code>
    * [`remoteData.isNotAsked()`](#RemoteData+isNotAsked) ⇒ <code>boolean</code>
    * [`remoteData.isLoading()`](#RemoteData+isLoading) ⇒ <code>boolean</code>
    * [`remoteData.isSuccess()`](#RemoteData+isSuccess) ⇒ <code>boolean</code>
    * [`remoteData.isFailure()`](#RemoteData+isFailure) ⇒ <code>boolean</code>
    * [`RemoteData.NotAsked()`](#RemoteData.NotAsked) ⇒ [<code>RemoteData</code>](#RemoteData)
    * [`RemoteData.Loading()`](#RemoteData.Loading) ⇒ [<code>RemoteData</code>](#RemoteData)
    * [`RemoteData.Success(payload)`](#RemoteData.Success) ⇒ [<code>RemoteData</code>](#RemoteData)
    * [`RemoteData.Failure(payload)`](#RemoteData.Failure) ⇒ [<code>RemoteData</code>](#RemoteData)

<a name="new_RemoteData_new"></a>

### `new RemoteData(kind, payload)`
Private constructor, use factories.

**Params**

- kind <code>string</code>
- payload <code>Any</code>

**Example**  
```js
import {RemoteData} from '/js/src/index.js';
var item = RemoteData.NotAsked();
item.isNotAsked() === true
item.isLoading() === false
item.match({
  NotAsked: () => 1,
  Loading: () => 2,
  Success: (data) => 3,
  Failure: (error) => 4,
}) === 1
```
<a name="RemoteData+match"></a>

### `remoteData.match(clauses)` ⇒ <code>Any</code>
Find the matching kind in the keys of `clauses` and returns
the computed value of the corresponding function.
An error is thrown if all clauses are not listed.

**Kind**: instance method of [<code>RemoteData</code>](#RemoteData)  
**Returns**: <code>Any</code> - result of the function associated to clause  
**Params**

- clauses <code>Object.&lt;string, function()&gt;</code>

**Example**  
```js
import {RemoteData} from '/js/src/index.js';
var item = RemoteData.NotAsked();
item.match({
  NotAsked: () => 1,
  Loading: () => 2,
  Success: (data) => 3,
  Failure: (error) => 4,
}) === 1
```
<a name="RemoteData+isNotAsked"></a>

### `remoteData.isNotAsked()` ⇒ <code>boolean</code>
Test is current kind is a `NotAsked`

**Kind**: instance method of [<code>RemoteData</code>](#RemoteData)  
**Example**  
```js
import {RemoteData} from '/js/src/index.js';
var item = RemoteData.NotAsked();
item.isNotAsked() === true
item.isLoading() === false
```
<a name="RemoteData+isLoading"></a>

### `remoteData.isLoading()` ⇒ <code>boolean</code>
Test is current kind is a `Loading`

**Kind**: instance method of [<code>RemoteData</code>](#RemoteData)  
**Example**  
```js
import {RemoteData} from '/js/src/index.js';
var item = RemoteData.NotAsked();
item.isNotAsked() === true
item.isLoading() === false
```
<a name="RemoteData+isSuccess"></a>

### `remoteData.isSuccess()` ⇒ <code>boolean</code>
Test is current kind is a `Success`

**Kind**: instance method of [<code>RemoteData</code>](#RemoteData)  
<a name="RemoteData+isFailure"></a>

### `remoteData.isFailure()` ⇒ <code>boolean</code>
Test is current kind is a `Failure`

**Kind**: instance method of [<code>RemoteData</code>](#RemoteData)  
<a name="RemoteData.NotAsked"></a>

### `RemoteData.NotAsked()` ⇒ [<code>RemoteData</code>](#RemoteData)
Factory to create new 'NotAsked' RemoteData kind

**Kind**: static method of [<code>RemoteData</code>](#RemoteData)  
<a name="RemoteData.Loading"></a>

### `RemoteData.Loading()` ⇒ [<code>RemoteData</code>](#RemoteData)
Factory to create new 'Loading' RemoteData kind

**Kind**: static method of [<code>RemoteData</code>](#RemoteData)  
<a name="RemoteData.Success"></a>

### `RemoteData.Success(payload)` ⇒ [<code>RemoteData</code>](#RemoteData)
Factory to create new 'Success' RemoteData kind

**Kind**: static method of [<code>RemoteData</code>](#RemoteData)  
**Params**

- payload <code>Any</code>

<a name="RemoteData.Failure"></a>

### `RemoteData.Failure(payload)` ⇒ [<code>RemoteData</code>](#RemoteData)
Factory to create new 'Failure' RemoteData kind

**Kind**: static method of [<code>RemoteData</code>](#RemoteData)  
**Params**

- payload <code>Any</code>

<a name="WebSocketClient"></a>

## WebSocketClient ⇐ [<code>EventEmitter</code>](#EventEmitter)
Encapsulate WebSocket and provides the endpoint, filtering stream and authentification status.
It also handles session token by adding it in the handshake request
from sessionService transparently for developer. Authentification is done when `authed` event
is emitted.

**Kind**: global class  
**Extends**: [<code>EventEmitter</code>](#EventEmitter)  
**Emits**: [<code>open</code>](#WebSocketClient+event_open), [<code>error</code>](#WebSocketClient+event_error), [<code>close</code>](#WebSocketClient+event_close), <code>WebSocketClient#event:message</code>, [<code>authed</code>](#WebSocketClient+event_authed), [<code>token</code>](#WebSocketClient+event_token), [<code>command</code>](#WebSocketClient+event_command)  
**Author**: Adam Wegrzynek <adam.wegrzynek@cern.ch>  
**Author**: Vladimir Kosmala <vladimir.kosmala@cern.ch>  
**Properties**

- authed <code>boolean</code> - If server authed connexion and commands can be made  


* [WebSocketClient](#WebSocketClient) ⇐ [<code>EventEmitter</code>](#EventEmitter)
    * [`new WebSocketClient()`](#new_WebSocketClient_new)
    * [`webSocketClient._connect()`](#WebSocketClient+_connect)
    * [`webSocketClient._handleMessage(e)`](#WebSocketClient+_handleMessage)
    * [`webSocketClient.sendMessage(message)`](#WebSocketClient+sendMessage)
    * [`webSocketClient.setFilter(filter)`](#WebSocketClient+setFilter)
    * [`webSocketClient.addListener(eventName, listener)`](#EventEmitter+addListener) ⇒ <code>boolean</code>
    * [`webSocketClient.removeListener(eventName, listener)`](#EventEmitter+removeListener) ⇒ <code>boolean</code>
    * [`webSocketClient.emit(eventName)`](#EventEmitter+emit) ⇒ <code>boolean</code>
    * [`"open"`](#WebSocketClient+event_open)
    * [`"error"`](#WebSocketClient+event_error)
    * [`"close"`](#WebSocketClient+event_close)
    * [`"authed"`](#WebSocketClient+event_authed)
    * [`"token"`](#WebSocketClient+event_token)
    * [`"command"`](#WebSocketClient+event_command)

<a name="new_WebSocketClient_new"></a>

### `new WebSocketClient()`
Create a connection to the server

**Example**  
```js
import {WebSocketClient} from '/js/src/index.js';
const ws = new WebSocketClient();
ws.addListener('authed', () => {
  console.log('ready, lets send a message');
  ws.sendMessage({command: 'custom-client-event-name', payload: 123});
});
ws.addListener('command', (message) => {
  if (message.command === 'custom-server-event-name') {
    // use message.payload
  }
});
```
<a name="WebSocketClient+_connect"></a>

### `webSocketClient._connect()`
Private. Create an instance of WebSocket and binds events

**Kind**: instance method of [<code>WebSocketClient</code>](#WebSocketClient)  
<a name="WebSocketClient+_handleMessage"></a>

### `webSocketClient._handleMessage(e)`
Private. Handle non-user messages: authentification, token refresh, errors

**Kind**: instance method of [<code>WebSocketClient</code>](#WebSocketClient)  
**Params**

- e <code>MessageEvent</code> - Event message received by websocket

<a name="WebSocketClient+sendMessage"></a>

### `webSocketClient.sendMessage(message)`
Send plain object to server, it must implement the Message interface (command field),
you must also wait the connection to be authentificated (authed property and event).

**Kind**: instance method of [<code>WebSocketClient</code>](#WebSocketClient)  
**Params**

- message <code>object</code>

<a name="WebSocketClient+setFilter"></a>

### `webSocketClient.setFilter(filter)`
Send the stream filter to server

**Kind**: instance method of [<code>WebSocketClient</code>](#WebSocketClient)  
**Params**

- filter <code>function</code>

<a name="EventEmitter+addListener"></a>

### `webSocketClient.addListener(eventName, listener)` ⇒ <code>boolean</code>
Adds the listener function to the end of the listeners array for the event named eventName

**Kind**: instance method of [<code>WebSocketClient</code>](#WebSocketClient)  
**Returns**: <code>boolean</code> - - Returns a reference to the EventEmitter, so that calls can be chained.  
**Params**

- eventName <code>string</code> - the name of the event
- listener <code>function</code> - the callback function

<a name="EventEmitter+removeListener"></a>

### `webSocketClient.removeListener(eventName, listener)` ⇒ <code>boolean</code>
Removes the specified listener from the listener array for the event named eventName

**Kind**: instance method of [<code>WebSocketClient</code>](#WebSocketClient)  
**Returns**: <code>boolean</code> - - Returns a reference to the EventEmitter, so that calls can be chained.  
**Params**

- eventName <code>string</code> - the name of the event
- listener <code>function</code> - the callback function

<a name="EventEmitter+emit"></a>

### `webSocketClient.emit(eventName)` ⇒ <code>boolean</code>
Synchronously calls each of the listeners registered for the event named eventName,
in the order they were registered, passing the supplied arguments to each

**Kind**: instance method of [<code>WebSocketClient</code>](#WebSocketClient)  
**Returns**: <code>boolean</code> - - Returns true if the event had listeners, false otherwise.  
**Params**

- eventName <code>string</code>
            - .args <code>any</code> - arguments to be passed to the listeners

<a name="WebSocketClient+event_open"></a>

### `"open"`
`open` event.

**Kind**: event emitted by [<code>WebSocketClient</code>](#WebSocketClient)  
<a name="WebSocketClient+event_error"></a>

### `"error"`
`error` event.
See `close` event for more details on why.

**Kind**: event emitted by [<code>WebSocketClient</code>](#WebSocketClient)  
**Properties**

- code <code>number</code>  
- message <code>string</code>  
- payload <code>object</code>  

<a name="WebSocketClient+event_close"></a>

### `"close"`
`close` event.
https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent

**Kind**: event emitted by [<code>WebSocketClient</code>](#WebSocketClient)  
**Properties**

- reason <code>string</code>  
- code <code>number</code>  

<a name="WebSocketClient+event_authed"></a>

### `"authed"`
`authed` event when WSClient is authentificated by server
and can process incoming requests.

**Kind**: event emitted by [<code>WebSocketClient</code>](#WebSocketClient)  
<a name="WebSocketClient+event_token"></a>

### `"token"`
`token` event when new auth token has been made
sessionService is also refreshed.

**Kind**: event emitted by [<code>WebSocketClient</code>](#WebSocketClient)  
<a name="WebSocketClient+event_command"></a>

### `"command"`
`command` event when a custom command is received.

**Kind**: event emitted by [<code>WebSocketClient</code>](#WebSocketClient)  
**Properties**

- command <code>string</code>  
- payload <code>object</code>  

<a name="tryCompatibility"></a>

## `tryCompatibility(stringCode)`
Try to execute a string code with eval, on failure redirect to the compatibility page.

**Kind**: global function  
**Params**

- stringCode <code>string</code> - source code as a string

<a name="fetchClient"></a>

## `fetchClient(URL)` ⇒ <code>object</code>
Extends the fetch() function by adding the session token in the request
by taking it from sessionService transparently for developer.
See https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API

**Kind**: global function  
**Returns**: <code>object</code> - options - method, etc.  
**Params**

- URL <code>string</code>

**Example**  
```js
import {fetchClient} from '/js/src/index.js';
const options = {
  method: 'POST',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({...})
};
const response = await fetchClient('/api/lock', options);
```
<a name="switchCase"></a>

## `switchCase(caseName, cases, defaultCaseValue)` ⇒ <code>Any</code>
Functional switch case

**Kind**: global function  
**Returns**: <code>Any</code> - the corresponding caseValue of the caseName  
**Params**

- caseName <code>string</code>
- cases <code>Object.&lt;string, Any&gt;</code>
- defaultCaseValue <code>Any</code>

**Example**  
```js
import {h, switchCase} from '/js/src/index.js';
default export (model) => h('div', [
  h('h1', 'Hello'),
  switchCase(model.page, {
    list: () => h('p', 'print list'),
    item: () => h('p', 'print item'),
    form: () => h('p', 'print form'),
  }, h('p', 'print default'))();
]);
```
