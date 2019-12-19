import {h, iconChevronBottom, iconChevronRight} from '/js/src/index.js';
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
  h('.p2.mh2.mv3.shadow-level1',
    [
      actionDropdown(model)
    ]
  );

/**
 * vnode with the possible roc actions
 * @param {Object} model
 * @return {vnode}
 */
const actionDropdown = (model) =>
  h('.m2.w-50', [
    h('h5', 'ROC Action:'),
    h('', {style: 'display: flex; flex-direction: row;'}, [
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
      h('button.btn.btn-primary.mh2', {title: 'Run command for the selected CRUs', disabled: true}, 'Run')
    ])
  ]);
/**
 * vnode with the CRU table
 * @param {Object} model
 * @param {Map<string, JSON>} cruMap
 * @return {vnode}
 */
const cruTable = (model, cruMap) =>
  h('.mh2.shadow-level1', [
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
        Object.keys(cruMap).map((hostName) =>
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
