import * as framework from '/js/src/index.js';
Object.assign(window, framework);
import sessionService from '/js/src/sessionService.js';
sessionService.loadAndHideParameters();
// Expose sessionService to interract with it the browser's console
window.sessionService = sessionService;
window.frameworkLoaded = true;