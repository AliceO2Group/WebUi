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

/* global COG */

import {h} from '/js/src/index.js';
/**
 * Panel which allows the user to select various options
 * to configure the workflow
 * @param {Object} workflow
 * @return {vnode}
 */
const basicPanel = (workflow) =>
  h('.w-100', [
    h('h5.bg-gray-light.p2.panel-title.w-100.flex-row', h('.w-100', 'General Configuration')),
    h('.p2.panel', [
      dcsPanel(workflow),
      dataDistributionPanel(workflow),
      epnPanel(workflow),
      qcddPanel(workflow),
      dplMwPanel(workflow),
      readoutPanel(workflow),
      qcUriPanel(workflow)
    ])
  ]);

/**
 * Add a radio button group to select if dcs(dcs_enabled) should be set as on or off
 * @param {Object} workflow
 * @return {vnode}
 */
const dcsPanel = (workflow) =>
  h('.flex-row.text-left.w-70', [
    h('.w-50', {
      style: 'cursor: pointer',
      onclick: () => {
        if (workflow.form.basicVariables['dcs_enabled'] === 'true') {
          workflow.updateBasicVariableByKey('dcs_enabled', 'false');
        } else {
          workflow.updateBasicVariableByKey('dcs_enabled', 'true');
        }
      },
    }, 'DCS:'),
    h('.w-25.form-check', [
      h('input.form-check-input', {
        type: 'radio',
        name: 'dcs',
        id: 'dcsOff',
        checked: workflow.form.basicVariables['dcs_enabled'] === 'false',
        onchange: () => workflow.updateBasicVariableByKey('dcs_enabled', 'false'),
      }),
      h('label', {for: 'dcsOff'}, 'OFF')
    ]),
    h('.w-25.form-check', [
      h('input.form-check-input disabled', {
        type: 'radio',
        name: 'dcs',
        id: 'dcsOn',
        checked: workflow.form.basicVariables['dcs_enabled'] === 'true',
        onchange: () => workflow.updateBasicVariableByKey('dcs_enabled', 'true'),
      }),
      h('label', {for: 'dcsOn'}, 'ON')
    ]),
  ]);

/**
 * Add a radio button group to select if data distribution should be set as on or off
 * If dd_enabled is set to false than ddsched_enabled, odc_enabled and qcdd_enabled should be set to false
 * @param {Object} workflow
 * @return {vnode}
 */
