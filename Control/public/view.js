import {h} from '/js/src/index.js';

import appHeader from './common/appHeader.js';
import sidebar from './common/sidebar.js';
import switchCase from './common/switchCase.js';

import {content as rolesContent, header as rolesHeader} from './role/rolesPage.js';
import {content as environmentsContent, header as environmentsHeader} from './environment/environmentsPage.js';
import {content as environmentContent, header as environmentHeader} from './environment/environmentPage.js';
import {content as newEnvironmentContent, header as newEnvironmentHeader} from './environment/newEnvironmentPage.js';
import {content as statusContent, header as statusHeader} from './status/statusPage.js';

// The view
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

const header = (model) => h('.bg-white flex-row p2 shadow-level2 level2', [
  appHeader(model),
  switchCase(model.router.params.page, {
    'roles': rolesHeader,
    'environments': environmentsHeader,
    'environment': environmentHeader,
    'newEnvironment': newEnvironmentHeader,
    'status': statusHeader
  })(model)
]);

const content = (model) => [
  switchCase(model.router.params.page, {
    'roles': rolesContent,
    'environments': environmentsContent,
    'environment': environmentContent,
    'newEnvironment': newEnvironmentContent,
    'status': statusContent
  })(model)
];
