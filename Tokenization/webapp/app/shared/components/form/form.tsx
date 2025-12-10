/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file "COPYING".
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

import React from 'react';

type FormProps = React.FormHTMLAttributes<HTMLFormElement>;

/**
 * Form
 *
 * Lightweight wrapper around a native <form> element that keeps a styled container.
 *
 * @param {object} props - component props
 * @param {React.ReactNode} props.children - contents rendered inside the form
 * @param {string} [props.className] - CSS classes applied to the outer wrapper <div>
 * @param {string} [props.id] - id applied to the outer wrapper <div>
 */
export const Form = ({ children, className, id, ...formProps }: FormProps) => (
  <div
    id={id}
    className={className ?? ''}
  >
    <form {...formProps}>
      {children}
    </form>
  </div>
);
