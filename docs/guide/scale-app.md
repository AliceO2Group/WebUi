# How to scale and architecture your application

### Files

In [this tutorial](../tutorial/time-server.md) you can see a single model (one file) and a single view (one file). But a large application cannot be made with two large files. A good way is to split the code into modules like this:

```
- user (folder, camelCase)
  - User.js (model, PascalCase)
  - userList.js (view, camelCase)
  - userItem.js (view, camelCase)
  - userAvatar.js (view, camelCase)
  - user.css (facultative style, camelCase)
```

This allows you to have everything concerning a module in the same place, you can then import it as needed.

For common things accross the application like a header or a menu, a `common` module (folder) can be made for example.

### View

Inside the view files, avoid to have a big function containing all your page. Try to split in smaller functions, you can then pass the model as a first parameter for each call and the specific variables afterward.

```js
export function userList(model) {
  return h('ul', model.user.list.map(user => userListRow(model, user)));
}

function userListRow(model, user) {
  return h('li', user.name);
}
```

### Model

The `Observable` model can be, like the view, a tree of models. Each one will dispatch to its parent a notification if it has been modified through `bubbleTo` method:

```js
class Model extends Observable {
  constructor() {
    super();
    this.submodel = new SubModel();
    this.submodel.bubbleTo(this);
  }
}

class SubModel extends Observable {
  constructor() {
    super();
    this.count = 0;
  }

  increment() {
    this.count++;
    this.notify();
  }
}

const model = new Model();
```

When a call to `model.submodel.increment()` is made, `model` will be notified and will call all listeners (callback functions) registered via `model.observe(callbackFunction)`.

![Global view of the architecture](../images/architecture-front.jpeg)
