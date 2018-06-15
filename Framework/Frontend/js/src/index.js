// mithril function 'm' will be injected into window
// it is used by renderer as an abstracted engine
import '/js/mithril.js';

// Design patterns
export {default as Observable} from './Observable.js';
export {default as EventEmitter} from './EventEmitter.js';
export {default as RemoteData} from './RemoteData.js';

// Template engine
export {render, h, frameDebouncer, mount} from './renderer.js';
export {default as QueryRouter} from './QueryRouter.js';

// Utils
export {default as switchCase} from './switchCase.js';

// Singleton retrieving session data
export {default as sessionService} from './sessionService.js';

// Data sources
export {default as fetchClient} from './fetchClient.js';
export {default as WebSocketClient} from './WebSocketClient.js';

// All icons helpers, namespaced with prefix 'icon*'
export * from './icons.js';
