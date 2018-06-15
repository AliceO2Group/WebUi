/**
 * Model representing the lock of the UI, one owner at a time
 */
class Padlock {
  /**
   * Initialize lock as free / unlocked.
   */
  constructor() {
    this.lockedBy = null; // null | Number (can be zero!)
    this.lockedByName = null; // string
  }

  /**
   * Take the lock by someone.
   * Fails if the lock is already taken.
   * @param {number} personid - someone's id
   * @param {string} name - someone's name
   */
  lockBy(personid, name) {
    if (this.lockedBy !== null) {
      throw new Error(`Lock is already hold by ${this.lockedByName} (id ${this.lockedBy})`);
    }
    this.lockedBy = personid;
    this.lockedByName = name;
  }

  /**
   * Release lock by someone who must be the actual owner.
   * Fails if the lock is not taken or taken by someone else.
   * @param {number} personid - someone's id
   */
  unlockBy(personid) {
    if (this.lockedBy === null) {
      throw new Error('Lock is already unlocked');
    }

    if (this.lockedBy !== personid) {
      throw new Error(`You cannot unlock, owner is ${this.lockedByName} (id ${this.lockedBy})`);
    }

    this.lockedBy = null;
    this.lockedByName = null;
  }
}

module.exports = Padlock;
