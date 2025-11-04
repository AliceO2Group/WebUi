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

import { useContext } from 'react';

import { SessionContext } from '../contexts/sessionContext';

/**
 * Custom hook to access the current user session data.
 *
 * @returns {Session} The current session object
 *
 * @throws {Error} If the hook is used outside of SessionProvider
 *
 * @example
 * ```tsx
 * const session = useSession();
 * console.log(`Welcome, ${session.name}!`);
 * ```
 */
export function useSession() {
  const obj = useContext(SessionContext);
  if (!obj) {
    throw new Error('Session wasnt created');
  }
  return obj.session;
}

/**
 * Custom hook to check if the current user has access to a specific role.
 *
 * @param {string} role - The role to check access for
 * @returns {boolean} True if the user has the specified role, false otherwise
 *
 * @throws {Error} If the hook is used outside of SessionProvider
 *
 * @example
 * ```tsx
 * const hasAdminAccess = useAuth('admin');
 * const canEditTokens = useAuth('token-editor');
 *
 * if (hasAdminAccess) {
 *   // Render admin-only content
 * }
 * ```
 */
export function useAuth(role: string) {
  const obj = useContext(SessionContext);
  if (!obj) {
    throw new Error('Session wasnt created');
  }
  return obj.hasAccess(role);
}