const dataDistributionPanel = (workflow) =>
  h('.flex-row.text-left.w-70', [
    h('.w-50', {
      style: 'cursor: pointer',
      onclick: () => {
        if (workflow.form.basicVariables['dd_enabled'] === 'true') {
          workflow.updateBasicVariableByKey('ddsched_enabled', 'false');
          workflow.updateBasicVariableByKey('odc_enabled', 'false');
          workflow.updateBasicVariableByKey('qcdd_enabled', 'false');
          workflow.updateBasicVariableByKey('dd_enabled', 'false');
          workflow.updateBasicVariableByKey('minimal_dpl_enabled', 'false');
        } else {
          workflow.updateBasicVariableByKey('dd_enabled', 'true');
        }
      },
    }, 'Data Distribution:'),
    h('.w-25.form-check', [
      h('input.form-check-input', {
        type: 'radio',
        name: 'dataDistribution',
        id: 'dataDistributionOff',
        checked: workflow.form.basicVariables['dd_enabled'] === 'false',
        onchange: () => {
          workflow.updateBasicVariableByKey('ddsched_enabled', 'false');
          workflow.updateBasicVariableByKey('odc_enabled', 'false');
          workflow.updateBasicVariableByKey('qcdd_enabled', 'false');
          workflow.updateBasicVariableByKey('dd_enabled', 'false');
          workflow.updateBasicVariableByKey('minimal_dpl_enabled', 'false');
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
        onchange: () => workflow.updateBasicVariableByKey('dd_enabled', 'true'),
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
  h('.flex-row.text-left.w-70', [
    h('.w-50', {
      style: 'cursor: pointer',
      onclick: () => {
        if (workflow.form.basicVariables['odc_enabled'] === 'true') {
          workflow.updateBasicVariableByKey('odc_enabled', 'false');
          workflow.updateBasicVariableByKey('ddsched_enabled', 'false');
        } else {
          workflow.updateBasicVariableByKey('odc_enabled', 'true');
          workflow.updateBasicVariableByKey('ddsched_enabled', 'true');
          workflow.updateBasicVariableByKey('dd_enabled', 'true');
        }
      },
    }, 'EPN:'),
    h('.w-25.form-check', [
      h('input.form-check-input', {
        type: 'radio',
        name: 'epn',
        id: 'epnOff',
        checked: (workflow.form.basicVariables['odc_enabled'] === 'false'
        || workflow.form.basicVariables['ddsched_enabled'] === 'false'),
        onchange: () => {
          workflow.updateBasicVariableByKey('odc_enabled', 'false');
          workflow.updateBasicVariableByKey('ddsched_enabled', 'false');
        }
      }),
      h('label', {for: 'epnOff'}, 'OFF')
    ]),
    h('.w-25.form-check', [
      h('input.form-check-input disabled', {
        type: 'radio',
        name: 'epn',
        id: 'epnOn',
        checked: (workflow.form.basicVariables['odc_enabled'] === 'true'
        && workflow.form.basicVariables['ddsched_enabled'] === 'true'),
        onchange: () => {
          workflow.updateBasicVariableByKey('odc_enabled', 'true');
          workflow.updateBasicVariableByKey('ddsched_enabled', 'true');
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
  h('.flex-row.text-left.w-70', [
    h('.w-50', {
      style: 'cursor: pointer',
      onclick: () => {
        if (workflow.form.basicVariables['qcdd_enabled'] === 'true') {
          workflow.updateBasicVariableByKey('qcdd_enabled', 'false');
        } else {
          workflow.updateBasicVariableByKey('qcdd_enabled', 'true');
          workflow.updateBasicVariableByKey('dd_enabled', 'true');
          workflow.updateBasicVariableByKey('minimal_dpl_enabled', 'false');
        }
      },
    }, 'General QC (FLP):'),
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
          workflow.updateBasicVariableByKey('minimal_dpl_enabled', 'false');
        }
      }),
      h('label', {for: 'qcddOn'}, 'ON')
    ]),
  ]);


/**
 * Add a radio button group to enable or disable DPL Minimal workflow
 * DPL Minimal workflow required DD, but when on QC needs to be off
 * @param {Object} workflow
 * @return {vnode}
 */
const dplMwPanel = (workflow) =>
  h('.flex-row.text-left.w-70', [
    h('.w-50', {
      style: 'cursor: pointer',
      onclick: () => {
        if (workflow.form.basicVariables['minimal_dpl_enabled'] === 'true') {
          workflow.updateBasicVariableByKey('minimal_dpl_enabled', 'false');
        } else {
          workflow.updateBasicVariableByKey('minimal_dpl_enabled', 'true');
          workflow.updateBasicVariableByKey('dd_enabled', 'true');
          workflow.updateBasicVariableByKey('qcdd_enabled', 'false');
        }
      },
    }, 'Minimal DPL workflow:'),
    h('.w-25.form-check', [
      h('input.form-check-input', {
        type: 'radio',
        name: 'dplmw',
        id: 'dplMwOff',
        checked: workflow.form.basicVariables['minimal_dpl_enabled'] === 'false',
        onchange: () => workflow.updateBasicVariableByKey('minimal_dpl_enabled', 'false')
      }),
      h('label', {for: 'dplMwOff'}, 'OFF')
    ]),
    h('.w-25.form-check', [
      h('input.form-check-input disabled', {
        type: 'radio',
        name: 'dplmw',
        id: 'dplMwOn',
        checked: workflow.form.basicVariables['minimal_dpl_enabled'] === 'true',
        onchange: () => {
          workflow.updateBasicVariableByKey('minimal_dpl_enabled', 'true');
          workflow.updateBasicVariableByKey('dd_enabled', 'true');
          workflow.updateBasicVariableByKey('qcdd_enabled', 'false');
        }
      }),
      h('label', {for: 'dplMwOn'}, 'ON')
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
            id: 'readoutURISelection',
            onchange: (e) => {
              if (e.target.value !== noPre) {
                variables['readout_cfg_uri_pre'] = e.target.value;
              } else {
                delete variables['readout_cfg_uri_pre'];
                delete variables['readout_cfg_uri'];
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
              disabled: COG.CONSUL.readoutPrefix ? false : true,
              selected: variables['readout_cfg_uri_pre'] === consulPre
            }, consulPre)
          ])
        ),
        h('.flex-row', {style: 'width:85%;'}, [
          variables['readout_cfg_uri_pre'] === consulPre && h('input.form-control.w-60', {
            value: COG.CONSUL.readoutPrefix,
            disabled: true
          }),
          variables['readout_cfg_uri_pre'] && h('input.form-control', {
            type: 'text',
            class: variables['readout_cfg_uri_pre'] === consulPre ? 'w-40' : 'w-100',
            value: variables['readout_cfg_uri'],
            oninput: (e) => {
              if (e.target.value !== '' && !variables['readout_cfg_uri_pre']) {
                variables['readout_cfg_uri_pre'] = filePre;
              }
              if (e.target.value === '') {
                delete variables['readout_cfg_uri'];
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
      h('a.w-75.f5.action', {
        style: 'font-style: italic; cursor: pointer',
        href: `//${COG.CONSUL.kvStoreReadout}/${(
          variables['readout_cfg_uri'] ?
            variables['readout_cfg_uri'] + '/edit' : '')}`,
        target: '_blank',
      }, consulPre + COG.CONSUL.kvStoreReadout + (
        variables['readout_cfg_uri'] ?
          variables['readout_cfg_uri'] : '')
      )
    ])
  ]);
};

/**
 * Add a text input field so that the user can fill in the readout_uri
 * @param {Object} workflow
 * @return {vnode}
 */
const qcUriPanel = (workflow) => {
  const noPre = workflow.QC_PREFIX.NONE;
  const filePre = workflow.QC_PREFIX.JSON;
  const consulPre = workflow.QC_PREFIX.CONSUL;
  const variables = workflow.form.basicVariables;
  return h('.flex-column.text-left', [
    h('.w-100.flex-row', [
      h('.w-25', {style: 'display: flex; align-items: center;'}, 'QC URI:'),
      h('.w-75.flex-row', [
        h('', {style: 'width:15%'},
          h('select.form-control', {
            style: 'cursor: pointer',
            id: 'qcURISelection',
            onchange: (e) => {
              if (e.target.value !== noPre) {
                variables['qc_config_uri_pre'] = e.target.value;
              } else {
                delete variables['qc_config_uri_pre'];
                delete variables['qc_config_uri'];
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
              disabled: COG.CONSUL.qcPrefix ? false : true,
              selected: variables['qc_config_uri_pre'] === consulPre
            }, consulPre)
          ])
        ),
        h('.flex-row', {style: 'width:85%;'}, [
          variables['qc_config_uri_pre'] === consulPre && h('input.form-control.w-60', {
            value: COG.CONSUL.qcPrefix,
            disabled: true
          }),
          variables['qc_config_uri_pre'] && h('input.form-control', {
            type: 'text',
            class: variables['qc_config_uri_pre'] === consulPre ? 'w-40' : 'w-100',
            value: variables['qc_config_uri'],
            oninput: (e) => {
              if (e.target.value !== '' && !variables['qc_config_uri_pre']) {
                variables['qc_config_uri_pre'] = filePre;
              }
              if (e.target.value === '') {
                delete variables['qc_config_uri'];
              } else {
                variables['qc_config_uri'] = e.target.value;
              }
              workflow.notify();
            }
          })
        ])
      ])
    ]),
    variables['qc_config_uri_pre'] === consulPre &&
    h('.w-100.flex-row', [
      h('.w-25'),
      h('a.w-75.f5.action', {
        style: 'font-style: italic; cursor: pointer',
        href: `//${COG.CONSUL.kvStoreQC}/${(
          variables['qc_config_uri'] ?
            variables['qc_config_uri'] + '/edit' : '')}`,
        target: '_blank',
      }, consulPre + COG.CONSUL.kvStoreQC + (
        variables['qc_config_uri'] ?
          variables['qc_config_uri'] : '')
      )
    ])
  ]);
};

export {basicPanel, readoutPanel, qcUriPanel};
