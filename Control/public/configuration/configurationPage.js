import {h, iconChevronBottom, iconChevronRight, iconKey} from '/js/src/index.js';
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
  h('.w-50 text-center', [
    h('h4', 'Configuration')
  ]),
  h('.flex-grow text-right', [

  ])
];

/**
 * Content of configuration page
 * @param {Object} model
 * @return {vnode}
 */
export const content = (model) => h('.scroll-y.absolute-fill', [
  model.configuration.cruList.match({
    NotAsked: () => null,
    Loading: () => h('.w-100.text-center', pageLoading()),
    Success: (cruMap) => buildPage(model, cruMap),
    Failure: (error) => h('.w-100.text-center', pageError(error)),
  })
]);

/**
 * vnode with the configuration
 * @param {Object} model
 * @param {JSON} cruMap
 * @return {vnode}
 */
const buildPage = (model, cruMap) =>
  h('.p2', [
    actionForm(model),
    h('h4.mh2.mv2', 'Readout Cards Table'),
    cruTable(model, cruMap)
  ]);

/**
 * vnode with the action panel (roc-config/status)
 * @param {Object} model
 * @return {vnode}
 */
const actionForm = (model) =>
  h('.p2.mv3.w-100.shadow-level1',
    [
      actionPanel(model),
      expertPanel(model, model.configuration.actionPanel.expertOptions),
    ]
  );

/**
 * vnode with the possible roc actions
 * @param {Object} model
 * @return {vnode}
 */
const actionPanel = (model) =>
  h('.flex-row.w-100.pv2', [
    h('h4', 'Action:'),
    h('.w-25.mh2', {style: 'display: flex; flex-direction: row;'}, [
      h('select.form-control', {
        style: 'cursor: pointer',
        onchange: (e) => model.configuration.setCommand(e.target.value)
      }, [
        h('option', {
          selected: 'CONFIG' === model.configuration.actionPanel.command ? true : false, value: 'CONFIG'
        }, 'roc-config'),
        h('option', {
          selected: 'STATUS' === model.configuration.actionPanel.command ? true : false, value: 'STATUS'
        }, 'roc-status')
      ]),
    ]),
    runPanel(model)
  ]);

/**
 * Panel containing running buttons
 * @param {Object} model
 * @return {vnode}
 */
const runPanel = (model) =>
  h('.btn-group.mh2', {
    style: 'justify-content:right; display: flex',
  }, [
    h('button.btn.btn-primary', {
      title: 'Run command for the selected CRUs',
      disabled: false,
      onclick: () => model.configuration.confirmSelectionAndRunCommand()
    }, 'Run'),
    h('button.btn', {
      onclick: () => model.configuration.toggleExpertPanel(),
      title: 'Show Expert Panel',
      disabled: false
    }, iconKey())
  ]);

/**
 * vnode with expert panel allowing the user to change defaults for the command
 * @param {Object} model
 * @param {options} options
 * @return {vnode}
 */
const expertPanel = (model, options) =>
  h('', {
    style: {
      transition: 'max-height 0.5s',
      overflow: 'hidden',
      // 'max-height': model.configuration.actionPanel.expertMode ? '50em' : 0,
      height: 'auto'
    }
  }, [
    h('h4', 'Expert Panel:'),
    h('.flex-row.w-100.pv2', [
      dropDown(model, 'Allow rejection', ['TRUE', 'FALSE'], 'allowRejection'),
      dropDown(model, 'Loopback', ['TRUE', 'FALSE'], 'loopback'),
      dropDown(model, 'PON Upstream', ['TRUE', 'FALSE'], 'ponUpstream'),
    ]),
    h('.flex-row.w-100.pv2', [
      dropDown(model, 'DYN Offset', ['TRUE', 'FALSE'], 'dynOffset'),
      dropDown(model, 'Clock Argument', ['LOCAL', 'TTC'], 'clock'),
      dropDown(model, 'Data Path Mode', ['PACKET', 'CONTINUOUS'], 'dataPathMode'),
    ]),
    h('.flex-row.w-100.pv2', [
      dropDown(model, 'Down Stream Data', ['CTP', 'PATTERN', 'MIDTRG'], 'downStreamData'),
      dropDown(model, 'GBT Mode', ['GBT', 'WB'], 'gbtMode'),
      dropDown(model, 'GBT MUX', ['TTC', 'DDG', 'SWT'], 'gbtMux'),
    ]),
    h('.flex-row.w-100.pv2',
      inputNumberBox(model, 'Trigger Window Size', 0, 4095, 'triggerWindowSize'),
      inputTextBox(model, 'CRU-Id', 'cruId'),
      inputTextBox(model, 'ONU Address', 'onuAddress'),
    ),

    h('.flex-row.w-100.pv2', [

    ]),
    h('.w-100.pv2',
      h('.flex-row.w-100', [
        h('.ph1.w-25', 'Links'),
        h('.w-100.mh2', {style: 'display: flex; justify-content: space-between; flex-wrap: wrap;'}, [
          options.links.map((link, index) => checkBox(model, `Link #${index}`, index)),
        ])
      ])
    ),
    h('.w-100.pv2.ph1', [
      h('', 'ROC Command:'),
      h('pre', `roc-command -id=`)
    ])
  ]);

