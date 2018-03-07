# Guide - Components

Components are pieces of UI like a menu, a form, etc, thanks to hyperscript it is also a pure function which returns a vnode tree. This is testable, reusable and easy to understand.

Let's define a [vnode with hyperscript](hyperscript-vnode.md):

```js
h('h1', {class: 'title'}, 'Hello')
```

Let's define a component:

```js
function title() {
  return h('h1', {class: 'title'}, 'Hello');
}
```

Because components are pure functions we can use their properties, they are composable:

```js
function title() {
  return h('h1', {class: 'title'}, 'Hello');
}
function content() {
  return h('p', 'Lorem ipsum');
}
function page() {
  return h('div', [menu(), content()]);
}
```

A best practice in pure functional programming is to have no side effect. Your components should only rely on constant expressions and always return the same output for one input. A good way is to use only `const` variables.

```js
// ✗ WRONG, it has a side effect
let count = 0;

function title() {
  return h('h1', {class: 'title'}, `Hello number ${count++}`);
}
```


```js
// ✗ WRONG, it uses a constant variable from a dynamic expression
const today = new Date();

function title() {
  return h('h1', {class: 'title'}, `Hello timestamp is ${today}`);
}
```

```js
// ✓ OK, external constant expression
const greetings = 'Hello';

function title() {
  return h('h1', {class: 'title'}, greetings);
}
```

```js
// ✓ OK, internal constant variables for readability

function title() {
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

function title() {
  return h('h1', [icon, ' ', 'Hello']);
}
```

```js
// ✓ OK, it create a new instance vnode each time
function icon() {
  return h('svg.icon', {fill: 'currentcolor', viewBox: '0 0 8 8'},
    h('path', {d: 'M0 0v7h8v-1h-7v-6h-1zm5 0v5h2v-5h-2zm-3 2v3h2v-3h-2z'})
  );
}

function title() {
  return h('h1', [icon(), ' ', 'Hello']);
}
```

Components are a way to split parts of a view, it is then possible to scale and arrange in files those functions.

See the [architecture](./docs/guide/scale-app.md) article to scale the code of your application with convensions.
