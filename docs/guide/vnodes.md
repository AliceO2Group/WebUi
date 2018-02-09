# Virtual Nodes

Hyperscript concept allows to create HyperText with JavaScript. A virtual node is a Javascript object that represents a DOM element. The `h()` function is a way to abstract the vnodes produced ('h' from 'hyperscript').

```js
h('span', {class: 'yellow'}, 'Hello')
```

The output of this function call will produces a vnode like this:

```js
{
  type: "span",
  props: {
    class: "yellow"
  },
  children: ['Hello']
}
```

This vnode is useful only for the engine which will compute the DOM modifications, so a `h()` function is the only thing you manipulate.

The engine will then produce this:

```html
<span class="yellow">Hello</span>
```

### To go further

This concept was introduced by ReactJS like libraries (MithrilJS, Hyperapp, etc.) And you can find some tools which allows you to use JSX, which is a new syntax producing vnodes without using `h()` because of a compiler doing it for you. We will not use it in this library because of the new syntax to learn and the extra tools needed (BabelJS).

