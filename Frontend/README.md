# Frontend

Web applications made maintainable. Served hot with a CSS Bootstrap and a React-like template engine.

Compared to other frameworks:
* small API to learn
* small code base to audit
* future proof as much as possible

This comes from the main usage of this framework at CERN to build applications that must be running for 10 years with little or no maintenance. So the tools can't change like the rest of the web industry. No JSX, no webpack or any preprocessor but only the minimal packages completed by the large toolbox which is the web standards.

### Example

```js
import {Observable, h, mount} from 'FrontEndKit/js/index.js'

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
}

// The view
function view(model) {
  return h('.fill-parent.flex-column.items-center.justify-center', [
    h('h1', 'Hello World'),
    h('p', `counter value: ${model.count}`),
    h('div', [
      h('button.btn', {onclick: e => model.increment()}, '++'),
    ])
  ]);
}

// The controller
mount(document.body, view, new Model());
```

### Reference

The reference is split in half: CSS and JS.

- [CSS showroom](https://vladimirkosmala.github.io/FrontEndKit/docs/showroom.html)
- [JS API](./docs/API.md)
- [Javascript ES6 and the DOM API](https://developer.mozilla.org)

### Tutorials

Create mini applications with explanations.

- [Hello World - quick start copy/paste](./docs/tutorials/hello-world.md)
- [Pasta Timer - step by step](./docs/tutorials/pasta-timer.md)

### Guides

- [Async calls (ajax)](./docs/guides/async-calls.md)
- [Scale the code of your application (architecture)](./docs/guides/scale-app.md)
- [Write DOM with Javascript without HTML](./docs/guides/reactive-programming.md)
- [What are hyperscript and virtual nodes](./docs/guides/vnodes.md)
- [Handle sorted list with keys](./docs/guides/keys.md)
- [Reuse parts of a view as Components](./docs/guides/components.md)
- [Debugging with the inspector](./docs/guides/debug.md)


