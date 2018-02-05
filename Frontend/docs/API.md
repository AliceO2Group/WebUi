# API

### `h(selector, [attributes], children | childrens | text)`

This hyperscript function produces a new vnode.

*selector* is a CSS selector representing the DOM element.
Examples:
- 'span'
- 'div' (default value when empty string '')
- '.menu-item'
- 'a.menu-tem.active'

*attributes* is optional and represents the attributes of the DOM element.
The style attribute is special and must be an object.
Examples:
- {href: '/'}
- {class: 'active'}
- {onclick: e => model.do(), class: 'active'}
- {style: {backgroundColor: 'red'}}

*children* must be an other vnode, but to homogenize the code is it recommanded to use *childrens*, see bellow.

*childrens* is an array of vnodes. This representes the tree of the DOM.
Examples:
- [m('a', 'link 1'), m('a', 'link 2')]

### `mount(domElement, view, model)`

Bind together a model and a view to render both on a DOM element.

*element* - The DOM element

*view* - The functional view which produces a vnode tree

*model* - The observable model containing the state

Example:
```js
mount(document.body, model => h('h1', model.name), {name: 'John'})
```

### class Observable

* `observe(callback)`
* `unobserve(callback)`
* `bubbleTo(observable)`
* `notify()`

*callback* any function which will be an observer and called when the observable object has its `notify()` function called.

*observable* any other observable object which wants to be notified. This allows to create an observable tree, the root beeing notified if any other tree node has been modified. Avoid circular `bubbleTo` this will produce a stack overflow.
