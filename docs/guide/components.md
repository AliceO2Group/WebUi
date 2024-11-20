# Frontend - Components

Component is a part of UI like a menu, form, etc. Thanks to Hyperscript it is also a pure JavaScript function which returns a vnode.

Let's define a [vnode with Hyperscript](template-engine.md):

```js
h('h1', {class: 'title'}, 'Hello')
```

Let's define a component:

```js
const title = () => {
  return h('h1', {class: 'title'}, 'Hello');
}
```

Because components are pure functions we can use their properties, they are composable:

```js
const title = () => {
  return h('h1', {class: 'title'}, 'Hello');
}
const content = () => {
  return h('p', 'Lorem ipsum');
}
const page = () => {
  return h('div', [title(), content()]);
}
```

A best practice in pure functional programming. The components should only rely on constant expressions and always return the same output for given input.

```js
// ✗ WRONG, it manipulates a global variable
let count = 0;

const title = () => {
  return h('h1', {class: 'title'}, `Hello number ${count++}`);
}
```


```js
// ✓ CORRECT, it uses a constant variable
const today = new Date();

const title = () => {
  return h('h1', {class: 'title'}, `Hello timestamp is ${today}`);
}
```

```js
// ✓ OK, external constant expression
const greetings = 'Hello';

const title = () => {
  return h('h1', {class: 'title'}, greetings);
}
```

```js
// ✓ OK, internal constant variables for readability

const title = () => {
  const greetings = 'Hello';
  const attributes = {class: 'title'};
  return h('h1', attributes, greetings);
}
```

Note: As vnodes can be modified by the template engine you must not reuse them. Instead, create a new instance for each view redraw.

```js
// ✗ WRONG, it uses a constant vnode
const icon = h('svg.icon', {fill: 'currentcolor', viewBox: '0 0 8 8'},
  h('path', {d: 'M0 0v7h8v-1h-7v-6h-1zm5 0v5h2v-5h-2zm-3 2v3h2v-3h-2z'})
);

const title = () => {
  return h('h1', [icon, ' ', 'Hello']);
}
```

```js
// ✓ OK, it create a new vnode instance each time
const icon = () => {
  return h('svg.icon', {fill: 'currentcolor', viewBox: '0 0 8 8'},
    h('path', {d: 'M0 0v7h8v-1h-7v-6h-1zm5 0v5h2v-5h-2zm-3 2v3h2v-3h-2z'})
  );
}

const title = () => {
  return h('h1', [icon(), ' ', 'Hello']);
}
```

Components are a way to split parts of a view, what allows to scale the application  and arrange it in multiple files.

See the [architecture](./scale-app.md) article to scale the code of your application.
