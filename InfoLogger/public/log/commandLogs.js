import {h, iconPerson, iconMediaPlay, iconMediaStop} from '/js/src/index.js';
import {BUTTON} from '../constants/button-states.const.js';
import {MODE} from '../constants/mode.const.js';

let queryButtonType = BUTTON.PRIMARY;
let liveButtonType = BUTTON.DEFAULT;
let liveButtonIcon = iconMediaPlay();

export default (model) => [
  loginButton(model),
  h('div.btn-group.mh3', [
    queryButton(model),
    liveButton(model)
  ], '' ),
  h('button.btn', {onclick: () => model.log.empty()}, 'Clear'),
  h('span.mh3'),
  h('button.btn', {
    disabled: !model.log.list.length,
    onclick: () => model.log.firstError(),
    title: 'Go to first error/fatal (ALT + left arrow)'
  }, '|←'),
  ' ',
  h('button.btn', {
    disabled: !model.log.list.length,
    onclick: () => model.log.previousError(),
    title: 'Go to previous error/fatal (left arrow)'
  }, '←'),
  ' ',
  h('button.btn', {
    disabled: !model.log.list.length,
    onclick: () => model.log.nextError(),
    title: 'Go to next error/fatal (left arrow)'
  }, '→'),
  ' ',
  h('button.btn', {
    disabled: !model.log.list.length,
    onclick: () => model.log.lastError(),
    title: 'Go to last error/fatal (ALT + right arrow)'
  }, '→|'),
  ' ',
  h('button.btn', {
    disabled: !model.log.list.length,
    onclick: () => model.log.goToLastItem(),
    title: 'Go to last log message (ALT + down arrow)'
  }, '↓')
];

/**
 * Button dropdown to show current user and logout link
 * @param {Object} model
 * @return {vnode}
 */
const loginButton = (model) => h('.dropdown', {class: model.accountMenuEnabled ? 'dropdown-open' : ''}, [
  h('button.btn', {onclick: () => model.toggleAccountMenu()}, iconPerson()),
  h('.dropdown-menu', [
    h('p.m3.mv2.text-ellipsis', `Welcome ${model.session.name}`),
    model.session.personid === 0 // anonymous user has id 0
      ? h('p.m3.gray-darker', 'This instance of the application does not require authentication.')
      : h('a.menu-item', {onclick: () => alert(`Not implemented`)}, 'Logout'),
  ]),
]);

/**
 * Query button final state depends on the following states
 * - services lookup
 * - services result
 * - query lookup
 * @param {Object} model
 * @return {vnode}
 */
const queryButton = (model) => h('button.btn', model.servicesResult.match({
  NotAsked: () => ({disabled: true}),
  Loading: () => ({disabled: true, className: 'loading'}),
  Success: (services) => ({
    title: services.query ? 'Query database with filters (Enter)' : 'Query service not configured',
    disabled: !services.query || model.log.queryResult.isLoading(),
    className: model.log.queryResult.isLoading() ? 'loading' : queryButtonType,
    onclick: () => toggleButtonStates(model, false)
  }),
  Failure: () => ({disabled: true, className: 'danger'}),
}), 'Query');

/**
 * Live button final state depends on the following states
 * - services lookup
 * - services result
 * - query lookup
 * - websocket status
 * @param {Object} model
 * @return {vnode}
 */
const liveButton = (model) => h('button.btn', model.servicesResult.match({
  NotAsked: () => ({disabled: true}),
  Loading: () => ({disabled: true, className: 'loading'}),
  Success: (services) => ({
    title: services.live ? 'Stream logs with filtering' : 'Live service not configured',
    disabled: !services.live || model.log.queryResult.isLoading(),
    className: !model.ws.authed ? 'loading' : liveButtonType,
    onclick: () => toggleButtonStates(model, true)
  }),
  Failure: () => ({disabled: true, className: 'danger'}),
}), 'Live', ' ', liveButtonIcon);

/**
 * Method to toggle states of the buttons(Query/Live) depending on the mode the tool is running on
 * @param {Object} model
 * @param {boolean} wasLivePressed
 */
function toggleButtonStates(model, wasLivePressed) {
  if (wasLivePressed) {
    switch (model.log.activeMode) {
      case MODE.QUERY:
      case MODE.LIVE.PAUSED:
        setButtonsType(BUTTON.DEFAULT, BUTTON.DANGER_ACTIVE, iconMediaStop());
        model.log.updateLogMode(MODE.LIVE.RUNNING);
        break;
      case MODE.LIVE.RUNNING:
        setButtonsType(BUTTON.DEFAULT, BUTTON.DANGER, iconMediaPlay());
        model.log.updateLogMode(MODE.LIVE.PAUSED);
        break;
    }
  } else {
    setButtonsType(BUTTON.PRIMARY, BUTTON.DEFAULT, iconMediaPlay());
    model.log.updateLogMode(MODE.QUERY);
  }

  /**
   * Method to change types of the buttons based on the mode being run
   * @param {String} queryType Type of the Query Button
   * @param {String} liveType Type of the Live Button
   * @param {Icon} liveIcon Icon of the Live Button
   */
  function setButtonsType(queryType, liveType, liveIcon) {
    queryButtonType = queryType;
    liveButtonType = liveType;
    liveButtonIcon = liveIcon;
  }
}
