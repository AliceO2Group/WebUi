import { h } from '/js/src/index.js';
import { iconChevronBottom, iconChevronTop } from '/js/src/icons.js';
import LayoutListCard from '../../pages/layoutListView/components/LayoutListCard.js';

/**
 * Method to create a folder with various layouts
 * @param {object} model - The model that is making use of the folder class
 * @param {Folder} folder - folder model
 * @returns {vnode} - virtual node element
 */
export default function (model, folder) {
  const layouts = folder.list;
  const searchBy = folder.searchInput;
  return h(
    '.m2.shadow-level3.br3.flex-column',
    [
      createHeaderOfFolder(folder),
      ' ',
      folder.isOpened ? folderBody(model, layouts, searchBy) : null,
    ],
  );
}

/**
 * Create the header of the folder
 * @param {Folder} folder - folder model
 * @returns {vnode} - virtual node element
 */
function createHeaderOfFolder(folder) {
  return h(
    '.p2.object-selectable',
    {
      style: 'border-radius: .5rem .5rem 0 0; display: flex; flex-direction: row',
      class: folder.folderType,
      onclick: () => folder.toggleFolder(),
    },
    [
      h('b', { style: 'flex-grow:1;' }, [
        h('span', {
          style: ' text-align: right',
        }, folder.isOpened ? iconChevronTop() : iconChevronBottom()), ' ', folder.title,
      ]),
    ],
  );
}

/**
 * Displays the layouts as a set of cards in a 3-column grid.
 * @param {object} model - The model that is making use of the folder class
 * @param {RemoteData} layouts - list of layouts as remoteData object.
 * @param {string} searchBy - string to search by in the list of layouts.
 * @returns {vnode} - A virtual DOM node representing the card group layout.
 */
function folderBody(model, layouts, searchBy) {
  return layouts.match({
    NotAsked: () => null,
    Loading: () => h('div', 'Loading...'),
    Failure: () => h('div', [h('div.alert.alert-danger', 'Unable to retrieve this list of layouts')]),
    Success: (list) => {
      if (!list || list.length <= 0) {
        return h('div', [h('.cardGrid', 'No layouts found')]);
      }
      return h(
        '.cardGrid',
        list.filter((item) => item.name.match(searchBy)).map((layout) => LayoutListCard(model, layout)),
      );
    },
  });
}
