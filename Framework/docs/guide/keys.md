# Guide - Keys in hyperscript

When manipulating a list of items with [hyperscript](../hyperscript-vnode.md), the `key` attribute of an element helps the engine to identify which items have changed, are added, or are removed. The key value should be a unique ID (from the database for example), but not the index of the array.

Let's see an example of a list of videos, we don't want the video to be re-recreated if it changed its position in the list after a click on "Sort by".

```js
function videoGallery(videos) {
  return videos.map((video) => {
    return h('video', {src: video.src, key: video.src});
  });
}
```

You must not use the array index, it will be the same, so it would be useless.

Another usage is in combination with the life cycles when you bind unusual views or libraries you want to keep.

```js
function list(images) {
  return images.map((image) => {
    return h('img', {key: image.src, oncreate: dom => doSomethingWithALibrary(dom)});
  });
}
```
