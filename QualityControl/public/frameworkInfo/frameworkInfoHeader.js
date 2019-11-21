import {h} from '/js/src/index.js';
import spinner from '../loader/spinner.js';

/**
 * Shows header of Framework Information
 * @param {Object} model
 * @return {vnode}
 */
export default (model) => [
  h('.w-50.flex-row.justify-center', [
    h('b.f4.ph2', 'Framework Info'),
    model.frameworkInfo.item.isLoading() &&
    h('.f4', spinner()),
  ]),
  h('.flex-grow')
];
