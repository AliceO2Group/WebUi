# Hyperscript and vnode

Web views are described by the DOM tree of the browser and can be manipulated with the [DOM API](https://www.google.ch/search?q=dom+api). This can be represented using HMTL usually, in a static and declarative way. Hyperscript is the same representation but dynamic and declarative using Javascript. Hyperscript is a non-standard function to represente a DOM element with its attributes and children. Here are the two equivalent representations:

```html
<h1 class="title">Hello</h1>
```

```js
h('h1', {class: 'title'}, 'Hello')
```

The first one is a HTML which is really a string and the second is a hyperscript call producing a virtual-node. Because it is written in pure Javascript, hyperscript can handle variable, conditions, etc. just like you would in any program.

A virtual-node (vnode), is an object representing the DOM element dependent of an engine (a Difference Algorithm) to manipulate the DOM according to the vnode. With HTML we just use `innerHTML` property of a DOM element insteed of the engine. Inside the engine (render function), DOM is manipulated though `createElement`, `setAttribute`, `appendChild`, etc. but you will not see it, the engine takes care of it for you.

```js
let stringNode = '<h1 class="title">Hello</h1>';
document.body.innerHTML = stringNode;
```

```js
let virtualNode = h('h1', {class: 'title'}, 'Hello');
render(document.body, virtualNode);
```

The result of both code will produce the same result, but in the first one the current DOM tree of body is *replaced*, in the second one it is *updated*. This difference is important if you consider that maybe the user had selected the `Hello` text produced, it is replaced so the cursor is lost, not on the second option. Internal states of DOM elements can be: scroll position, input value, etc.

Hyperscript allows in the end to have the positive feature of HMTL (declarative) and DOM API (updates).

|              | DOM API | HTML | Hyperscript |
| ------------ | ---------------------------- |
| Declarative  | ✗       | ✓    | ✓           |
| Updates      | ✓       | ✗    | ✓           |

Being declarative improves maintenance of an application to avoid spaghetti code, and provides all functional features for free (tests, reusability).

See [Components](components.md) guide to learn more about reusability and maintenance.
See [API Reference for JS](../reference/frontend-js.md) to get the `h()` function prototype.

### To go further

This concept was introduced by ReactJS like libraries (MithrilJS, Hyperapp, etc.) And you can find some tools which allows you to use JSX, which is a new syntax producing vnodes without using `h()` because of a compiler doing it for you. We will not use it in this library because of the new syntax to learn and the extra tools needed (BabelJS).
