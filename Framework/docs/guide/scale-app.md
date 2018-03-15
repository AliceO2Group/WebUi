# Frontend - Scaling the application

### Files

In the documentation and [tutorial](../tutorial/time-server.md) a single model and single view are used. A larger application may require multiple models and views. They should be kept in a seperate files. Use `UpperCamelCase` convention for file names that define classes and `camelCase` for others.
For common things across the application like a header or a menu, a `common` module (folder) can be made for example.

### View

Within a file defining a view avoid having large functions. Try to split the code into smaller pieces; Pass the model as a first parameter as shown below.

```js
export function userList(model) {
  return h('ul', model.user.list.map((user) => {
    return userListRow(model, user);
  }));
}

function userListRow(model, user) {
  return h('li', user.name);
}
```

### Model

A model can be implemented as a tree of submodels. Each parent model needs to observe its submodels by `bubbleTo` method:

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

When `model.submodel.increment()` is called, the observers of the parent `model` will be also notified.

![Global view of the architecture](../images/architecture-front.jpeg)
