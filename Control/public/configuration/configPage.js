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

import {h, iconChevronBottom, iconChevronRight, iconCircleX} from '/js/src/index.js';
import pageLoading from '../common/pageLoading.js';
import errorPage from '../common/errorPage.js';
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
    Failure: (error) => h('.w-100.text-center', errorPage(error)),
  })
]);

/**
 * vnode with the configuration
 * @param {Object} model
 * @param {JSON} readoutCardsMap
 * @return {vnode}
 */
const buildPage = (model, readoutCardsMap) => h('.p3', [
  h('.flex-row.pv1', [
    h('h4.pv2.w-50', 'CRUs by hostname:'),
    h('.w-50.text-right', {
      style: 'display: flex; justify-content:end'
    }, h('button.btn.btn-primary', 'Save'))
  ]),
  // TODO loop through all crus
  h('', [
    h('h5.panel-title.p2.flex-row', [
      h('.w-15.flex-row', [
        h('.actionable-icon', {title: 'Open/Close CRUs configuration'}, iconChevronBottom()),
        h('.w-100.ph2', 'ali-flp-1')
      ]),
      h('.w-85.flex-row', [
        h('.w-25', 'Endpoint'),
        h('.w-25', 'PCI Address'),
        h('.w-25', 'Firmware'),
        h('.w-25', 'Serial'),
      ])
    ]),
    h('.panel', [
      cruPanel(model, model.configuration.actionPanel.expertOptions, 1, 0, 'af:00.0', 'f71faa86', 1239),
      cruPanel(model, model.configuration.actionPanel.expertOptions, 1, 0, '3b:00.0', 'f71faa86', 1041),
      cruPanel(model, model.configuration.actionPanel.expertOptions, 1, 1, '3c:00.0', 'f71faa86', 1041),
      cruPanel(model, model.configuration.actionPanel.expertOptions, 1, 1, 'b0:00.0', 'f71faa86', 1239),
    ])
  ]),
  h('', [
    h('h5.panel-title.p2.flex-row', [
      h('.w-15.flex-row.f5', [
        h('.actionable-icon', {title: 'Open/Close CRUs configuration'}, iconChevronRight()),
        h('.w-100.ph2', 'ali-flp-2')
      ]),
    ]),
    // h('.panel', [
    //   cruPanel(model, model.configuration.actionPanel.expertOptions, 1, 0, 'af:00.0', 'f71faa86', 1239),
    //   cruPanel(model, model.configuration.actionPanel.expertOptions, 1, 0, '3b:00.0', 'f71faa86', 1041),
    //   cruPanel(model, model.configuration.actionPanel.expertOptions, 1, 1, '3c:00.0', 'f71faa86', 1041),
    //   cruPanel(model, model.configuration.actionPanel.expertOptions, 1, 1, 'b0:00.0', 'f71faa86', 1239),
    // ])
  ]),
  h('', [
    h('h5.panel-title.p2.flex-row', [
      h('.w-15.flex-row.f5', [
        h('.actionable-icon', {title: 'Open/Close CRUs configuration'}, iconChevronRight()),
        h('.w-100.ph2', 'ali-flp-3')
      ]),
    ]),
  ]),
  h('', [
    h('h5.panel-title.p2.flex-row', [
      h('.w-15.flex-row.f5', [
        h('.actionable-icon', {title: 'Open/Close CRUs configuration'}, iconChevronRight()),
        h('.w-100.ph2', 'ali-flp-4')
      ]),
    ]),
  ]),

  // readoutCardsTable(model, readoutCardsMap)
]);

/**
 * vnode with expert panel allowing the user to change defaults for the command
 * @param {Object} model
 * @param {options} options
 * @return {vnode}
 */
const cruPanel = (model, options, index, endpoint, pci, firm, serial) => h('', {
}, [
  h('.flex-column', [
    h('h5.flex-row.p1.bg-gray-lighter', [
      h('.w-15.flex-row', [
        h('.w-25'),
        h('.actionable-icon', {title: 'Open/Close CRUs configuration'}, iconChevronBottom()),
      ]),
      h('.w-85.flex-row', [
        h('.w-25', endpoint),
        h('.w-25', serial),
        h('.w-25', pci),
        h('.w-25', firm),
      ])
    ]),
    h('.panel.p1.flex-row', [
      h('.w-15'),
      h('.flex-row.w-85.p1', [
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
          options.links.map((link, index) => index !== 12 && checkBox(model, `#${index}`, index)),
        ])
      ])
    ])
  ]),
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
              [h('tr', {onclick: () => model.configuration.toggleReadoutCardSelection(hostName, card)}, [
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
              h('tr', [
                h('td', ''),
                h('td', ''),
                h('td', ''),
                h('td', ''),
                h('td', {
                  colspan: 5
                },
                  h('.w-100.mh2', {style: 'display: flex; justify-content: space-between;'}, [
                    h('label.d-inline.f6.ph1', {style: 'white-space: nowrap', title: `Toggle selection of all links`},
                      h('input', {
                        type: 'checkbox',
                        checked: model.configuration.areAllLinksSelected(),
                        onchange: () => model.configuration.toggleAllLinksSelection()
                      }), 'Toggle all'),
                    checkBox(model, `#1`, 1),
                    checkBox(model, `#2`, 2),
                    checkBox(model, `#3`, 3),
                    checkBox(model, `#4`, 4),
                    checkBox(model, `#5`, 5),
                    checkBox(model, `#6`, 6),
                    checkBox(model, `#7`, 7),
                    checkBox(model, `#8`, 8),
                    checkBox(model, `#9`, 9),
                    checkBox(model, `#10`, 10),
                    checkBox(model, `#11`, 11),

                  ])
                )
              ])]
            ),

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
const dropDown = (model, title, options, field, help = undefined) =>
  h('.flex-row.w-33', [
    h('.w-33', {
      style: 'border: 0',
      class: help ? 'tooltip' : ''
    }, [
      h('label', {
        style: help ? 'cursor: help' : ''
      }, title),
      help && h('span.tooltiptext', help)
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
