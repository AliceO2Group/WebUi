const VARS = {
  roc_ctp_emulator_enabled: {
    allowedValues: [],
    defaultValue: 11,
    type: 1,
    label: 'ROC CTP emulator',
    description: '', // EDIT_BOX of type number with no priority on index'
    panel: 'mainPanel'
  },
  dcs_sor_parameters: {
    allowedValues: [],
    defaultValue: '{}',
    type: 4,
    label: 'DCS SOR parameters',
    description: '', // EDIT_BOX with condition to be displayed only if component is true (selected)
    panel: 'dcsPanel',
    visibleIf: '$$drop_caches_enabled_box === "true" && $$list_box_multi_list.includes("DCS")'
  },
  fmq_rate_logging: {
    allowedValues: [],
    defaultValue: '10',
    widget: 0,
    type: 1,
    index: 110,
    label: 'FairMQ rate logging',
    description: '', // EDIT_BOX of type number with condition on greater value
    panel: 'mainPanel',
    visibleIf: '$$roc_ctp_emulator_enabled > "20"'
  },
  combo_box: {
    allowedValues: ['component 0', 'compoent 11', 'none'],
    defaultValue: 'component 11',
    widget: 4,
    type: 1,
    label: 'Combo Box with restriction',
    description: '',// this is a combobox box of type number with condition on grater value and includes
    panel: 'mainPanel',
    visibleIf: '$$combo_box_other.includes("other")'
  },
  combo_box_other: {
    allowedValues: ['value zero', 'value one', 'value two', 'other'],
    defaultValue: 'value one', // this is a combobox box of type number with no restriction
    widget: 4,
    type: 1,
    label: 'Combo Box with no restriction',
    description: '',
    panel: 'mainPanel'
  },
  fmq_rate_logging_slide: {
    allowedValues: ['0', '100'],
    defaultValue: '10',
    widget: 1,
    type: 1,
    index: -100,
    label: 'Slider always on top',
    description: '', // this is a slider with no restrictions and placed at top
    panel: 'flpPanel',
    visibleIf: '$$list_box_single_string === "FLP Panel"'
  },
  fmq_rate_logging_slide_wrong: {
    allowedValues: ['0'],
    defaultValue: '10',
    widget: 1,
    type: 1,
    label: 'FairMQ rate logging',
    description: '',  // this is a slider but with a wrong allowed value so it become edit box
    panel: 'flpPanel',
    visibleIf: '$$list_box_single_string === "FLP Panel"'
  },
  qc_remote_workflow: {
    allowedValues: ['none', 'hmpid-raw-qcmn-remote', 'its-qcmn-fhr-fee-remote', 'option-mambo-no-5'
    ],
    defaultValue: 'none',
    label: 'Dropdown component',
    description: '', // this is a dropdown as single seleciton list
    widget: 3,
    panel: 'mainPanel'
  },
  list_box_single_string: {
    allowedValues: ['none', 'FLP Panel'],
    defaultValue: 'none',
    type: 1,
    label: 'List Box Single Selection',
    description: '', // this is a list box with single number selection 
    widget: 2,
    panel: 'mainPanel'
  },
  list_box_multi_list: {
    allowedValues: ['OCR', 'DCS', 'TPC'],
    defaultValue: '',
    type: 3,
    label: 'Combo Box with Multi Selection',
    description: '',  // this is a list box with multi-selection available
    widget: 2,
    panel: 'mainPanel'
  },
  combo_box_single_selection: {
    allowedValues: ['none', 'sine', 'statator'],
    defaultValue: 'none',
    type: 3,
    label: 'QualityControl remote workflow',
    description: '',  // this is a combo box with single selection or user input value
    widget: 2,
    panel: 'dcsPanel',
    visibleIf: '$$list_box_multi_list.includes("DCS")'

  },
  ddsched_enabled: {
    allowedValues: [],
    defaultValue: 'false',
    type: 2,
    widget: 6,
    label: 'Assume this is TPC important',
    description: '',
    panel: 'tpcPanel',
    visibleIf: '$$list_box_multi_list.includes("TPC")'
  },
  dpl_workflow: {
    allowedValues: ['none', 'ft0-digits-qc', 'hmpid-raw-qc', 'hmpid-raw-qcmn-local',
      'its-qc-fhr-fee', 'its-qcmn-fhr-fee-local'],
    defaultValue: 'none',
    label: 'DPL workflow',
    description: '',
    widget: 3,
    panel: 'dplPanel',
    visibleIf: '$$combo_box_other === "DPL"'
  },
  log_task_output: {
    allowedValues: ['none', 'stdout', 'all'],
    defaultValue: 'none',
    label: 'Log task output',
    description: '',
    widget: 5,
    panel: 'mainPanel'
  },
  drop_caches_enabled_box: {
    allowedValues: [],
    defaultValue: 'false',
    type: 2,
    widget: 6,
    label: 'Checkbox toggleing DCS SOR',
    description: '',
    panel: 'mainPanel'
  },
  fmq_initial_shm_cleanup_enabled: {
    allowedValues: [],
    defaultValue: 'Every now and then',
    type: 2,
    label: 'Preemptive unused shared memory cleanup',
    description: '', // simple edit box
    panel: 'mainPanel'
  },

}

export {VARS}
