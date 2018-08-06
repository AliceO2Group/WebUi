import {h} from '/js/src/index.js';

// The view
export default function view(model) {
  return h('.absolute-fill.flex-column.items-center.justify-center',
    h('.bg-gray-lighter.br3.p4', [
      h('h1', 'Hello World'),
      h('ul', [
        h('li', `local counter: ${model.count}`),
        h('li', `remote date: ${model.date}`),
      ]),
      h('div', [
        h('button.btn', {onclick: e => model.increment()}, '++'), ' ',
        h('button.btn', {onclick: e => model.decrement()}, '--'), ' ',
        h('button.btn', {onclick: e => model.fetchDate()}, 'Get date from server'), ' ',
        h('button.btn', {onclick: e => model.streamDate()}, 'Stream date from server'), ' ',
      ])
    ])
  );
}
