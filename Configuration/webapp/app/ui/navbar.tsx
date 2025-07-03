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

import { NavLink } from 'react-router';
import type { NavLinkProps } from 'react-router';
import { getSessionData } from '~/services/session';

const StyledNavLink = ({ children, ...props }: NavLinkProps) => (
  <NavLink {...props} className={({ isActive }) => `btn btn-tab ${isActive ? 'selected' : ''}`}>
    {children}
  </NavLink>
);
export const Navbar = () => (
  <nav className={'flex-row justify-between items-center p2 shadow-level2 level2 bg-gray-light'}>
    <span className={'f4 gray-darker'}>Bookkeeping light</span>
    <div className={'btn-group'}>
      <StyledNavLink to={'/'}>Home</StyledNavLink>
      <StyledNavLink className={'btnStyledNav btn-tab'} to={'/runs'}>
        Runs
      </StyledNavLink>
      <button onClick={() => console.log(getSessionData())}>Log session data</button>
    </div>
  </nav>
);
