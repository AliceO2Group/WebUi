import {h} from '/js/src/index.js';

/**
 * Build a panel for displaying a checker quality object
 * @param {JSON} checker - Object returned by CCDB
 * @param {string} location - location from where the `draw` method is called; Used for styling
 * @return {vnode}
 */
export default (checker, location) => h('.relative.p2.flex-column.scroll-y', {

}, [
  checkerValue('Checker:', checker.mCheckName, location),
  checkerValue('Detector:', checker.mDetectorName, location),
  checkerValue('Quality Name:', checker.mQuality.mName, location),
  checkerValue('Quality Lv.:', checker.mQuality.mLevel, location),
  checkerValue('Inputs:', checker.mInputs, location),
  checkerValue('User Metadata:', checker.mUserMetadata, location),
]);

/**
 * One row with a label and the value of the checker[label]
 * @param {string} label
 * @param {string} value
 * @param {string} location
 * @return {vnode}
 */
const checkerValue = (label, value, location) => {
  let padding = '';
  if (location === 'objectView' || location === 'treePage') {
    padding = 'p3';
  }

  switch (typeof value) {
    case 'string':
      value = value && value.trim() !== '' ? value : '-';
      break;
    case 'object':
      if (value instanceof Array) {
        const format = [];
        value.forEach((element) => format.push(h('.w-wrapped', element)));
        value = format;
      } else {
        const format = [];
        Object.keys(value).forEach((element) => format.push(h('.w-wrapped', [element, ': ', value[element]])));
        value = format;
      }
      break;
    case 'number':
      value = value = value && value.toString() !== '' ? value : '-';
      break;
    default:
      value = value && JSON.stringify(value).trim() !== '' ? JSON.stringify(value) : '-';
  }

  return h(`.flex-row.${padding}`, [
    h('label.ph2.w-50.w-wrapped.text-right.checker-label', label),
    h('.w-wrapped.w-50.text-left', value)
  ]);
};
