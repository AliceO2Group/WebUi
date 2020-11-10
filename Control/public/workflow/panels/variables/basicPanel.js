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

import {h} from '/js/src/index.js';

/**
 * Panel which allows the user to select various options
 * to configure the workflow
 * @param {Object} workflow
 * @return {vnode}
 */
export default (workflow) =>
  h('', [
    h('h5.bg-gray-light.p2.panel-title.w-100.flex-row', h('.w-100', 'Basic Configuration')),
    h('.p2.panel', [
      triggerPanel(workflow),
      dataDistributionPanel(workflow),
      epnPanel(workflow),
      qcddPanel(workflow),
      readoutPanel(workflow),
      qcUriPanel(workflow)
    ])
  ]);

/**
 * Panel for displaying options for the trigger
 * @param {Object} workflow
 * @return {vnode}
 */
const triggerPanel = (workflow) =>
  h('.flex-row.text-left.w-50', [
    h('.w-50', 'Trigger:'),
    h('.w-25.form-check', [
      h('input.form-check-input', {
        type: 'radio',
        name: 'trigger',
        id: 'triggerOff',
        checked: workflow.form.basicVariables['roc_ctp_emulator_enabled'] === 'false',
        onchange: () => workflow.form.basicVariables['roc_ctp_emulator_enabled'] = 'false'
      }),
      h('label', {for: 'triggerOff'}, 'OFF')
    ]),
    h('.w-25.form-check', [
      h('input.form-check-input disabled', {
        type: 'radio',
        name: 'trigger',
        id: 'triggerEmu',
        checked: workflow.form.basicVariables['roc_ctp_emulator_enabled'] === 'true',
        onchange: () => workflow.form.basicVariables['roc_ctp_emulator_enabled'] = 'true'
      }),
      h('label', {for: 'triggerEmu'}, 'EMU')
    ]),
  ]);

/**
 * Add a radio button group to select if data distribution should be set as on or off
 * If dd_enabled is set to false than odc_enabled and qcdd_enabled should be set to false
 * @param {Object} workflow
 * @return {vnode}
 */
const dataDistributionPanel = (workflow) =>
  h('.flex-row.text-left.w-50', [
    h('.w-50', 'Data Distribution:'),
    h('.w-25.form-check', [
      h('input.form-check-input', {
        type: 'radio',
        name: 'dataDistribution',
        id: 'dataDistributionOff',
        checked: workflow.form.basicVariables['dd_enabled'] === 'false',
        onchange: () => {
          workflow.updateBasicVariableByKey('odc_enabled', 'false');
          workflow.updateBasicVariableByKey('qcdd_enabled', 'false');
          workflow.updateBasicVariableByKey('dd_enabled', 'false');
        }
      }),
      h('label', {for: 'dataDistributionOff'}, 'OFF')
    ]),
    h('.w-25.form-check', [
      h('input.form-check-input disabled', {
        type: 'radio',
        name: 'dataDistribution',
        id: 'dataDistributionOn',
        checked: workflow.form.basicVariables['dd_enabled'] === 'true',
        onchange: () => workflow.form.basicVariables['dd_enabled'] = 'true'
      }),
      h('label', {for: 'dataDistributionOn'}, 'ON')
    ]),
  ]);

/**
 * Add a radio button group to select if EPN cluster should be set as on or off
 * If odc_enabled is set as true than dd_enabled should be set to true
 * @param {Object} workflow
 * @return {vnode}
 */
const epnPanel = (workflow) =>
  h('.flex-row.text-left.w-50', [
    h('.w-50', 'EPN:'),
    h('.w-25.form-check', [
      h('input.form-check-input', {
        type: 'radio',
        name: 'epn',
        id: 'epnOff',
        checked: workflow.form.basicVariables['odc_enabled'] === 'false',
        onchange: () => workflow.form.basicVariables['odc_enabled'] = 'false'
      }),
      h('label', {for: 'epnOff'}, 'OFF')
    ]),
    h('.w-25.form-check', [
      h('input.form-check-input disabled', {
        type: 'radio',
        name: 'epn',
        id: 'epnOn',
        checked: workflow.form.basicVariables['odc_enabled'] === 'true',
        onchange: () => {
          workflow.updateBasicVariableByKey('odc_enabled', 'true');
          workflow.updateBasicVariableByKey('dd_enabled', 'true');
        }
      }),
      h('label', {for: 'epnOn'}, 'ON')
    ]),
  ]);

/**
 * Add a radio button group to select if QC should be set as on or off
 * If qcdd_enabled is set as true than dd_enabled should be set to true
 * @param {Object} workflow
 * @return {vnode}
 */
const qcddPanel = (workflow) =>
  h('.flex-row.text-left.w-50', [
    h('.w-50', 'QC:'),
    h('.w-25.form-check', [
      h('input.form-check-input', {
        type: 'radio',
        name: 'qcdd',
        id: 'qcddOff',
        checked: workflow.form.basicVariables['qcdd_enabled'] === 'false',
        onchange: () => workflow.form.basicVariables['qcdd_enabled'] = 'false'
      }),
      h('label', {for: 'qcddOff'}, 'OFF')
    ]),
    h('.w-25.form-check', [
      h('input.form-check-input disabled', {
        type: 'radio',
        name: 'qcdd',
        id: 'qcddOn',
        checked: workflow.form.basicVariables['qcdd_enabled'] === 'true',
        onchange: () => {
          workflow.updateBasicVariableByKey('qcdd_enabled', 'true');
          workflow.updateBasicVariableByKey('dd_enabled', 'true');
        }
      }),
      h('label', {for: 'qcddOn'}, 'ON')
    ]),
  ]);

