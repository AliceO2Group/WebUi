import {h} from '/js/src/index.js';

// The view
export default function view(model) {
  return h('.fill-parent.flex-column.items-center.justify-center',
    h('.bg-gray.br3.p4', [
      h('h1', 'Hello World'),
      h('ul', [
        h('li', `local counter: ${model.count}`),
        h('li', `remote date: ${model.date}`),
      ]),
      h('div', [
        h('button', {onclick: e => model.increment()}, '++'),
        h('button', {onclick: e => model.decrement()}, '--'),
        h('button', {onclick: e => model.getDate()}, 'Get date from server'),
        h('button', {onclick: e => model.streamDate()}, 'Stream date from server'),
      ])
    ])
  );
}
