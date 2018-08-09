import {h} from '/js/src/index.js';

export default (model, parsedDate) => h('.datetime-helper.arrow-up-left', [
  h('.datetime-helper-result', [
    h('span', parsedDate ? model.timezone.format(parsedDate, 'datetime') : 'Which datetime? (CEST / Geneva timezone)'),
  ]),
  h('.datetime-helper-memo', [
    h('span', [
      h('span', '[DD/[MM[/YYYY]]]'),
      h('span.pull-right', 'absolute day midnight'),
      h('br'),
      h('span', '[hh:[mm[:ss[.mmm]]]'),
      h('span.pull-right', 'absolute time'),
      h('br'),
      h('hr'),
      h('span', '[+/-[N]d]'),
      h('span.pull-right', 'relative days'),
      h('br'),
      h('span', '[+/-[N]h]'),
      h('span.pull-right', 'relative hours'),
      h('br'),
      h('span', '[+/-[N]m]'),
      h('span.pull-right', 'relative minutes'),
      h('br'),
      h('span', '[+/-[N]s]'),
      h('span.pull-right', 'relative seconds'),
      h('br'),
      h('hr'),
      h('span', '2/9/12 20:00'),
      h('span.pull-right', '2nd Septembre 2012, 8pm'),
      h('br'),
      h('span', '2/ 20:'),
      h('span.pull-right', '2nd of this month, 8pm'),
      h('br'),
      h('span', '-1d 6:00'),
      h('span.pull-right', 'yesterday at 6am'),
      h('br'),
      h('span', '-5m'),
      h('span.pull-right', 'five minutes ago'),
      h('br'),
    ])
  ]),
]);
