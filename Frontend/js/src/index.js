// mithril function 'm' will be injected into window
// it is used by renderer as an abstracted engine
import '/js/mithril.js';

import Observable from './Observable.js';
import {render, h, frameDebouncer, mount} from './renderer.js';

export {Observable, render, h, frameDebouncer, mount};
