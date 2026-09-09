/**
 * @license
 * Copyright CERN and copyright holders of ALICE O2. This software is
 * distributed under the terms of the GNU General Public License v3 (GPL
 * Version 3), copied verbatim in the file "COPYING".
 *
 * See http://alice-o2.web.cern.ch/license for full licensing information.
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

import { StatefulComponent } from './StatefulComponent.js';
import { iconCheck, iconLinkIntact } from '../icons.js';
import { h } from '../renderer.js';
import { isContextSecure } from '../utilities/browserContext.js';

/**
 * Represents a component that allows copying text to the clipboard.
 */
export class CopyToClipboardComponent extends StatefulComponent {
  /**
   * Constructs a new CopyToClipboardComponent.
   */
  constructor() {
    super();
    this._successStateTimeout = null;
  }

  /**
   * Copies the specified text to the clipboard.
   *
   * @param {string} clipboardTargetValue The text to be copied to the clipboard.
   * @param {(error: Error) => void} onFailure The callback function to be invoked if copying to the clipboard fails.
   * @returns {Promise<void>}
   */
  async copyToClipboard(clipboardTargetValue, onFailure) {
    try {
      await navigator.clipboard.writeText(clipboardTargetValue);

      if (this._successStateTimeout) {
        clearTimeout(this._successStateTimeout);
      }

      this._successStateTimeout = setTimeout(() => {
        this._successStateTimeout = null;
        this.notify();
      }, 2000);

      this.notify();
    } catch (error) {
      if (onFailure) {
        onFailure(error);
      }
    }
  }

  /**
   * Checks the availability of the clipboard and provides a message if it is not accessible.
   *
   * @throws {Error} Throws an error with a descriptive message if the clipboard is not available.
   * @returns {void}
   */
  checkClipboardAvailability() {
    if (!isContextSecure()) {
      throw new Error('Clipboard not available in a non-secure context.');
    }

    if (!this.isClipboardSupported()) {
      throw new Error('Clipboard API is not supported in this browser.');
    }

    if (this.isWindowEmbedded()) {
      throw new Error('Clipboard access is restricted in iframes.');
    }
  }

  /**
   * Checks if the clipboard API is available in the user's browser.
   *
   * @returns {boolean} Returns `true` if it is available
   */
  isClipboardSupported() {
    return Boolean(navigator.clipboard);
  }

  /**
   * Check if the window is embedded in a frame.
   *
   * @returns {boolean} Returns `true` if it is embedded
   */
  isWindowEmbedded() {
    return window !== window.parent;
  }

  /**
   * Renders the button that allows copying text to the clipboard.
   * Attributes other than those listed are not forwarded to the button element
   *
   * @param {vnode} vnode The virtual DOM node containing the attrs and children.
   * @param {object} vnode.attrs The attributes passed to the component.
   * @param {string} vnode.attrs.value The text to be copied to the clipboard.
   * @param {string} vnode.attrs.id The unique identifier for the copy button will become 'copy-{id}'.
   * @param {string} vnode.attrs.className The CSS classes to be applied to the copy button.
   * @param {string} vnode.attrs.style The inline styles to be applied to the copy button.
   * @param {(error: Error) => void} vnode.attrs.onFailure The callback function to be invoked if copying to the clipboard fails.
   * @returns {Component} The copyToClipboard button component
   */
  view(vnode) {
    const { attrs, children } = vnode;
    const { value: clipboardTargetValue = '', id, className = 'btn-primary', style, onFailure } = attrs;

    let available = true;
    let message = '';

    try {
      this.checkClipboardAvailability();
    } catch ({ message: errorMessage }) {
      available = false;
      message = errorMessage;
    }

    const defaultContent = [iconLinkIntact(), children];
    const successContent = [iconCheck(), h('', 'Copied!')];

    return h(
      'button.btn',
      {
        id: `copy-${id}`,
        onclick: () => this.copyToClipboard(clipboardTargetValue, onFailure),
        disabled: !available,
        title: message || '',
        style,
        className,
      },
      h(
        'div.flex-row.g1.justify-center',
        this._successStateTimeout ? successContent : defaultContent,
      ),
    );
  }
}
