import {h} from '/js/src/index.js';
import {iconCircleX} from '/js/src/icons.js';

export default (error) => h('.flex-column items-center justify-center', [
  h('span.pageError', iconCircleX()),
  h('p.text-center.danger.measure-narrow', error)
]);
