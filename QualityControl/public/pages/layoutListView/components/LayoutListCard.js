/**
 * Layout card component displaying layout information with interactive controls.
 * @module LayoutCard
 * @param {object} model - Application state model containing session and router information
 * @param {object} layout - Layout data object containing display properties
 * @returns {vnode} Virtual DOM node representing the layout card
 */
import { UserRole, isUserRoleSufficient } from './../../../library/userRole.enum.js';
import { h } from '/js/src/index.js';
import { iconBadge } from '/js/src/icons.js';

/**
 * Main layout card component
 * @param {object} model - - The root model of the application.
 * @param {object} layout - Layout data including description and owner information
 * @returns {vnode} Complete layout card virtual DOM node
 */
export default function (model, layout) {
  const { description, owner_name } = layout;
  const isMinimumGlobal = model.session.access.some((role) => isUserRoleSufficient(role, UserRole.GLOBAL));
  const toggleOfficialFunction = (id) => model.layout.toggleOfficial(id);

  return h('.card', [
    cardHeader({ ...layout, isMinimumGlobal, toggleOfficialFunction }),
    cardBody(owner_name, description),
  ]);
}

/**
 * Generates the card header for a layout with interactive elements including official status toggle.
 * @param {object} params - Configuration object containing:
 * @param {boolean} params.isOfficial - Indicates if the layout has official status
 * @param {string} params.id - Unique identifier for the layout
 * @param {string} params.name - Display name of the layout
 * @param {boolean} params.isMinimumGlobal - Flag for user's global permissions
 * @param {Function} params.toggleOfficialFunction - Callback for official status toggle
 * @returns {vnode} Virtual DOM node representing the layout card header
 */
function cardHeader({ isOfficial, id, name, isMinimumGlobal, toggleOfficialFunction }) {
  const bgColor = isOfficial ? 'bg-primary' : 'bg-gray';
  const textColor = isOfficial ? 'white' : 'black';

  return h(`.cardHeader.flex-row.justify-between.${bgColor}`, [
    h('h5', [
      h(`a.${textColor}`, {
        href: `?page=layoutShow&layoutId=${id}`,
        onclick: (e) => model.router.handleLinkEvent(e),
      }, name),
    ]),
    isMinimumGlobal ?
      headerButton(isOfficial, id, toggleOfficialFunction)
      : isOfficial && h(`span.badge.${textColor}`, [iconBadge(), ' Official']),
  ]);
}

/**
 * Creates a toggle button for changing a layout's official status.
 * @param {boolean} isOfficial - Current official status of the layout
 * @param {string} id - Unique identifier of the layout to toggle
 * @param {Function} toggleOfficialFunction - Callback to execute when button is clicked
 * @returns {vnode} Button element with status-appropriate text and click handler
 * @description
 * - Button text changes between "Make Official" and "Make Unofficial"
 * - Click handler invokes the provided toggle function with layout ID and new status
 * - Includes a visual badge icon for consistency with other UI elements
 */
function headerButton(isOfficial, id, toggleOfficialFunction) {
  const officialText = isOfficial ? 'Make Unofficial' : 'Make Official';

  return h('button.btn.bg-gray-darker.white.cardHeaderButton', {
    onclick: () => toggleOfficialFunction(id),
  }, [officialText, iconBadge()]);
}

/**
 * Generates the body content for a layout card.
 * @param {string} owner_name - The name of the layout owner.
 * @param {string} description - The description of the layout.
 * @returns {vnode} - A virtual DOM node for the layout's body content.
 */
function cardBody(owner_name, description) {
  return h('.cardBody.p2', [
    h('p', [
      h('strong', 'Owner: '),
      owner_name,
    ]),
    h('p', [
      h('strong', 'Description: '),
      description || '-',
    ]),
  ]);
}
