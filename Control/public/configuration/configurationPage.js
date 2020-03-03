import {h, iconChevronBottom, iconChevronRight, iconCircleX} from '/js/src/index.js';
import pageLoading from '../common/pageLoading.js';
import pageError from '../common/pageError.js';
/**
 * @file Page to show configuration components (content and header)
 */

/**
 * Header of configuration page
 * Only page title with no action
 * @param {Object} model
 * @return {vnode}
 */
export const header = (model) => [
  h('.w-50 text-center', h('h4', 'Configuration')),
  h('.flex-grow text-right')
];

/**
 * Content of configuration page
 * @param {Object} model
 * @return {vnode}
 */
export const content = (model) => h('.scroll-y.absolute-fill', [
  model.configuration.readoutCardList.match({
    NotAsked: () => null,
    Loading: () => h('.w-100.text-center', pageLoading()),
    Success: (readoutCardsMap) => buildPage(model, readoutCardsMap),
    Failure: (error) => h('.w-100.text-center', pageError(error)),
  })
]);

/**
 * vnode with the configuration
 * @param {Object} model
 * @param {JSON} readoutCardsMap
 * @return {vnode}
 */
const buildPage = (model, readoutCardsMap) => h('.p2', [
  actionForm(model),
  h('h4.mh2.mv2', 'Readout Cards Table'),
  readoutCardsTable(model, readoutCardsMap)
]);

/**
 * vnode with the action panel (roc-config/status)
 * @param {Object} model
 * @return {vnode}
 */
const actionForm = (model) => h('.p2.mv3.w-100.shadow-level1', [
  actionPanel(model),
  expertPanel(model, model.configuration.actionPanel.expertOptions),
]);

/**
 * vnode with the possible roc actions
 * @param {Object} model
 * @return {vnode}
 */
const actionPanel = (model) => h('.flex-row.w-100.pv2', [
  h('h4', 'Action:'),
  h('.w-25.mh2', {style: 'display: flex; flex-direction: row;'}, [
    h('select.form-control', {
      style: 'cursor: pointer',
      onchange: (e) => model.configuration.setRocCommand(e.target.value)
    }, [
      h('option', {
        selected: 'CONFIG' === model.configuration.actionPanel.command ? true : false, value: 'CONFIG'
      }, 'roc-config')
    ]),
  ]),
  runPanel(model),
  rocStatusPanel(model)
]);

/**
 * vnode returning a panel containing operational buttons
 * @param {Object} model
 * @return {vnode}
 */
const runPanel = (model) =>
  h('.btn-group.mh2', {
    style: 'justify-content:right; display: flex',
  }, [
    h('button.btn.btn-primary', {
      title: 'Run command for the selected CRUs',
      disabled: model.configuration.actionPanel.runButtonDisabled,
      onclick: () => model.configuration.confirmSelectionAndRunCommand()
    }, 'Run'),
  ]);

/**
 * vnode with the status of the execution of roc-command
 * @param {Object} model
 * @return {vnode}
 */
const rocStatusPanel = (model) => h('.w-100',
  model.configuration.rocStatus.match({
    NotAsked: () => null,
    Loading: () => h('.w-100.text-center', pageLoading(2)),
    // Success: (status) => showStatus(panel),
    Success: () => null,
    Failure: (error) => h('.w-100.text-center.danger', h('', [iconCircleX(), ' ', error])),
  })
);


/**
 * vnode with expert panel allowing the user to change defaults for the command
 * @param {Object} model
 * @param {options} options
 * @return {vnode}
 */
const expertPanel = (model, options) => h('', {
  class: model.configuration.actionPanel.runButtonDisabled ? 'disabled-content' : '',
  style: {
    transition: 'max-height 0.5s',
    overflow: 'hidden',
    // 'max-height': model.configuration.actionPanel.expertMode ? '50em' : 0,
    height: 'auto'
  }
}, [
  h('h4', 'Expert Panel:'),
  h('.flex-row.w-100.pv2', [
    dropDown(model, 'Allow rejection', ['TRUE', 'FALSE'], 'allow-rejection'),
    dropDown(model, 'Loopback', ['TRUE', 'FALSE'], 'loopback'),
    dropDown(model, 'PON Upstream', ['TRUE', 'FALSE'], 'pon-upstream'),
  ]),
  h('.flex-row.w-100.pv2', [
    dropDown(model, 'DYN Offset', ['TRUE', 'FALSE'], 'dyn-offset'),
    dropDown(model, 'Clock Argument', ['LOCAL', 'TTC'], 'clock'),
    dropDown(model, 'Datapath Mode', ['PACKET', 'CONTINUOUS'], 'datapathmode'),
  ]),
  h('.flex-row.w-100.pv2', [
    dropDown(model, 'Downstream Data', ['CTP', 'PATTERN', 'MIDTRG'], 'downstreamdata'),
    dropDown(model, 'GBT Mode', ['GBT', 'WB'], 'gbtmode'),
    dropDown(model, 'GBT MUX', ['TTC', 'DDG', 'SWT'], 'gbtmux'),
  ]),
  h('.flex-row.w-100.pv2', [
    dropDown(model, 'Force config', ['TRUE', 'FALSE'], 'force-config'),
    h('.flex-row.w-50'),
    h('.flex-row.w-50'),
  ]),
  h('.flex-row.w-100.pv2',
    inputNumberBox(model, 'CRU-ID', 0, Math.pow(2, 31 - 1), 'cru-id'),
    inputNumberBox(model, 'Trigger Window Size', 0, 4095, 'trigger-window-size'),
    inputNumberBox(model, 'ONU Address', 0, Math.pow(2, 31 - 1), 'onu-address'),
  ),
  h('.w-100.pv2',
    h('.flex-row.w-100', [
      h('.ph1.w-25', 'Links'),
      h('.w-100.mh2', {style: 'display: flex; justify-content: space-between; flex-wrap: wrap;'}, [
        options.links.map((link, index) => checkBox(model, `Link #${index}`, index)),
      ])
    ])
  ),
  displayCommandPanel(model.configuration),
]);

