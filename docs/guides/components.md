# Guide - Components

Components are pieces of UI like a menu, a form, etc.
Thanks to Hyperscript a component is a pure function which returns a vnode tree.
This is highly testable, reusable and easy to understand.

Let's look an example:

```js
function menu() {
  return h('div', [
    h('a', {href: '..'}, 'Link 1'),
    h('a', {href: '..'}, 'Link 2'),
    h('a', {href: '..'}, 'Link 3'),
  ]);
}
```

Another example with a layout and some arguments:

```js
function layout(menu, content) {
  return [
    menu,
    content,
  ];
}
```

This is really simple to compose, here is how to use this `layout` function:

```js
function page() {
  return layout(menu(), content());
}
```

Now we can put some data, a good way is to pass a single argument to the whole tree:

```js
function page(model) {
  return layout(model, menu(model), content(model));
}
```



