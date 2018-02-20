# Guide - Async calls (ajax)

Javascript deals well with asynchronous calls like network requests. Historically it was implemented though callback functions like this.

```js
request(arguments, function callback(error, result) {
  // do something with result
});
```

But this leads to spaghetti code and a more formal way was created: Promises.

```js
var resultPromise = request(arguments);
resultPromise.then(function callback(result) {

});
resultPromise.catch(function callback(error) {

});
```

Notice that the callbacks are now binded to an object, the promise.

Then Javascript went full asynchronous is the langage itself with await.

```js
try {
  var resultPromise = await request(arguments);
} catch (error) {

}
```

We can integrate promises with an observable model:

```js
class Model extends Observable {
  async fetchImages() {
    const response = await fetch('/api/images').catch((error) => this.handleErrors(error));
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

The method fetchImages will create a network request and return a promise. When the promise is finished it will either call the success method or a generic handler. The `then` method can be replaced with the `await` keyword so the function pauses while waiting for ans answer. You can also catch the error with a `try catch` or by using the `catch` method of the promise object.

Because you often have a lot of requests, it is a efficient to have a generic handler for errors which will for example print an error message to the user.

fetchImages also returns a promise, the caller could use it to know that the call is finished or not and avoid calling again while the request is still in progress.

Of course we call `notify()` each time the model changes, for both `then` and `catch` callbacks.

Here is a practical example where we don't want the user to request again when a request has been made:

```js
class Model extends Observable {
  async fetchImages() {
    if (this.fetchingImages) {
      return;
    }

    this.fetchingImages = true;
    this.notify();

    const response = await fetch('/api/images').catch((error) => this.handleErrors(error));
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
  const action = model.fetchingImages ? e => model.fetchImages() : null;
  const className = model.fetchingImages ? 'disabled' : '';
  return h('button', {onclick: action, class: className}, 'Fetch images')
}
```

We used the method `finally` of the promise to clean up the request.

