import { h } from '/js/src/index.js';

/**
 * Checkbox component for 'Activate run mode'
 * @param {object} pageModel
 * @param {object} filterModel
 * @returns {vnode}
 */
export function runsModeCheckbox(pageModel, filterModel) {
  const checkbox = createRunsModeCheckbox(pageModel, filterModel);
  const label = h('span', { class: 'runs-mode-title' }, 'Run Mode');
  const runInfo = model.inRunMode ? createRunInfoDisplay() : null;

  const content = [checkbox, label];
  if (runInfo) {
    content.push(runInfo);
  }

  return h(
    'div',
    {
      class: 'runs-mode-container',
    },
    [
      h('span', {
        class: `runs-mode-label${model.canActivateRunsMode ? '' : ' disabled'}`,
      }, content),
    ],
  );
}

/**
 * Creates the checkbox element for runs mode
 * @param {object} pageModel - the model for the page
 * @param {FilterModel} filterModel - the model for the filters
 * @returns {vnode} - the checkbox element for runs mode
 */
function createRunsModeCheckbox(pageModel, filterModel) {
  return h('input.form-check-input', {
    type: 'checkbox',
    disabled: !model.canActivateRunsMode,
    checked: model.inRunMode || false,
    class: 'runs-mode-checkbox',
    title: model.canActivateRunsMode
      ? 'Enable runs mode to filter objects by run number. Other filters will be disabled.'
      : 'Runs mode is disabled. Enter a run number to enable.',
    onclick: async (event) => event.target.checked
      ? filterModel.activateRunsMode(pageModel)
      : filterModel.desactivateRunsMode(pageModel),
  });
}

/**
 * Creates the display for run information when in runs mode
 * @returns {vnode} - the run information display element
 */
function createRunInfoDisplay() {
  return h('div', { class: 'run-info-container' }, [
    createRunDetail('Run Number', model.runNumber),
    createRunDetail('Status', model.runStatus || 'Unknown'),
  ]);
}

/**
 * Creates a detail display for run information
 * @param {string} labelText - The label for the detail
 * @param {string} value - The value to display
 * @returns {vnode} - the detail display element
 */
function createRunDetail(labelText, value) {
  const isStatus = labelText.toLowerCase().includes('status');
  const statusClass = isStatus ? getStatusClass(value) : '';
  const statusTitle = isStatus ? getStatusTitle(value) : undefined;

  return h('div', { class: 'run-detail' }, [
    h('span', { class: 'run-detail-label' }, labelText),
    h('span', { class: `run-detail-value ${statusClass}`, title: statusTitle }, value),
  ]);
}

/**
 * * Returns the class based on the run status
 * @param {string} value - The run status value
 * @returns {string} - The corresponding CSS class
 */
function getStatusClass(value) {
  switch (value.toLowerCase()) {
    case 'ended':
      return 'status-ended';
    case 'ongoing':
      return 'status-ongoing';
    case 'not_found':
      return 'status-not-found';
    default:
      return 'status-unknown';
  }
};

/**
 * Returns the title based on the run status
 * @param {string} value - The run status value
 * @returns {string} - The corresponding title text
 */
function getStatusTitle(value) {
  switch (value.toLowerCase()) {
    case 'ended':
      return 'The run has ended successfully. No new paths or objects will be added.';
    case 'ongoing':
      return 'The run is currently ongoing. New paths and objects will be added periodically.';
    case 'not_found':
      return 'The run was not found in the database. Please check the run number.';
    default:
      return 'The status of the run is unknown. Please check the run number or the system status.';
  }
}
