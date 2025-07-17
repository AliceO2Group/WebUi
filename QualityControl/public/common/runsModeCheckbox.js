import { h } from '/js/src/index.js';

/**
 * Checkbox component for 'Activate run mode'
 * @param {object} pageModel - the model for the page
 * @param {object} filterModel - the model for the filters
 * @returns {vnode} - the checkbox component for runs mode
 */
export function runsModeCheckbox(pageModel, filterModel) {
  const checkbox = createRunsModeCheckbox(pageModel, filterModel);
  const label = h('span.items-center.runs-mode-title', 'Run Mode');
  const runInfo = pageModel.model.inRunMode ? createRunInfoDisplay(pageModel.model) : null;

  const content = [checkbox, label];
  if (runInfo) {
    content.push(runInfo);
  }

  return h('div.runs-mode-container', [
    h(
      `span.items-center.runs-mode-label${pageModel.model.canActivateRunsMode ? '' : '.disabled'}`,
      content,
    ),
  ]);
}

/**
 * Creates the checkbox element for runs mode
 * @param {object} pageModel - the model for the page
 * @param {FilterModel} filterModel - the model for the filters
 * @returns {vnode} - the checkbox element for runs mode
 */
function createRunsModeCheckbox(pageModel, filterModel) {
  const { model } = pageModel;
  return h('input.form-check-input.runs-mode-checkbox', {
    id: 'runsModeCheckbox',
    type: 'checkbox',
    disabled: !model.canActivateRunsMode,
    checked: model.inRunMode || false,
    title: model.canActivateRunsMode
      ? 'Enable runs mode to filter objects by run number. Other filters will be disabled.'
      : 'Runs mode is disabled. Enter a run number to enable.',
    onclick: async (event) => event.target.checked
      ? filterModel.activateRunsMode(pageModel)
      : filterModel.deactivateRunsMode(pageModel),
  });
}

/**
 * Creates the display for run information when in runs mode
 * @param {Model} model - the root model of the application
 * @returns {vnode} - the run information display element
 */
function createRunInfoDisplay(model) {
  return h('div.run-info-container', [
    createRunDetail('Run Number', 'runNumber', model.runNumber),
    createRunDetail('Status', 'runStatus', model.runStatus || 'Unknown'),
  ]);
}

/**
 * Creates a detail display for run information
 * @param {string} labelText - The label for the detail
 * @param {string} id - The id for the detail (currently unused)
 * @param {string} value - The value to display
 * @returns {vnode} - the detail display element
 */
function createRunDetail(labelText, id, value) {
  const isStatus = labelText.toLowerCase().includes('status');
  const statusClass = isStatus ? getStatusClass(value) : '';
  const statusTitle = isStatus ? getStatusTitle(value) : undefined;

  return h('div.run-detail.flex-column.items-start', [
    h('span.run-detail-label', labelText),
    h(`b.${statusClass}`, { id, title: statusTitle }, value),
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
