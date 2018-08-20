// Framework
import {h, switchCase} from '/js/src/index.js';

// Common app helpers
import appHeader from './common/appHeader.js';
import sidebar from './common/sidebar.js';

// Page specific views (contents and headers)
import {
  content as rolesContent,
  header as rolesHeader} from './role/rolesPage.js';
import {
  content as environmentsContent,
  header as environmentsHeader} from './environment/environmentsPage.js';
import {
  content as environmentContent,
  header as environmentHeader} from './environment/environmentPage.js';
import {
  content as newEnvironmentContent,
  header as newEnvironmentHeader} from './environment/newEnvironmentPage.js';
import {
  content as statusContent,
  header as statusHeader} from './status/statusPage.js';

/**
 * Main view layout
 * @param {object} model - representing current application state
 * @return {vnode} application view to be drawn according to model
 */
export default function view(model) {
  return h('.flex-column absolute-fill', [
    header(model),
    h('.flex-grow flex-row', [
      h('.sidebar', [
        h('.sidebar-content relative', [
          sidebar(model)
        ])
      ]),
      h('.flex-grow.relative', [
        content(model)
      ])
    ]),
  ]);
}

/**
 * Top header with app menu on the left and page menu for the rest
 * @param {object} model
 * @return {vnode}
 */
const header = (model) => h('.bg-white flex-row p2 shadow-level2 level2', [
  appHeader(model),
  switchCase(model.router.params.page, {
    roles: rolesHeader,
    environments: environmentsHeader,
    environment: environmentHeader,
    newEnvironment: newEnvironmentHeader,
    status: statusHeader
  })(model)
]);

/**
 * Page content depending on the query string handler by router model
 * @param {object} model
 * @return {vnode}
 */
const content = (model) => [
  switchCase(model.router.params.page, {
    roles: rolesContent,
    environments: environmentsContent,
    environment: environmentContent,
    newEnvironment: newEnvironmentContent,
    status: statusContent
  })(model)
];
