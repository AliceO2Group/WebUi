import { h } from '/js/src/index.js';
import { iconChevronBottom, iconChevronTop } from '/js/src/icons.js';
import LayoutListCard from '../../pages/layoutListView/components/LayoutListCard.js';

/**
 * Method to create a folder with various layouts
 * @param {FolderModel} folderModel - the object that is responsible for the state of the folder components.
 * @returns {vnode} - virtual node element
 */
export default function (folderModel) {
  const layouts = folderModel.list;
  const searchBy = folderModel.searchInput;
  const clickFunction = () => folderModel.toggleFolder();

  return h(
    '.m2.shadow-level3.br3.flex-column',
    [
      folderHeader(folderModel, clickFunction),
      ' ',
      folderModel.isOpened ? folderBody(layouts, searchBy) : null,
    ],
  );
}

/**
 * Creates the header section of a folder component with a click handler
 * @param {object} params - Destructured parameters object
 * @param {string} params.folderType - CSS class for styling the folder header
 * @param {boolean} params.isOpened - Flag indicating if folder is expanded
 * @param {string} params.title - Display text for the folder header
 * @param {Function} clickFunction - Callback to execute when header is clicked
 * @returns {vnode} - Virtual DOM node representing the folder header
 */
function folderHeader({ folderType, isOpened, title }, clickFunction) {
  return h(
    `.p2.object-selectable.folderHeader.${folderType}`,
    { onclick: clickFunction },
    [
      h('b', { style: 'flex-grow:1;' }, h('span', isOpened ?
        iconChevronTop() : iconChevronBottom()), ' ', title),
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
    Failure: () => h('div', [h('.warning', 'Unable to retrieve this list of layouts')]),
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
