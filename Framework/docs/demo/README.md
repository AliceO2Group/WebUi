# WebUi Demos

This folder contains example demos showcasing the WebUi framework.

> Mithril is the JavaScript frontend framework that WebUi builds on. It provides the virtual DOM engine and rendering API `m()` that all WebUi components depend on. The WebUi framework's [renderer.js](../../Frontend/js/src/renderer.js#L26) explicitly imports Mithril via an absolute path. Without Mithril loaded globally, none of the demos can render.

There are two ways to run the demos:
1. [Full server approach](#1-full-server-approach-recommended) _(recommended)_ – run a backend that serves Mithril and all demos with clean routes.
2. [Manual workaround](#2-manual-workaround-quick--dirty) _(quick & dirty)_ – serve Mithril with a static server.

## 1. Full server approach (recommended)

See the [project README](./project/README.md) for setup instructions.

This uses a proper backend that serves Mithril and all demos with clean routes. In the HTTP server's [constructor](./project/index.js#L27) a [`specifyRoutes`](https://github.com/AliceO2Group/WebUi/blob/dev/Framework/Backend/http/server.js#L172) logic is invoked to wire up all required routes.

## 2. Manual workaround (quick & dirty)

Serve docs statically and manually provide Mithril.

Copy Mithril to the expected `mithril/mithril.min.js` path:

```bash
cd WebUi/Framework
npm ci
mkdir -p mithril
cp node_modules/mithril/mithril.min.js mithril/mithril.min.js
```

If you don't want to install everything, you can also create the file manually.
```bash
cd WebUi/Framework
mkdir mithril
touch mithril/mithril.min.js
```
Then copy the contents of the `mithril/mithril.min.js` file in there (available for example in the [unpkg.com](https://unpkg.com/mithril@2.3.7/mithril.min.js)).

This is more error-prone than the local copy from `node_modules`.

### Serve the Framework directory

```bash
python3 -m http.server 8080
```

Navigate through available demos:
- [chart](http://localhost:8080/docs/demo/chart.html)
- [frontend](http://localhost:8080/docs/demo/frontend.html)
- [notification](http://localhost:8080/docs/demo/notification.html)
- [template-1](http://localhost:8080/docs/demo/template-1.html)
- [template-2](http://localhost:8080/docs/demo/template-2.html).
