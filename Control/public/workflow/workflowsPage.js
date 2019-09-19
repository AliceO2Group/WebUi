import {h, iconPlus, iconChevronBottom} from '/js/src/index.js';
import pageLoading from '../common/pageLoading.js';
import pageError from '../common/pageError.js';
/**
 * @file Page to show a list of environments (content and header)
 */

/**
 * Header of page showing list of environments
 * With one button to create a new environment and page title
 * @param {Object} model
 * @return {vnode}
 */
export const header = (model) => [
  h('.w-50 text-center', [
    h('h4', 'Workflows')
  ]),
  h('.flex-grow text-right', [
  ])
];

/**
 * Scrollable list of environments or page loading/error otherwise
 * @param {Object} model
 * @return {vnode}
 */
export const content = (model) => h('.scroll-y.absolute-fill.text-center', [
  model.workflow.map.match({
    NotAsked: () => null,
    Loading: () => pageLoading(),
    Success: (data) => (Object.entries(data).length === 0)
      ? h('h3.m4', ['No workflows found.']) : showContent(model, data),
    Failure: (error) => pageError(error),
  })
]);

/**
 * Show a list of environments with a button to edit each of them
 * Print a message if the list is empty.
 * @param {Object} model
 * @param {JSON} repositories
 * @return {vnode}
 */
const showContent = (model, repositories) =>
  h('', [
    h('table.table.table-sm.table-primary.shadow-level2.hoverTable', {style: 'white-space: pre-wrap;'}, [
      h('thead',
        h('tr', [
          h('th.w-25',
            h('', {style: 'display:flex; flex-direction:column'}, [
              h('', {style: {padding: '0.35em'}}, 'Repository'),
              h('.w-50', h('input.form-control', {
                oninput: (e) => model.workflow.update('input', e.target.value)
              }, ''))
            ])
          ),
          h('th.w-25',
            h('', {style: 'display:flex; flex-direction:column'}, [
              h('', {style: {padding: '0.35em'}}, 'Revision'),
              h('.w-50', h('input.form-control', {
                oninput: (e) => model.workflow.update('revision', e.target.value)
              }, ''))
            ])
          ),
          h('th.w-25',
            h('', {style: 'display:flex; flex-direction:column'}, [
              h('', {style: {padding: '0.35em'}}, 'Template'),
              h('.w-50', h('input.form-control', {
                oninput: (e) => model.workflow.update('template', e.target.value)
              }, ''))
            ])
          ),
          h('th', {style: 'text-align:center !important;'}, 'New Environment')
        ])
      ),
      h('tbody', Object.keys(repositories)
        .filter((repo) => repo.match(model.workflow.inputReg))
        .map((repository) => [
          h('tr', [
            h('td', repository),
            h('td', ''),
            h('td', ''),
            h('td.w-wrapped', '')
          ]),
          Object.keys(repositories[repository])
            .filter((revi) => revi.match(model.workflow.revisionReg))
            .map((revision) => [
              h('tr', [
                h('td', ''),
                h('td', revision),
                h('td', ''),
                h('td', '')
              ]),
              Object.values(repositories[repository][revision])
                .filter((temp) => temp.match(model.workflow.templateReg))
                .map((template) => h('tr', [
                  h('td', ''),
                  h('td', ''),
                  h('td', template),
                  h('td', {style: 'text-align:center !important;'},
                    h('.btn-group',
                      h('button.btn.btn-primary', {
                        title: 'Create simple environment'
                      }, iconPlus())
                    )
                  )
                ]))
            ]),
        ])
      )
    ]),
    !model.workflow.viewAll ? h('button.btn', {
      onclick: () => model.workflow.getAsMap(true)
    }, 'View all') : null
  ]);
