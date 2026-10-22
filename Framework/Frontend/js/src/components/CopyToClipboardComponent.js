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
import { copyToClipboard, getClipboardUnavailableReason } from '../utilities/clipboard.js';

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

    this._message = getClipboardUnavailableReason() ?? '';
    this._available = !this._message;
  }

  /**
   * Copies the specified text to the clipboard.
   *
   * @param {string} clipboardTargetValue The text to be copied to the clipboard.
   * @param {(error: Error) => void} [onFailure] The callback function to be invoked if copying to the clipboard fails.
   * @returns {Promise<void>}
   */
  async copyToClipboard(clipboardTargetValue, onFailure) {
    try {
      await copyToClipboard(clipboardTargetValue);

      if (this._successStateTimeout) {
        clearTimeout(this._successStateTimeout);
      }

      this._successStateTimeout = setTimeout(() => {
        this._successStateTimeout = null;
        this.notify();
      }, 2000);

      this.notify();
    } catch (error) {
      if (typeof onFailure === 'function') {
        onFailure(error);
      }
    }
  }

  /**
   * Renders the button that allows copying text to the clipboard.
   * Attributes other than those listed are not forwarded to the button element.
   *
   * @param {vnode} vnode The virtual DOM node containing the attrs and children.
   * @param {object} vnode.attrs The attributes passed to the component.
   * @param {string} [vnode.attrs.value=''] The text to be copied to the clipboard.
   * @param {string} [vnode.attrs.id] The unique identifier for the copy button will become 'copy-{id}'.
   * @param {string} [vnode.attrs.className='btn-primary loading'] The CSS classes to be applied to the copy button.
   * @param {string|object} [vnode.attrs.style] The inline styles to be applied to the copy button.
   * @param {string} [vnode.attrs.contentClassName] The CSS classes to be applied to the content of the copy button.
   * @param {(error: Error) => void} [vnode.attrs.onFailure] The callback function to be invoked if copying to the clipboard fails.
   * @returns {Component} The copyToClipboard button component
   */
  view(vnode) {
    const { attrs, children } = vnode;
    const { value: clipboardTargetValue = '', id, className = 'btn-primary', style, contentClassName, onFailure } = attrs;

    const defaultContent = [iconLinkIntact(), children];
    const successContent = [iconCheck(), h('', 'Copied!')];

    return h(
      'button.btn',
      {
        id: id ? `copy-${id}` : undefined,
        type: 'button',
        onclick: () => this.copyToClipboard(clipboardTargetValue, onFailure),
        disabled: !this._available,
        title: this._message,
        style,
        className,
      },
      h(
        'div.flex-row.g1',
        { className: contentClassName },
        this._successStateTimeout ? successContent : defaultContent,
      ),
    );
  }
}
