import { UserRole, isUserRoleSufficient } from './../../../library/userRole.enum.js';
import { Observable } from '/js/src/index.js';

/**
 * Model namespace for LayoutCardModel
 */
export default class LayoutCardModel extends Observable {
  /**
   * Creates a new LayoutCardModel instance
   * @param {Model} model - The parent model utilizing this card
   * @param {object} layout - The layout data object containing:
   * @param {string} id - Unique identifier for the layout
   * @param {string} description - Description of the layout
   * @param {string} owner_name - Name of the layout owner
   * @param {boolean} isOfficial - Official status flag
   * @param {string} name - Display name of the layout
   */
  constructor(model, layout) {
    super();
    this.model = model;

    this.id = layout.id;
    this.description = layout.description;
    this.owner_name = layout.owner_name;
    this.isOfficial = layout.isOfficial;
    this.name = layout.name;

    this.notify();
  }

  /**
   * Toggles the official status of the layout and updates backend services
   * @async
   * @returns {Promise<void>}
   */
  async toggleOfficial() {
    this.isOfficial = !this.isOfficial;
    const layoutService = this.model.services.layout;

    await layoutService.patchLayout(this.id, { isOfficial: this.isOfficial });
    await layoutService.getLayouts(this);
    await layoutService.getLayoutsByUserId(this.model.session.personid, this);
    this.notify();
  };

  /**
   * Checks if current user has sufficient authority (GLOBAL role)
   * @async
   * @returns {Promise<boolean>} True if user has sufficient authority
   */
  async sufficientAuthority() {
    return this.model.session.access.some((role) => isUserRoleSufficient(role, UserRole.GLOBAL));
  }
}
