/* global: window, m */

// Before loading the framework we need to create a browser environment
// so we create a window and we also load mithril inside which is used
// by the framework.
const jsdom = require('jsdom');
const {JSDOM} = jsdom;
global.window = new JSDOM('', {pretendToBeVisual: true}).window;
global.window.m = require('mithril');

// Load framework written in ES6 modules, require() will translate with Babel
const Observable = require('../js/src/Observable.js').default;
const {render, h, frameDebouncer, mount} = require('../js/src/renderer.js');

const assert = require('assert');
const fs = require('fs');
const path = require('path');

describe('Hyperscript h() and DOM diff algo render()', () => {
  let savedNode;

  it('create div', () => {
    render(window.document.body, h('div'));
    assert.strictEqual(window.document.body.innerHTML, '<div></div>');
  });

  it('create a link with attribute and text', () => {
    render(window.document.body, h('a', {href: 'somewhere'}, 'click me'));
    assert.strictEqual(window.document.body.innerHTML, '<a href="somewhere">click me</a>');
    savedNode = window.document.body.firstElementChild;
  });

  it('update previous link and keep element', () => {
    render(window.document.body, h('a', {href: 'somewhere else'}, 'click me'));
    assert.strictEqual(window.document.body.innerHTML, '<a href="somewhere else">click me</a>');
    assert.strictEqual(window.document.body.firstElementChild, savedNode);
  });

  it('create ul, li tree', () => {
    render(window.document.body, h('ul', [h('li', 1), h('li', 1)]));
    assert.strictEqual(window.document.body.innerHTML, '<ul><li>1</li><li>1</li></ul>');
  });

  it('listen to click events', (done) => {
    render(window.document.body, h('button', {onclick: () => done()}));
    window.document.body.firstElementChild.click();
  });

  it('debounce rendering', (done) => {
    // 3 calls debounced do only 1 call to done()
    // mocha detects if done is called less or more than 1 time to thow error
    let fn = frameDebouncer(() => {
      done();
    });

    fn();
    fn();
    fn();
  });
});

describe('Observable class', () => {
  let instance;
  let handler = () => null;

  it('can be instanciated', () => {
    instance = new Observable();
  });

  it('can add a listener', () => {
    instance.observe(handler);
    assert.strictEqual(instance.observers.length, 1);
  });

  it('can remove a listener', () => {
    instance.unobserve(handler);
    assert.strictEqual(instance.observers.length, 0);
  });

  it('can notify a listener', (done) => {
    instance.observe(() => done());
    instance.notify();
  });

  it('can bubble a notification', (done) => {
    instance = new Observable();
    instance.observe(() => done());

    let subinstance = new Observable();
    subinstance.bubbleTo(instance);
    subinstance.notify();
  });
});

describe('assets paths', () => {
  it('contains framework js/src/index.js', (done) => {
    fs.stat(path.join(__dirname, '../js/src/index.js'), done);
  });

  it('contains framework js/src/icons.js', (done) => {
    fs.stat(path.join(__dirname, '../js/src/icons.js'), done);
  });

  it('contains framework js/src/Observable.js', (done) => {
    fs.stat(path.join(__dirname, '../js/src/Observable.js'), done);
  });

  it('contains framework js/src/WebSocketClient.js', (done) => {
    fs.stat(path.join(__dirname, '../js/src/WebSocketClient.js'), done);
  });

  it('contains framework js/src/fetchClient.js', (done) => {
    fs.stat(path.join(__dirname, '../js/src/fetchClient.js'), done);
  });

  it('contains framework js/src/sessionService.js', (done) => {
    fs.stat(path.join(__dirname, '../js/src/sessionService.js'), done);
  });

  it('contains framework js/src/renderer.js', (done) => {
    fs.stat(path.join(__dirname, '../js/src/renderer.js'), done);
  });

  it('contains framework css/src/bootstrap.css', (done) => {
    fs.stat(path.join(__dirname, '../css/src/bootstrap.css'), done);
  });

  it('contains framework img/o2-favicon.png', (done) => {
    fs.stat(path.join(__dirname, '../img/o2-favicon.png'), done);
  });
});

describe('view and model integration', () => {
  let model;

  it('can be initialized', () => {
    model = new Observable();
    model.name = 'Alice';
    mount(window.document.body, (model) => h('div', model.name), model);
    assert.strictEqual(window.document.body.innerHTML, '<div>Alice</div>');
  });

  it('updates when model change', (done) => {
    model.name = 'Bob';
    model.notify();

    // wait fake screen to refresh
    setTimeout(() => {
      assert.strictEqual(window.document.body.innerHTML, '<div>Bob</div>');
      done();
    }, 1000 / 60 * 2); // 60fps
  });
});
