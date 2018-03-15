# Guide - Hyperscript and vnode

Web page view is described by the browser's DOM tree and can be manipulated using [DOM API](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model). It can also be represented using HTML in a static and declarative way. Hyperscript is a similar representation but it is dynamic and uses Javascript function to represent a DOM element with its attributes and children.
Here are the two equivalent representations, HTML and Hyperscript respectively:

```html
<h1 class="title">Hello</h1>
```

```js
h('h1', {class: 'title'}, 'Hello')
```

The Hyperscript function produces a virtual-node (vnode). As it is written in JavaScript it supports variables, conditions, etc. just like any other JavaScript program.

A vnode is an abstract object representing a DOM element. It can be directly translated into DOM element using a render engine. The render engine is smart enough to compare current element state and apply necessary changes instead of replacing the whole element. Under the hood, the engine uses DOM API though `createElement`, `setAttribute`, `appendChild` to manipulate the tree but this is not visible to the user.

Let's assume that the `body` of a page has a simple element: `<h1 class="title">Hello</h1>`. These two following code snippets will produce the same result:
```js
let stringNode = '<h1 class="title">World</h1>';
document.body.innerHTML = stringNode; // replaces whole body content with h1 element
```

```js
let virtualNode = h('h1', {class: 'title'}, 'World');
render(document.body, virtualNode); // updates body - changes the text only
```

In the first example the DOM of body is  *replaced* with a new version. In the latter one, the DOM is just  *updated*. This difference is important as during the update internal states of DOM elements (such as: scroll position, input value, checkbox value, etc.) are preserved.

Summarising, Hyperscript merges features of HTML (declarative) and DOM API (updates) as defined in the table below.

|              | DOM API | HTML | Hyperscript |
| ------------ | --------|------|------------ |
| Declarative  | ✗       | ✓    | ✓           |
| Dynamic      | ✓       | ✗    | ✓           |


Note: As vnodes can be modified by the template engine you must not reuse them. Instead, create a new instance for each view redraw.

See [Components](components.md) guide to learn more about re-usability and maintenance.
See [API Reference for JS](../reference/frontend-js.md) to get the `h()` function prototype.


# Keys in hyperscript

When manipulating a list of items with Hyperscript, the `key` attribute helps the engine to identify the element. This key should be constant and unique like DB primary key. Do not use array indexes as they may chage (eg. when you sort the array).
```js
function videoGallery(videos) {
  return videos.map((video) => {
    return h('video', {src: video.src, key: video.src});
  });
}
```

### JSX disclaimer

This concept is used by many recent libraries and frameworks like AngularJS, ReactJS, MithrilJS, Hyperapp. ou In addition to Hyperscript they usually allow to use JSX, which is a new syntax producing vnodes without using `h()`. We dropped the idea of using JSX as it introduces additional dependency on BabelJS.
