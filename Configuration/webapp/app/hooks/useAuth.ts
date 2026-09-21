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

import { useEffect, useState } from 'react';
import { getSessionData } from '~/services/session';

export interface Session {
  personid: string;
  username: string;
  name: string;
  access: string;
  token: string;
}

export const useAuth = (): Session => {
  const [session, setSession] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchSession = async () => {
      const session = await getSessionData();
      setSession(session);
    };
    void fetchSession();
  }, []);

  return session as unknown as Session;
};
