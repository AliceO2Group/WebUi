# Frontend - Hyperscript and vnode

Web page view is described by the browser's DOM tree and can be manipulated using [DOM API](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model). It can also be represented using HTML in a static and declarative way. Hyperscript is a similar representation but it is dynamic and uses Javascript function to represent a DOM element with its attributes and children.
Here are the two equivalent representations, HTML and Hyperscript respectively:

```html
<h1 class="title">Hello</h1>
```

```js
h('h1', {class: 'title'}, 'Hello')
```

The Hyperscript function produces a virtual-node (vnode). As it is written in JavaScript it supports variables, conditions, etc. just like any other JavaScript program. A vnode is an abstract object representing a DOM element. It can be directly translated into DOM element using a render engine.

Typically, vnodes are then recreated every render cycle, which normally occurs in response to event handlers (clicks) or to data changes (Ajax response). The template enfine diffs a vnode tree against its previous version and only modifies DOM elements in spots where there are changes.

It may seem wasteful to recreate vnodes so frequently, but as it turns out, modern Javascript engines can create hundreds of thousands of objects in less than a millisecond. On the other hand, modifying the whole DOM is more expensive than creating vnodes.

In the end rendering a web page is simple as:

```js
let virtualNode = h('h1', {class: 'title'}, 'World');
render(document.body, virtualNode);

// equivalent HTML:
// <h1 class="title">Hello</h1>
```

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
