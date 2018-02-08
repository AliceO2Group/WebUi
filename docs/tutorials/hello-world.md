## Tutorial - Hello World

This library uses the MVC pattern, let's see the example:

```js
import {Observable, h, mount} from '../../src/index.js'

// The model
class Model extends Observable {
  constructor() {
    super();
    this.count = 0;
  }

  increment() {
    this.count++;
    this.notify();
  }

  decrement() {
    this.count--;
    this.notify();
  }
}

// The view
function view(model) {
  return h('center', [
    h('h1', 'Hello World'),
    h('p', `counter value: ${model.count}`),
    h('div', [
      h('button', {onclick: e => model.increment()}, '++'),
      h('button', {onclick: e => model.decrement()}, '--'),
    ])
  ]);
}

// The controller
const model = new Model();
mount(document.body, view, model);

```

This will show on the screen a counter which can be incremented or decremented.

See it in action in your browser:

```bash
cd FrontEndKit
node serve-folder.js
open http://localhost:9000/docs/tutorials/hello-world.html
```

### How it works?

First, the model is observable, whenever someone modifies it, it will notify the observers (the controller). So calling `model.increment()` will trigger the callback of `model.observe(callback)`.

Then, the controller will render by calling `render(domElement, vnode)` and the view by passing to it the model. The view produces a virtual dom (called vnode) which is a pure javascript representation of the dom. The `h()` function produces a vnode (a javascript object). For example `h('span', {class: 'yellow'}, 'Hello')` means `<span class="yellow">Hello</span>`, see XXX for more details on vnodes.

Finally, inside `render` the DOM tree will be modified with a diffing algorithm according to the virtual dom representation. If only a part of the vnode has changed, then only a part of the DOM will change. Each time the model is modified, a new vnode tree will be produced and the DOM will change accordingly.

The loop of the application begins again when a modification is requested from the view to the model like `onclick: e => model.increment()` which is an event binded to an element.



