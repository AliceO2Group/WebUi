import {switchCase} from '/js/src/index.js';

export const severityClass = (severity) => switchCase(severity, {
  'I': 'severity-i',
  'W': 'severity-w-bg',
  'E': 'severity-e-bg',
  'F': 'severity-f-bg',
});

export const severityLabel = (severity) => switchCase(severity, {
  'I': 'info',
  'W': 'warning',
  'E': 'error',
  'F': 'fatal',
});