/**
 * vnode with the CRU table
 * @param {Object} model
 * @param {Map<string, JSON>} cruMap
 * @return {vnode}
 */
const cruTable = (model, cruMap) =>
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
        Object.keys(cruMap).length === 0 ?
          h('tr', h('td', {colspan: 9, style: 'text-align: center;'}, 'No data found'))
          : Object.keys(cruMap).map((hostName) =>
            [h('tr', [
              h('td.text-center', {
                title: 'Show/Hide CRUs for this host',
                onclick: () => model.configuration.toggleHostRow(hostName)
              }, cruMap[hostName].open ? iconChevronBottom() : iconChevronRight()),
              h('td', {onclick: () => model.configuration.toggleAllCRUsForHost(hostName)},
                h('label.d-inline.actionable-row', {title: 'Select / Unselect all CRUs for this host'},
                  h('input.actionable-row', {
                    type: 'checkbox',
                    title: 'Select / Unselect all CRUs for this host',
                    checked: model.configuration.areAllCRUsForHostSelected(hostName), // add from somewhere in JSON
                  })
                )
              ),
              h('td', {onclick: () => model.configuration.toggleAllCRUsForHost(hostName)}, hostName),
              h('td', ''),
              h('td', ''),
              h('td', ''),
              h('td', ''),
              h('td', ''),
              h('td', ''),
            ]),
            cruMap[hostName].open && Object.keys(cruMap[hostName].objects).map((card) =>
              h('tr', {onclick: () => model.configuration.toggleCRUSelection(hostName, card)}, [
                h('td', ''),
                h('td', ''),
                h('td', ''),
                h('td', h('label.d-inline.actionable-row', {title: 'Select / Unselect this CRU'},
                  h('input.actionable-row', {
                    type: 'checkbox',
                    title: 'Select / Unselect this CRU',
                    checked: cruMap[hostName].objects[card].checked,
                  }))),
                h('td', cruMap[hostName].objects[card].type),
                h('td', cruMap[hostName].objects[card].endpoint),
                h('td', cruMap[hostName].objects[card].pciAddress),
                h('td', cruMap[hostName].objects[card].firmware),
                h('td', cruMap[hostName].objects[card].serial),
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
const dropDown = (model, title, options, field) =>
  h('.flex-row.w-50',
    [
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
    ]
  );

/**
 * Generate a component with an input string box
 * @param {Object} model
 * @param {string} title
 * @param {string} field
 * @return {vnode}
 */
const inputTextBox = (model, title, field) =>
  h('.flex-row.w-50', [
    h('.w-33', title),
    h('.w-50.mh2',
      h('input.form-control', {
        type: 'text',
        value: field,
        // onkeyup: (e) => workflow.updateInputSearch('revision', e.target.value),
        // onclick: (e) => {
        //   workflow.setRevisionInputDropdownVisibility('revision', true);
        //   e.stopPropagation();
        // }
      }, field)
    )
  ]);

/**
* Generate a component with an input string box
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
        // value: field,
        // onkeyup: (e) => workflow.updateInputSearch('revision', e.target.value),
        // onclick: (e) => {
        //   workflow.setRevisionInputDropdownVisibility('revision', true);
        //   e.stopPropagation();
        // }
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
const checkBox = (model, title, index) =>
  h('label.d-inline.f6.ph1', {style: 'white-space: nowrap', title: `Toggle selection of Link`},
    h('input', {
      type: 'checkbox',
      onchange: () => model.configuration.toggleLinkSelection(index)
    }), title
  );
