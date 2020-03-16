import {h, iconChevronBottom, iconChevronRight, iconCircleX, info} from '/js/src/index.js';
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
const actionForm = (model) => h('.p2.mv3.w-100', [
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
const expertPanel = (model, options) => h('.pv3', {
  class: model.configuration.actionPanel.runButtonDisabled ? 'disabled-content' : '',
  style: {
    transition: 'max-height 0.5s',
    overflow: 'hidden',
    // 'max-height': model.configuration.actionPanel.expertMode ? '50em' : 0,
    height: 'auto'
  }
}, [
  h('h4.pv2', 'Flags:'),
  h('.flex-column', [
    h('h5.bg-gray-light.p2.panel-title', 'Clock Settings'),
    h('.flex-row.w-100.p2.panel', [
      inputNumberBox(model, 'ONU Address', 0, Math.pow(2, 31 - 1), 'onu-address', 'ONU address for PON upstream'),
      dropDown(model, 'PON Upstream', ['TRUE', 'FALSE'], 'pon-upstream', 'Enables PON upstream'),
      dropDown(model, 'Clock', ['LOCAL', 'TTC'], 'clock', 'LOCAL => CRU internal CLOCK ; TTC => CLOCK from LTU'),
    ])
  ]),
  h('.flex-column.mv3', [
    h('h5.panel-title.p2', 'Dataflow Settings'),
    h('.panel.p2', [
      h('.flex-row.w-100', [
        inputNumberBox(model, 'CRU-ID', 0, Math.pow(2, 31 - 1), 'cru-id', '12-bit CRU ID'),
        inputNumberBox(model, 'Trigger Window Size', 0, 4095, 'trigger-window-size', 'Size of the trigger window in GBT words'),
        dropDown(model, 'Allow rejection', ['TRUE', 'FALSE'], 'allow-rejection', 'Allows HBF (HeartBeat Frame) rejection'),
      ]),
      h('.flex-row.w-100.pv2', [
        dropDown(model, 'Downstream Data', ['CTP', 'PATTERN', 'MIDTRG'], 'downstreamdata', 'CTP, PATTERN, MIDTRG'),
        dropDown(model, 'Loopback', ['TRUE', 'FALSE'], 'loopback', 'Enables link loopback'),
        dropDown(model, 'Datapath Mode', ['PACKET', 'CONTINUOUS'], 'datapathmode', 'PACKET, CONTINUOUS'),
      ]),
      h('.flex-row.w-100.pv2', [
        dropDown(model, 'DYN Offset', ['TRUE', 'FALSE'], 'dyn-offset', 'Enables the dynamic offset'),
        h('.w-33'), h('.w-33'),
      ]),
    ])
  ]),
  h('.flex-column', [
    h('h5.panel-title.p2', 'Link Settings'),
    h('.panel.p2', [
      h('.flex-row.w-100.p2', [
        dropDown(model, 'GBT Mode', ['GBT', 'WB'], 'gbtmode', 'GBT, WB'),
        dropDown(model, 'GBT MUX', ['TTC', 'DDG', 'SWT'], 'gbtmux', 'TTC, DDG, SWT'),
        h('.w-33')]
      ),
      h('.flex-row.w-100.p1', [
        h('.tooltip', {
          style: 'width: 12.5%;border: 0'
        }, [
          h('label', {
            style: 'cursor: help'
          }, 'Links'),
          h('span.tooltiptext', 'Enables checked links')
        ]),
        h('.w-100.mh2', {style: 'display: flex; justify-content: space-between; flex-wrap: wrap;'}, [
          h('label.d-inline.f6.ph1', {style: 'white-space: nowrap', title: `Toggle selection of all links`},
            h('input', {
              type: 'checkbox',
              checked: model.configuration.areAllLinksSelected(),
              onchange: () => model.configuration.toggleAllLinksSelection()
            }), 'Toggle all'),
          options.links.map((link, index) => index !== 12 && checkBox(model, `Link #${index}`, index)),
        ])
      ])
    ])
  ]),
  h('.flex-column.mv3', [
    h('h5.panel-title.p2', 'Miscellaneous'),
    h('.flex-row.w-100.p2.panel', [
      dropDown(model, 'Force config', ['TRUE', 'FALSE'], 'force-config',
        'Flag to force configuration (needed to force the clock configuration)'),
    ]),
    h('.flex-row.w-50'),
    h('.flex-row.w-50'),
  ]),
  displayCommandPanel(model.configuration),
]);

/**
 * vnode with the roc command as a string
 * @param {Object} configuration
 * @return {vnode}
 */
const displayCommandPanel = (configuration) => h('.w-100', [
  h('h5.panel-title.p2', 'Command:'),
  h('.panel.p2', ['roc-config',
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
  h('.p2', [
    h('table.table.table-sm', [
      h('thead.panel-title', [
        h('tr', [
          h('th.actionable-row', {
            style: 'width:0',
            title: 'Open / Close all rows by HostName',
            onclick: () => model.configuration.toggleAllHostRows()
          }, model.configuration.areAllHostRowsOpened() ? iconChevronBottom() : iconChevronRight()),
          h('th', {style: 'width:0'},
            h('input.actionable-row', {
              type: 'checkbox',
              title: 'Toggle selection of all hosts',
              onclick: () => model.configuration.toggleSelectionOfAllReadoutCards(),
              checked: model.configuration.areAllReadoutCardsSelected()
            })
          ),
          h('th', 'Hostname'),
          h('th', {style: 'width:0;'}, ''),
          h('th', 'Type'),
          h('th', 'Endpoint'),
          h('th', 'PCI Address'),
          h('th', 'Firmware'),
          h('th', 'Serial')
        ])
      ]),
      h('tbody.actionable-row.panel', [
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
                    title: 'Toggle selection of all CRUs for this host',
                    checked: model.configuration.areAllReadoutCardsForHostSelected(hostName),
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
 * @param {string} help
 * @return {vnode}
 */
const dropDown = (model, title, options, field, help) =>
  h('.flex-row.w-33', [
    h('.w-33.tooltip', {style: 'border: 0'}, [
      h('label', {style: 'cursor: help'}, title),
      h('span.tooltiptext', help)
    ]),
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
* @param {string} help
* @return {vnode}
*/
const inputNumberBox = (model, title, min, max, field, help) =>
  h('.flex-row.w-33', [
    h('.w-33.tooltip', {style: 'border: 0'}, [
      h('label', {style: 'cursor: help'}, title),
      h('span.tooltiptext', help)
    ]),
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
  checked: model.configuration.actionPanel.expertOptions.links[index],
  onchange: () => model.configuration.toggleLinkSelection(index)
}), title);
