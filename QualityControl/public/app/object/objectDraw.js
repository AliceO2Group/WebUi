import {h} from '/js/src/index.js';

export function draw(model, object, options) {
  options = {
    width: '100%', // CSS size
    height: '100%', // CSS size
    className: '', // any CSS class
    portrait: false,
    ...options,
  };

  const oncreate = (vnode) => {
    model.object.loadObject(object.name);
  }
  const onupdate = (vnode) => {
    // jsroot is already drawn, let's refresh size
    if (vnode.dom.resizeJsRoot) {
      // JSROOT.resize(vnode.dom);
      // console.log('resized');
      // vnode.dom.resizeJsRoot(); TODO rétablir quand window resize
      return;
    }

    // jsroot is not drawn but data are ready, draw it
    if (model.object.objects[object.name]) {
      timerDebouncer(function() {
        JSROOT.redraw(vnode.dom, model.object.objects[object.name], 'logx;logy;gridx;lego');
      }, 300)();

      vnode.dom.resizeJsRoot = timerDebouncer(function() {
        JSROOT.resize(vnode.dom);
      }, 300);

      vnode.dom.resizeJsRoot();
    }
  };
  const ondestroy = (vnode) => {
    // remove jsroot binding to avoid memory leak
    JSROOT.cleanup(vnode.dom);
  };
  const attributes = {
    key: object.name,
    class: options.className,
    style: {height: options.height, width: options.width},
    oncreate: oncreate,
    onupdate: onupdate,
    ondestroy: ondestroy
  };

  return h('div', attributes);
}

function timerDebouncer(fn, time) {
  let timer;
  return function() {
    const args = arguments;
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(function() {
      fn.apply(null, args);
    }, time);
  };
}

