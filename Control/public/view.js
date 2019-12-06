// Framework
import {h, switchCase, notification} from '/js/src/index.js';

// Common app helpers
import appHeader from './common/appHeader.js';
import sidebar from './common/sidebar.js';

// Page specific views (contents and headers)
import {
  content as workflowsContent,
  header as workflowsHeader
} from './workflow/workflowsPage.js';
import {
  content as environmentsContent,
  header as environmentsHeader
} from './environment/environmentsPage.js';
import {
  content as environmentContent,
  header as environmentHeader
} from './environment/environmentPage.js';
import {
  content as statusContent,
  header as statusHeader
} from './frameworkinfo/frameworkInfoPage.js';

/**
 * Main view layout
 * @param {object} model - representing current application state
 * @return {vnode} application view to be drawn according to model
 */
export default (model) => [
  notification(model.notification),
  h('.flex-column absolute-fill', [
    header(model),
    h('.flex-grow flex-row', [
      h('.sidebar.sidebar-content.relative', {
        class: model.sideBarMenu ? '' : 'sidebar-minimal'
      }, sidebar(model)
      ),
      h('.flex-grow.relative', [
        content(model)
      ])
    ]),
  ])
];

/**
 * Top header with app menu on the left and page menu for the rest
 * @param {object} model
 * @return {vnode}
 */
const header = (model) => h('.bg-white flex-row p2 shadow-level2 level2', [
  appHeader(model),
  switchCase(model.router.params.page, {
    newEnvironment: workflowsHeader,
    environments: environmentsHeader,
    environment: environmentHeader,
    about: statusHeader
  })(model)
]);

/**
 * Page content depending on the query string handler by router model
 * @param {object} model
 * @return {vnode}
 */
const content = (model) => [
  switchCase(model.router.params.page, {
    newEnvironment: workflowsContent,
    environments: environmentsContent,
    environment: environmentContent,
    about: statusContent
  })(model)
];
