import {h} from '/js/src/index.js';
import lockButton from '../lock/lockButton.js';

/**
 * Application header (left part): lockpad button and application name
 */
export default (model) => h('.flex-grow text-left', [
  lockButton(model),
  ' ',
  h('span.f4 gray', 'Control')
]);
