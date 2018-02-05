# Guide - Keys

When a list is re-ordered, the `key attribute` allows the engine to recognize the items and to sort them rather than destroying it.

An example of usage is when using a CSS animation on elements that should not be destroyed and created again, like a fade animation. The same applies for a list of videos, you don't want the video to be re-recreated if it changed its place in a list.

```js
function imageGallery(images) {
  return images.map((image) => {
    return h('img.fade-animation', {src: image.src, key: image.src});
  });
}
```

You must not use the array index, it will be the same, so it would be useless.

Another usage is in combination with the life cycles when you bind unusual views or libraries you want to keep.

```js
function list(images) {
  return images.map((image) => {
    return h('img', {key: image.src, oncreate: dom => doSomething(dom)});
  });
}
```
