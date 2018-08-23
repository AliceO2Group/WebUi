# Known issues

This list should be updated when a rare problem occures to speed up resolution next time.

###### `npm install` outputs error "Unexpected end of JSON input while parsing near ..."
Run `npm cache clean --force`

###### Hyperscripts displays duplicated elements after each click
The use of array of array of vnode might break the template engine. Avoid `h('div', [[h('span')]])`. Prefer `h('div', [h('span')])`.

###### Hyperscript does not override some class names while component is replaced
Add a [key](template-engine.md#keys-in-hyperscript) to both components so the template engine is aware of the change.

###### A front end test fails due to asynchronous nature of JS
Lot of things are asynchronous is Javascript, rendering for example. Avoid `action(); check();`. Prefer `await action(); await check();`. See `waitForFunction` and `networkidle0` for puppeteer.
