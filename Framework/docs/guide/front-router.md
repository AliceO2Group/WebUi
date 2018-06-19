# Front Router - QueryRouter

On most SPA (Single Page Application), there are many internal pages (or views). It means the application loads once and content can change: passing from a list to an item for example. To allow user share those views one bind each view to a specific URL.

WebUi includes a QueryRouter which uses the query string `?key=value&...` of the URL bar and respond to it by modifying model.

Main properties of router:
- params: an object representing the keys/values
- go(url, replaceHistory, silentEvent): a method to change current URL
- handleLinkEvent(e): blocks refreshing application and let router handle new route

### Model example

```js
import {Observable, QueryRouter} from '/js/src/index.js';

export default class Model extends Observable {
  constructor() {
    super();

    // Setup router
    this.router = new QueryRouter();
    this.router.observe(this.handleLocationChange.bind(this));
    this.handleLocationChange(); // Init first page
  }

  /**
   * Delegates sub-model actions depending new location of the page
   */
  handleLocationChange() {
    switch (this.router.params.page) {
      case 'list':
        // call some ajax to load list
        break;
      case 'item':
        // call some ajax to load item this.router.params.id
        break;
      default:
        // default route, replace the current one not handled
        this.router.go('?page=list', true);
        break;
    }
  }
}
```

### View example

```js
import {h, switchCase} from '/js/src/index.js';

export default (model) => h('div', [
  menu(model),
  content(model),
]);

const content = (model) => h('div', [
  switchCase(model.router.params.page, {
    list: () => h('p', 'print list'),
    item: () => h('p', `print item ${model.router.params.id}`),
  })()
]);

const menu = (model) => h('ul', [
  h('li', h('a', {onclick: (e) => model.router.handleLinkEvent(e), href: '?page=list'}, 'List')),
  h('li', h('a', {onclick: (e) => model.router.handleLinkEvent(e), href: '?page=item&id=1'}, 'Item 1')),
  h('li', h('a', {onclick: (e) => model.router.handleLinkEvent(e), href: '?page=item&id=2'}, 'Item 2')),
  h('li', h('a', {onclick: (e) => model.router.handleLinkEvent(e), href: '?page=item&id=3'}, 'Item 3')),
]);
```