/**
 * Add a text input field so that the user can fill in the readout_uri
 * @param {Object} workflow
 * @return {vnode}
 */
const readoutPanel = (workflow) => {
  const noPre = workflow.READOUT_PREFIX.NONE;
  const filePre = workflow.READOUT_PREFIX.FILE;
  const consulPre = workflow.READOUT_PREFIX.CONSUL;
  const variables = workflow.form.basicVariables;
  return h('.flex-column.text-left', [
    h('.w-100.flex-row', [
      h('.w-25', {style: 'display: flex; align-items: center;'}, 'Readout URI:'),
      h('.w-75.flex-row', [
        h('', {style: 'width:15%'},
          h('select.form-control', {
            style: 'cursor: pointer',
            onchange: (e) => {
              if (e.target.value !== noPre) {
                variables['readout_cfg_uri_pre'] = e.target.value;
              } else {
                delete variables['readout_cfg_uri_pre'];
              }
              workflow.notify();
            }
          }, [
            h('option', {
              id: 'noOption',
              value: noPre,
              selected: !variables['readout_cfg_uri_pre'] || variables['readout_cfg_uri_pre'] === noPre
            }, noPre),
            h('option', {
              id: 'fileOption',
              value: filePre,
              selected: variables['readout_cfg_uri_pre'] === filePre
            }, filePre),
            h('option', {
              id: 'consulOption',
              value: consulPre,
              disabled: workflow.consulReadoutPrefix ? false : true,
              selected: variables['readout_cfg_uri_pre'] === consulPre
            }, consulPre)
          ])
        ),
        h('.flex-row', {style: 'width:85%;'}, [
          // h('input.form-control', {
          //   style: 'width: 70%',
          //   value: workflow.consulReadoutPrefix,
          //   disabled: true
          // }),
          h('input.form-control', {
            type: 'text',
            // style: 'width: 30%',
            value: variables['readout_cfg_uri'],
            oninput: (e) => {
              if (e.target.value !== '' && !variables['readout_cfg_uri_pre']) {
                variables['readout_cfg_uri_pre'] = filePre;
              }
              if (e.target.value === '') {
                delete variables['readout_cfg_uri'];
                delete variables['readout_cfg_uri_pre'];
              } else {
                variables['readout_cfg_uri'] = e.target.value;
              }
              workflow.notify();
            }
          })
        ])

      ])
    ]),
    variables['readout_cfg_uri_pre'] === consulPre &&
    h('.w-100.flex-row', [
      h('.w-25'),
      h('label.w-75.f5', {
        style: 'font-style: italic'
      }, consulPre + workflow.consulReadoutPrefix + (
        variables['readout_cfg_uri'] ?
          variables['readout_cfg_uri'] : '')
      )
    ])
  ]);
};

/**
 * Add a text input field so that the user can fill in the qc_uri
 * @param {Object} workflow
 * @return {vnode}
 */
const qcUriPanel = (workflow) => {
  const noPre = workflow.QC_PREFIX.NONE;
  const filePre = workflow.QC_PREFIX.JSON;
  const consulPre = workflow.QC_PREFIX.CONSUL;
  const variables = workflow.form.basicVariables;
  return h('.flex-column.text-left.mv2', [
    h('.w-100.flex-row', [
      h('.w-25', {style: 'display: flex; align-items: center;'}, 'QC URI:'),
      h('.w-75.flex-row', [
        h('', {style: 'width:30%'},
          h('select.form-control', {
            style: 'cursor: pointer',
            onchange: (e) => {
              if (e.target.value !== noPre) {
                variables['qc_config_uri_pre'] = e.target.value;
              } else {
                delete variables['qc_config_uri_pre'];
              }
              workflow.notify();
            }
          }, [
            h('option', {
              id: 'noOption',
              value: noPre,
              selected: !variables['qc_config_uri_pre'] || variables['qc_config_uri_pre'] === noPre
            }, noPre),
            h('option', {
              id: 'fileOption',
              value: filePre,
              selected: variables['qc_config_uri_pre'] === filePre
            }, filePre),
            h('option', {
              id: 'consulOption',
              value: consulPre,
              disabled: workflow.consulQcPrefix ? false : true,
              selected: variables['qc_config_uri_pre'] === consulPre
            }, consulPre)
          ])
        ),
        h('input.form-control', {
          type: 'text',
          value: variables['qc_config_uri'],
          oninput: (e) => {
            if (e.target.value !== '' && !variables['qc_config_uri_pre']) {
              variables['qc_config_uri_pre'] = filePre;
            }
            if (e.target.value === '') {
              delete variables['qc_config_uri'];
              delete variables['qc_config_uri_pre'];
            } else {
              variables['qc_config_uri'] = e.target.value;
            }
            workflow.notify();
          }
        })
      ])
    ]),
    variables['qc_config_uri_pre'] === consulPre &&
    h('.w-100.flex-row', [
      h('.w-25'),
      h('label.w-75.f5', {
        style: 'font-style: italic'
      }, consulPre + workflow.consulQcPrefix + (
        variables['qc_config_uri'] ?
          variables['qc_config_uri'] : '')
      )
    ])
  ]);
};
