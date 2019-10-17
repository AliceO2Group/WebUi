import {h, iconCircleX, iconActionRedo, iconReload} from '/js/src/index.js';
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
export const header = (model) => h('h4.w-100 text-center', 'New Environment');

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
    Success: (templatesMap) => (Object.keys(templatesMap).length === 0)
      ? h('h3.m4', ['No templates/revisions found.']) : showControlForm(model, repoList, templatesMap)
  });

/**
 * Method which creates a dropdown of repositories
 * @param {Object} workflow
 * @param {Array<JSON>} repoList
 * @return {vnode}
 */
const repositoryDropdownList = (workflow, repoList) =>
  h('.m2.text-left.w-50', [ // Dropdown Repositories
    h('h5', 'Repository:'),
    h('', {style: 'display: flex; flex-direction: row'}, [
      h('select.form-control', {
        style: 'cursor: pointer',
        onchange: (e) => workflow.setRepository(e.target.value)
      }, [
        repoList.map((repository) => repository.name)
          .map((repository) => h('option', {
            selected: repository === workflow.form.repository ? true : false
          }, repository))
      ]),
      h('button.btn', {
        title: 'Refresh repositories',
        class: workflow.refreshedRepositories.isLoading() ? 'loading' : '',
        disabled: workflow.refreshedRepositories.isLoading(),
        onclick: () => workflow.refreshRepositories()
      }, iconReload())
    ])
  ]);

/**
 * Method which creates a combo box (input + dropdown) of repositories
 * @param {Object} workflow
 * @param {JSON} templatesMap
 * @param {string} repository
 * @return {vnode}
 */
const revisionComboBox = (workflow, templatesMap, repository) =>
  h('.m2.text-left', [ // Dropdown Revisions
    h('h5', 'Revision:'),
    h('.w-50', {style: 'display:flex; flex-direction: row;'}, [
      h('.dropdown', {
        style: 'flex-grow: 1;',
        onclick: () => workflow.setRevisionInputDropdownVisibility(false),
        class: workflow.revision.isSelectionOpen ? 'dropdown-open' : ''
      }, [
        h('input.form-control', {
          type: 'text',
          style: 'z-index:100',
          value: workflow.form.revision,
          onkeyup: (e) => workflow.updateInputSearch('revision', e.target.value),
          onclick: (e) => {
            workflow.setRevisionInputDropdownVisibility('revision', true);
            e.stopPropagation();
          }
        }),
        h('.dropdown-menu.w-100',
          Object.keys(templatesMap[repository])
            .filter((name) => name.match(workflow.revision.regex))
            .map((revision) =>
              h('a.menu-item', {
                class: revision === workflow.form.revision ? 'selected' : '',
                onclick: () => workflow.updateInputSelection('revision', revision),
              }, revision)
            )
        ),
      ]),
      h('button.btn.mh2', {
        style: {
          display: workflow.isInputCommitFormat() ? '' : 'none'
        },
        onclick: () => workflow.requestCommitTemplates()
      }, iconActionRedo())
    ]),
  ]);

/**
 * Method to create the template Area List
 * @param {Object} workflow
 * @param {JSON} templatesMap
 * @param {string} repository
 * @param {string} revision
 * @return {vnode}
 */
const templateAreaList = (workflow, templatesMap, repository, revision) =>
  h('.m2.text-left.w-50', [ // Dropdown Template
    h('h5', {style: '', for: ''}, 'Template:'),
    h('.shadow-level1.pv1',
      Object.values(templatesMap[repository][revision]).map((template) =>
        h('a.menu-item', {
          className: workflow.form.template === template ? 'selected' : null,
          onclick: () => workflow.setTemplate(template)
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
  h('.form-group.p3.absolute-fill', {
    style: 'display: flex; flex-direction: column; ',
    onclick: () => model.workflow.setRevisionInputDropdownVisibility(false),
  }, [
    repositoryDropdownList(model.workflow, repoList),
    !templatesMap[model.workflow.form.repository] ?
      errorComponent('No revisions found for this repository. Please contact an administrator') :
      h('', [
        revisionComboBox(model.workflow, templatesMap, model.workflow.form.repository),
        (model.workflow.isRevisionCorrect() &&
          Object.values(templatesMap[model.workflow.form.repository][model.workflow.form.revision]).length !== 0) ?
          templateAreaList(model.workflow, templatesMap, model.workflow.form.repository, model.workflow.form.revision)
          : errorComponent('No templates found for this repository.'),
        h('.mv2', [
          h('button.btn.btn-primary',
            {
              class: model.environment.itemNew.isLoading() ? 'loading' : '',
              disabled: model.environment.itemNew.isLoading() || !model.workflow.isInputSelected(),
              onclick: () => model.workflow.createNewEnvironment(),
            },
            'Create'),
          model.environment.itemNew.match({
            NotAsked: () => null,
            Loading: () => null,
            Success: () => null,
            Failure: (error) => errorComponent(error),
          })
        ])
      ])]);

/**
 * Display a red error message
 * @param {string} message
 * @return {vnode}
 */
const errorComponent = (message) =>
  h('p.text-center.danger', iconCircleX(), ' ', message);
