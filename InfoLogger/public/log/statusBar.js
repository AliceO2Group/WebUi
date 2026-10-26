/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file "COPYING".
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

import { h, iconWarning } from '/js/src/index.js';

/**
 * Bottom bar, showing status of the log's list and its details,
 * some application messages and some basic options like auto-scroll button.
 * @param {Model} model - root model of the application
 * @returns {vnode} - the view of the bottom bar
 */
export default (model) => [
  h('.flex-row.items-center.ph2.mv2.gc3', { id: 'status-bar' }, [
    h('.flex-grow.flex-wrap.items-center.gc2', [statusLogs(model), applicationMessage(model)]),
    model.log.isActiveModeQuery() && h('', { style: 'text-align: center; width:30%' }, sqlQuery(model)),
    h(
      '.flex-row.items-center.gc3',
      { id: 'status-bar-application-options', style: 'width:20%' },
      applicationOptions(model),
    ),
  ]),
];

/**
 * Show information about the logs seen by user:
 * - source (query or live)
 * - how many are loaded, how many in database
 * - timing, hostname, stats, etc.
 * @param {Model} model - root model of the application
 * @returns {vnode} - the view of the log's list status
 */
const statusLogs = (model) => model.frameworkInfo.match({
  NotAsked: () => 'Loading services...',
  Loading: () => 'Loading services...',
  Success: (frameworkInfo) => [
    statusStats(model),
    model.log.isLiveModeRunning() && statusLive(model, frameworkInfo),
  ],
  Failure: () => h('span.danger', 'Unable to load services'),
});

/**
 * Component displaying the SQL query built with the user's filters
 * @param {Model} model - root model of the application
 * @returns {vnode} - the view of the SQL query
 */
const sqlQuery = (model) => model.log.queryResult.match({
  NotAsked: () => null,
  Loading: () => null,
  Success: (data) => h('.dropup.d-block.w-100', { // override inline-block: its linebox adds unwanted space below
    class: model.log.statusDropdown ? 'dropup-open' : '',
    id: 'status-bar-sql-query',
  }, [
    h('.query-item.w-wrapped.ph1', {
      title: 'Toggle to view full SQL query',
      style: 'min-width: 0%;',
      onclick: () => model.log.toggleStatusDropdown(),
    }, data.queryAsString),
    h('.dropup-menu.p2.gray-darker.text-center.w-100', { id: 'status-bar-sql-query-menu' }, [
      h('', { style: 'font-weight: bold' }, 'SQL QUERY'),
      data.queryAsString,
    ]),
  ]),
  Failure: () => null,
});

/**
 * Application message, could be deprecated when notification is implemented
 * @param {Model} model - root model of the application
 * @returns {vnode} - the view of the application message
 */
const applicationMessage = (model) => model.log.list.length > model.log.applicationLimit
  ? h(
    'span.danger',
    { id: 'status-bar-application-message' },
    `Application reached more than ${model.log.applicationLimit} logs, please clear if possible`,
  )
  : null;

/**
 * Show some application preferences: inspector checkbox, plus autoscroll whilst live mode is running
 * (could be evolve into a preference panel in the future if more options are added)
 * @param {Model} model - root model of the application
 * @returns {vnode} - the view of the application options
 */
const applicationOptions = (model) => {
  const { log } = model;
  const autoScrollEnabled = log.autoScrollLive;
  return [
    log.isLiveModeRunning() && [
      h(
        `button.btn.btn-sm${autoScrollEnabled ? '.btn-success' : '.btn-warning'}`,
        {
          id: 'status-bar-auto-scroll',
          title: autoScrollEnabled ? 'Click here to disable autoscroll' : 'Click here to re-enable autoscroll',
          onclick: (e) => {
            e.currentTarget.blur();
            log.setAutoScrollLive(!autoScrollEnabled);
          },
        },
        [
          !autoScrollEnabled && iconWarning(),
          h('span.d-inline', autoScrollEnabled ? 'Autoscroll Enabled' : 'Autoscroll Disabled'),
        ],
      ),
    ],
    h('label.flex-row.items-center.g1.m0', { title: 'Show details of selected log' }, h('input', {
      type: 'checkbox',
      checked: model.inspectorEnabled,
      onchange: () => model.toggleInspector(),
    }), 'Inspector'),
  ];
};

/**
 * Status for query mode, showing how many logs are really in DB and how much time it took to load it
 * @param {Model} model - root model of the application
 * @param {object} result - raw query result from server with its meta data
 * @returns {vnode} - the view of the query status
 */
const statusQuery = (model, result) => `in ${(result.time / 1000).toFixed(2)}s`;

/**
 * Status of live mode with hostname of streaming source and date it started
 * @param {Model} model - root model of the application
 * @param {object} frameworkInfo - service discovery information of what is enabled in this ILG instance
 * @returns {vnode} - the view of the live status
 */
const statusLive = (model, frameworkInfo) =>
  h('span', [
    `(Connected to ${frameworkInfo.mysql.host} for `,
    h('span.status-number', model.timezone.formatDuration(model.log.liveStartedAt)),
    ')',
  ]);

/**
 * Status of the log's list (independent of mode): how many global and how many per severity
 * @param {Model} model - root model of the application
 * @returns {vnode} - the view of the log's list status
 */
const statusStats = (model) => [
  h(
    'span',
    {
      id: 'status-bar-buffer-size',
    },
    [
      bufferStatus(model),
      statNumber(model.log.list.length),
      ' / ',
      statNumber(model.log.limit),
      ' (Buffer size)',
    ],
  ),
  model.log.queryResult.match({
    NotAsked: () => null,
    Loading: () => 'Querying server...',
    Success: (result) => statusQuery(model, result),
    Failure: () => null, // notification
  }),
  statLabel(model.log.stats.debug, 'debug'),
  statLabel(model.log.stats.info, 'info'),
  statLabel(model.log.stats.warning, 'warn'),
  statLabel(model.log.stats.error, 'error'),
  statLabel(model.log.stats.fatal, 'fatal'),
];

/**
 * Number to display in the status bar in a locale aware format
 * Digits use tabular figures so a count changing without gaining a digit does not shift the status bar
 * @param {number} value - number to display
 * @returns {vnode} - view of the number
 */
const statNumber = (value) =>
  h('span.status-number', value.toLocaleString('en-US'));

/**
 * Label for a specific severity level in the status bar
 * @param {number} value - number of logs for this severity
 * @param {string} severity - name of the severity level
 * @returns {vnode} - view of the severity label
 */
const statLabel = (value, severity) =>
  h(`span.severity-${severity.charAt(0)}`, [statNumber(value), ` ${severity}`]);

const bufferStatus = (model) => {
  let dotClass = 'gray-darker'; // grey - unknown status default

  if (model.log.limitReached === true) {
    dotClass = 'danger'; // red - limit reached
  } else if (model.log.limitReached === false) {
    dotClass = 'success'; // green - limit not reached
  }

  return h(`span.${dotClass}.f7`, {
    title: model.log.limitReached === null ? 'No query data loaded' :
      model.log.limitReached === true ? 'Limit reached - results may be incomplete' : 'Limit OK',
    id: 'status-bar-buffer-dot',
  }, '●');
};
