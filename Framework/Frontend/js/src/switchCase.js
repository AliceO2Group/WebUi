/**
 * Functional switch case
 * @param {string} caseName
 * @param {Object.<string,Any>} cases
 * @param {Any} defaultCaseValue
 * @return {Any} the corresponding caseValue of the caseName
 * @example
 * import {h, switchCase} from '/js/src/index.js';
 * default export (model) => h('div', [
 *   h('h1', 'Hello'),
 *   switchCase(model.page, {
 *     list: () => h('p', 'print list'),
 *     item: () => h('p', 'print item'),
 *     form: () => h('p', 'print form'),
 *   }, h('p', 'print default'))();
 * ]);
 */
const switchCase = (caseName, cases, defaultCaseValue) =>
  cases.hasOwnProperty(caseName) ? cases[caseName] : defaultCaseValue;

export default switchCase;