/**
 * vnode with the roc command as a string
 * @param {Object} configuration
 * @return {vnode}
 */
const displayCommandPanel = (configuration) => h('.w-100.pv2.ph1', [
  h('', 'Command:'),
  h('pre', ['roc-config',
    configuration.getSelectedLinks().length > 0 &&
    `  --links ${configuration.getSelectedLinks()}`,
    configuration.getModifiedOptionsAsString()
  ])
]);

/**
 * vnode with the Readout Cards table
 * @param {Object} model
 * @param {Map<string, JSON>} readoutCardsMap
 * @return {vnode}
 */
const readoutCardsTable = (model, readoutCardsMap) =>
  h('.shadow-level1', [
    h('table.table.table-sm', [
      h('thead', [
        h('tr', [
          h('th', {style: 'width:0'}, ''),
          h('th', {style: 'width:0'}, ''),
          h('th', 'Hostname'),
          h('th', {style: 'width:0;'}, ''),
          h('th', 'Type'),
          h('th', 'Endpoint'),
          h('th', 'PCI Address'),
          h('th', 'Firmware'),
          h('th', 'Serial')
        ])
      ]),
      h('tbody.actionable-row', [
        Object.keys(readoutCardsMap).length === 0 ?
          h('tr', h('td', {colspan: 9, style: 'text-align: center;'}, 'No data found'))
          : Object.keys(readoutCardsMap).map((hostName) =>
            [h('tr', [
              h('td.text-center', {
                title: 'Show/Hide CRUs for this host',
                onclick: () => model.configuration.toggleHostRow(hostName)
              }, readoutCardsMap[hostName].open ? iconChevronBottom() : iconChevronRight()),
              h('td', {onclick: () => model.configuration.toggleAllReadoutCardsByHost(hostName)},
                h('label.d-inline.actionable-row', {title: 'Select / Unselect all CRUs for this host'},
                  h('input.actionable-row', {
                    type: 'checkbox',
                    title: 'Select / Unselect all CRUs for this host',
                    checked: model.configuration.areAllReadoutCardsForHostSelected(hostName), // add from somewhere in JSON
                  })
                )
              ),
              h('td', {onclick: () => model.configuration.toggleAllReadoutCardsByHost(hostName)}, hostName),
              h('td', ''),
              h('td', ''),
              h('td', ''),
              h('td', ''),
              h('td', ''),
              h('td', ''),
            ]),
            readoutCardsMap[hostName].open && Object.keys(readoutCardsMap[hostName].objects).map((card) =>
              h('tr', {onclick: () => model.configuration.toggleReadoutCardSelection(hostName, card)}, [
                h('td', ''),
                h('td', ''),
                h('td', ''),
                h('td', h('label.d-inline.actionable-row', {title: 'Select / Unselect this CRU'},
                  h('input.actionable-row', {
                    type: 'checkbox',
                    title: 'Select / Unselect this CRU',
                    checked: readoutCardsMap[hostName].objects[card].checked,
                  }))),
                h('td', readoutCardsMap[hostName].objects[card].type),
                h('td', readoutCardsMap[hostName].objects[card].endpoint),
                h('td', readoutCardsMap[hostName].objects[card].pciAddress),
                h('td', readoutCardsMap[hostName].objects[card].firmware),
                h('td', readoutCardsMap[hostName].objects[card].serial),
              ]),
            )
            ]
          )])
    ])]
  );

/*
Helpers
*/

/**
 * Generate a dropdown list
 * @param {Object} model
 * @param {string} title
 * @param {Array<string>} options
 * @param {string} field
 * @return {vnode}
 */
const dropDown = (model, title, options, field) => h('.flex-row.w-50', [
  h('.w-33', title),
  h('.w-50.mh2',
    h('select.form-control', {
      style: 'cursor: pointer',
      onchange: (e) => model.configuration.setExpertOptionByField(field, e.target.value)
    }, [
      h('option', {selected: '-' === field ? true : false, value: '-'}, '-'),
      options.map((option) =>
        h('option', {
          selected: option === field ? true : false, value: option
        }, option)
      )
    ])
  )
]);

/**
* Generate a component with an input string box of type number
* @param {Object} model
* @param {string} title
* @param {number} min
* @param {number} max
* @param {string} field
* @return {vnode}
*/
const inputNumberBox = (model, title, min, max, field) =>
  h('.flex-row.w-50', [
    h('.w-33', title),
    h('.w-50.mh2',
      h('input.form-control', {
        type: 'number',
        min: min,
        max: max,
        onkeyup: (e) => model.configuration.setExpertOptionByField(field, e.target.value),
      }, field)
    )
  ]);

/**
 * Generate a checkbox based on title and field to change
 * @param {Object} model
 * @param {string} title
 * @param {number} index
 * @return {vnode}
 */
const checkBox = (model, title, index) => h('label.d-inline.f6.ph1', {
  style: 'white-space: nowrap',
  title: `Toggle selection of Link #${index}`
}, h('input', {
  type: 'checkbox',
  onchange: () => model.configuration.toggleLinkSelection(index)
}), title);
