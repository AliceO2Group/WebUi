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
import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';

interface Session {
  personid: string | null;
  name: string | null;
  token: string | null;
  username: string | null;
  access: string[] | null;
}

type SessionKey = keyof Session;

const defaultSession = {
  personid: null,
  name: null,
  token: null,
  username: null,
  access: null,
};

// List ["personid", "name", "token", ...]
const sessionKeys = Object.keys(defaultSession) as SessionKey[];

interface SessionContextType {
  session: Session;
  hasAccess: (role: string) => boolean;
}

/**
 * React context for managing user session state.
 * Provides session data and access control functionality.
 */
export const SessionContext = createContext<SessionContextType>({
  session: defaultSession,
  hasAccess: () => false,
});

/**
 * Session provider component that manages user session state.
 *
 * Automatically extracts session data from URL parameters on mount and
 * provides session context to child components.
 *
 * @param children - React components that need access to session context
 *
 * @example
 * ```tsx
 * <SessionProvider>
 *   <App />
 * </SessionProvider>
 * ```
 */
export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session>(defaultSession);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let sessionLoad: Session = { ...defaultSession };
    const params = new URLSearchParams(location.search);
    for (const sessionKey of sessionKeys) {
      const value = params.get(sessionKey);
      if (value && sessionKey === 'access') {
        sessionLoad = { ...sessionLoad, [sessionKey]: value.split(',') };
      } else if (value) {
        sessionLoad = { ...sessionLoad, [sessionKey]: value };
      }
    }
    setSession(sessionLoad);
    navigate(location.pathname, { replace: true });
    // It should run only once when we start page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasAccess = useCallback(
    (role: string) => session.access?.includes(role) ?? false,
    [session],
  );

  const value = useMemo(() => ({ session, hasAccess }), [session, hasAccess]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};
