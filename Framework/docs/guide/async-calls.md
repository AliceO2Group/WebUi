# Frontend - Async calls (Ajax)

Javascript deals well with asynchronous calls like network requests. Historically, a reply was delivered though callback functions:

```js
request(arguments, function callback(error, result) {
  // do something with result
});
```

But this may lead to spaghetti code therefore Promises were introduced:

```js
var resultPromise = request(arguments);
resultPromise.then(function callback(result) {
  // Promise fulfilled, do something with result
});
resultPromise.catch(function callback(error) {
  // handle exceptions
});
```

The `await` keyword pauses asynchronous function until Promise is fulfilled.

```js
try {
  var resultPromise = await request(arguments);
} catch (error) {

}
```

The promises can be integrated in the model in order to handle HTTP requests. This is possible through `fetch` method:
```js
class Model extends Observable {
  async fetchImages() {
    const response = await fetchClient('/api/images').catch((error) => this.handleErrors(error));
    const images = await response.json();
    this.setImages(images);
  }

  setImages(images) {
    this.images = images;
    this.notify();
  }

  handleErrors(error) {
    this.error = error;
    this.notify();
  }
}
```

The `fetchClient` method is part of the framework, creates an HTTP request and returns a promise. Either `await` keyword or `then` method can be used to handle fulfilled promise.

Error can be handled within a `try`,  `catch` blocks or using `catch` method of the promise object. It is a recommended to use a generic error handler.
`fetchImages` also returns a promise because it has `async` keyword.

Because the web interface is not blocked when the method is paused with `await` keyword, the user can call it many times leading to unnecessary network usage. Repeated requests to the same resource can be avoid by adding a new state in the model, `fetchingImages` boolean in the following example does this:

```js
class Model extends Observable {
  async fetchImages() {
    if (this.fetchingImages) {
      return;
    }

    this.fetchingImages = true;
    this.notify();

    const response = await fetchClient('/api/images').catch((error) => this.handleErrors(error));
    const images = await response.json();
    this.setImages(images);

    this.fetchingImages = false;
    this.notify();
  }

  setImages(images) {
    this.images = images;
    this.notify();
  }

  handleErrors(error) {
    this.error = error;
    this.notify();
  }
}

function button(model) {
  const action = () => model.fetchImages();
  const disabled = model.fetchingImages;

  // clicks are not handled when a button is 'disabled'
  return h('button', {onclick: action, disabled: disabled}, 'Fetch images')
}
```

## fetchClient

fetchClient inherit from native [fetch](https://developer.mozilla.org/fr/docs/Web/API/Fetch_API/Using_Fetch) and automatically add a token to the request. All options from `fetch` can be used:

```js
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

## RemoteData

As a utility, the framework provides RemoteData type to encapsulate the different states of a data coming from the server. It may be used to deal with all possibilities like: are data asked? are they loaded yet? what if an error happen?

```js
import {RemoteData} from '/js/src/index.js';

var item = RemoteData.NotAsked();
item.isNotAsked() === true
item.isSuccess() === false

var item = RemoteData.Success({...});
item.isNotAsked() === false
item.isSuccess() === true

item.match({
  NotAsked: () => ...,
  Loading: () => ...,
  Success: (data) => ...,
  Failure: (error) => ...,
});
```

This pattern uses tagged union type and is explained here: http://blog.jenkster.com/2016/06/how-elm-slays-a-ui-antipattern.html it is also comparable to solving the "accessing data from null pointer" problem.

## Loader

The `Loader` model is an other utility to watch and simplify requests made with `fetchClient`, his goal is to be a "network manager".

```js
import {Loader} from '/js/src/index.js';

const loader = new Loader();
const {result, ok} = await loader.post('/api/foo', {bar: 123, baz: 456})
```

The syntax is much more compact than using directly fetchClient.

- `result` is the JSON decoded
- `ok` is true on 2XX response only
- `loader.active` is true if there is one or more requests working (used for a global spinner eventually)

In case of errors, the user can select between a prebuilt error message (which includes the `status` and `statusText`) by passing a third argument to 
the `get(url, query, originalMessage)` or `post(url, options, originalMessage)` methods

e.g.
For a `404 error Key not found` the messages will be sent as below:
* `originalMessage === true` the error message will be `Key not found`
* `originalMessage === false` the error message will be `Request to server failed (404 Not Found): Key not found`


