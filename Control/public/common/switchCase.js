export default (value, cases, defaultCaseValue) =>
  cases.hasOwnProperty(value) ? cases[value] : defaultCaseValue;