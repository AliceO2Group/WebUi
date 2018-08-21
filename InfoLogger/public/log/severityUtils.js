import {switchCase} from '/js/src/index.js';

/**
 * Returns background CSS class corresponding to a severity char
 * @param {string} severity
 * @return {string} CSS class
 */
export const severityClass = (severity) => switchCase(severity, {
  I: 'severity-i',
  W: 'severity-w-bg',
  E: 'severity-e-bg',
  F: 'severity-f-bg',
});

/**
 * Returns font color CSS class corresponding to a severity char
 * @param {string} severity
 * @return {string} CSS class
 */
export const severityLabel = (severity) => switchCase(severity, {
  I: 'info',
  W: 'warning',
  E: 'error',
  F: 'fatal',
});
