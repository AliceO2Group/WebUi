import {h, iconCircleX, iconActionRedo} from '/js/src/index.js';
import pageLoading from '../common/pageLoading.js';
import pageError from '../common/pageError.js';
/**
 * @file Page to show a form for creating a new environment
 * from existing templates
 */

/**
 * Header of page showing form for creating a new environment
 * @param {Object} model
 * @return {vnode}
 */
export const header = (model) => h('h4.w-100 text-center', 'Workflows');

/**
* Form with inputs for creating a new environment
 * @param {Object} model
 * @return {vnode}
 */
export const content = (model) => h('.scroll-y.absolute-fill.text-center', [
  model.workflow.repoList.match({
    NotAsked: () => null,
    Loading: () => pageLoading(),
    Success: (repoList) => (repoList.length === 0)
      ? h('h3.m4', ['No repositories found.']) : showTemplatesValidation(model, repoList.repos),
    Failure: (error) => pageError(error),
  })
]);

/**
 *Check that after repositories were requested, templates were loaded succesfully as well
 * @param {Object} model
 * @param {Array<JSON>} repoList - list of Repositories
 * @return {vnode}
 */
const showTemplatesValidation = (model, repoList) =>
  model.workflow.templatesMap.match({
    NotAsked: () => null,
    Loading: () => pageLoading(),
    Failure: (error) => pageError(error),
    Success: (templatesMap) => (Object.keys(model.workflow.templatesMap.payload).length === 0)
      ? h('h3.m4', ['No templates/revisions found.']) : showControlForm(model, repoList, templatesMap)
  });

/**
 * Method which creates a dropdown of repositories
 * @param {Object} model
 * @param {Array<JSON>} repoList
 * @return {vnode}
 */
const repositoryDropdownList = (model, repoList) =>
  h('.m2.text-left.w-50', [ // Dropdown Repositories
    h('h5', 'Repository:'),
    h('select.form-control', {
      style: 'cursor: pointer',
      onchange: (e) => model.workflow.setRepository(e.target.value)
    }, [
      repoList.map((repository) => repository.name)
        .map((repository) => h('option', {
          selected: repository === model.workflow.form.repository ? true : false
        }, repository))
    ])
  ]);

/**
 * Method which creates a combo box (input + dropdown) of repositories
 * @param {Object} model
 * @param {JSON} templatesMap
 * @param {string} repository
 * @return {vnode}
 */
const revisionComboBox = (model, templatesMap, repository) =>
  h('.m2.text-left', [ // Dropdown Revisions
    h('h5', 'Revision:'),
    h('.w-50', {style: 'display:flex; flex-direction: row;'}, [
      h('.dropdown', {
        style: 'flex-grow: 1;',
        onclick: () => model.workflow.closeAllDropdowns(),
        class: model.workflow.revision.isSelectionOpen ? 'dropdown-open' : ''
      }, [
        !templatesMap[repository] ?
          errorComponent('No revisions found for this repository. Please contact an administrator') :
          h('input.form-control', {
            type: 'text',
            style: 'z-index:100',
            value: model.workflow.revision.selected,
            onkeyup: (e) => model.workflow.updateInputSearch('revision', e.target.value),
            onclick: (e) => {
              model.workflow.setInputDropdownVisibility('revision', true);
              e.stopPropagation();
            }
          }),
        h('.dropdown-menu.w-100',
          Object.keys(templatesMap[repository])
            .filter((name) => name.match(model.workflow.revision.regex))
            .map((revision) =>
              h('a.menu-item', {
                class: revision === model.workflow.revision.selected ? 'selected' : '',
                onclick: () => model.workflow.updateInputSelection('revision', revision),
              }, revision)
            )
        ),
      ]),
      h('button.btn.mh2', {
        style: {
          display: model.workflow.form.revision.startsWith('#') ? '' : 'none'
        },
        onclick: () => model.workflow.requestCommitTemplates()
      }, iconActionRedo())
    ]),
  ]);

/**
 * Method to create the template Area List
 * @param {Object} model
 * @param {JSON} templatesMap
 * @param {string} repository
 * @param {string} revision
 * @return {vnode}
 */
const templateAreaList = (model, templatesMap, repository, revision) =>
  h('.m2.text-left.w-50', [ // Dropdown Template
    h('h5', {style: '', for: ''}, 'Template:'),
    h('.shadow-level1.pv1',
      Object.values(templatesMap[repository][revision]).map((template) =>
        h('a.menu-item', {
          className: model.workflow.form.template === template ? 'selected' : null,
          onclick: () => model.workflow.setTemplate(template)
        }, template))
    )
  ]);

/**
 * Create a form for the user to select inputs for a new environment
 * @param {Object} model
 * @param {Array<JSON>} repoList
 * @param {JSON} templatesMap
 * @return {vnode}
 */
const showControlForm = (model, repoList, templatesMap) =>
  h('.form-group.shadow-level1.p3', {
    style: 'display: flex; flex-direction: column; z-index : -1',
    onclick: () => model.workflow.closeAllDropdowns(),
  }, [
    repositoryDropdownList(model, repoList),
    revisionComboBox(model, templatesMap, model.workflow.form.repository),
    model.workflow.isRevisionCorrect() ?
      templateAreaList(model, templatesMap, model.workflow.form.repository, model.workflow.revision.selected)
      : null,
    h('.mv2', [
      h('button.btn.btn-primary',
        {
          class: model.environment.itemNew.isLoading() ? 'loading' : '',
          disabled: model.environment.itemNew.isLoading() || !model.workflow.isInputSelected(),
          onclick: () => model.workflow.createNewEnvironment(),
        },
        'Create New Environment'),
      model.environment.itemNew.match({
        NotAsked: () => null,
        Loading: () => null,
        Success: () => null,
        Failure: (error) => errorComponent(error),
      })
    ]
    )
  ]);

/**
 * Display a red error message
 * @param {string} message
 * @return {vnode}
 */
const errorComponent = (message) =>
  h('p.text-center.danger', iconCircleX(), ' ', message);
