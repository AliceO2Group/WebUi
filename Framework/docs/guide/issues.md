# Common issues

This list should be updated when a difficult and rare problem happen to speed up resolution next time.

###### `npm install` gets error "Unexpected end of JSON input while parsing near ..."
Start `npm cache clean --force`

###### UI gets duplicated elements after each click
The use of array of array of vnode might break the template engine. Avoid `h('div', [[h('span')]])`. Prefer `h('div', [h('span')])`.

###### UI keeps some class names while component has been replaced by another one
Add a key on both components so the template engine knows it's not the same anymore.

###### A test fails for an action while the action is well made however
Lot of things are asynchronous is Javascript, rendering for example. Avoid `action(); check();`. Prefer `await action(); await check();`. See `waitForFunction` and `networkidle0` for puppeteer.

