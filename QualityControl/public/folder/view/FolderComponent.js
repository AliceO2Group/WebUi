import { h } from '/js/src/index.js';
import { iconChevronBottom, iconChevronTop } from '/js/src/icons.js';
import LayoutListCard from '../../pages/layoutListView/components/LayoutListCard.js';

/**
 * Method to create a folder with various layouts
 * @param {object} folderModel - FolderModel: the object that is responsible for the state of the folder components.
 * @returns {vnode} - virtual node element
 */
export default function (folderModel) {
  const layouts = folderModel.list;
  const searchBy = folderModel.searchInput;
  return h(
    '.m2.shadow-level3.br3.flex-column',
    [
      folderHeader(folderModel),
      ' ',
      folderModel.isOpened ? folderBody(layouts, searchBy) : null,
    ],
  );
}

/**
 * Create the header of the folder
 * @param {Folder} folderModel - folder model
 * @returns {vnode} - virtual node element
 */
function folderHeader(folderModel) {
  return h(
    `.p2.object-selectable.folderHeader.${folderModel.folderType}`,
    { onclick: () => folderModel.toggleFolder() },
    [
      h('b', { style: 'flex-grow:1;' }, h('span', folderModel.isOpened ?
        iconChevronTop() : iconChevronBottom()), ' ', folderModel.title),
    ],
  );
}

/**
 * Displays the layouts as a set of cards in a 3-column grid.
 * @param {RemoteData} layouts - list of layouts as remoteData object.
 * @param {string} searchBy - string to search by in the list of layouts.
 * @returns {vnode} - A virtual DOM node representing the card group layout.
 */
function folderBody(layouts, searchBy) {
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
        list.filter((item) => item.name.match(searchBy)).map((layoutCard) => LayoutListCard(layoutCard)),
      );
    },
  });
}
