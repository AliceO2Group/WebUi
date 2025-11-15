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
import type { NavLinkProps } from 'react-router';

import React from 'react';
import { NavLink } from 'react-router';

type StyledNavLinkProps = {
  children: React.ReactNode;
  to: NavLinkProps['to'];
};

/**
 * StyledNavLink
 *
 * A wrapper component that renders styled navigation link.
 * It uses NavLink from react-router to determine if the link is active and applies
 * the 'contained' variant for the active route and 'outlined' for inactive routes.
 * @param children The content to display inside the button.
 * @param to The target route path.
 */
const StyledNavLink = ({ children, to }: StyledNavLinkProps) =>
  <NavLink to={to}>
    {({ isActive }) => (
      <div
        className={isActive ? 'primary' : 'black'}
      >
        {children}
      </div>
    )}
  </NavLink>;

const NavList = ({ children }: { children: React.ReactNode }) => {
  const items = React.Children.toArray(children);
  return <ul className="flex-row">
    {
      items.map((el, idx) =>
        <li className="nav-item" key={idx}>
          {el}
        </li>,
      )
    }
  </ul>;
};

/**
 * AppSidebar
 *
 * The sidebar navigation component for the application.
 * Displays navigation buttons for different sections using StyledNavLink.
 * Styled with a light gray background and rounded left corners.
 * @return The sidebar navigation JSX element.
 */
export const AppSidebar = () =>
  <div className="flex-row justify-center">
    <nav>
      <NavList>
        <StyledNavLink to="/tokens">Tokens</StyledNavLink>
        <StyledNavLink to="/certs">Certificates</StyledNavLink>
      </NavList>
    </nav>
  </div>;
