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
import Button from '@mui/material/Button';
import type {NavLinkProps} from 'react-router';




/**
 * StyledNavLink
 *
 * A wrapper component that renders a Material-UI Button styled as a navigation link.
 * It uses NavLink from react-router to determine if the link is active and applies
 * the 'contained' variant for the active route and 'outlined' for inactive routes.
 *
 * @param children The content to display inside the button.
 * @param to The target route path.
 */
const StyledNavLink = ({children, to}: NavLinkProps) => {
    return <NavLink to={to}>
        {({isActive}) => (
            <Button 
                variant={isActive ? 'contained' : 'outlined'}
                color='secondary'
                sx={{width: '15em'}}
            >
                {children}
            </Button>
        )}
    </NavLink>
}

/**
 * AppSidebar
 *
 * The sidebar navigation component for the application.
 * Displays navigation buttons for different sections using StyledNavLink.
 * Styled with a light gray background and rounded left corners.
 *
 * @returns The sidebar navigation JSX element.
 */
export const AppSidebar = () => {
    return <nav className={'bg-gray-light flex-row justify-center pv4 ml4'} style={{gridRow: "span 2", borderRadius: "2% 0 0 2%"} }>
        <div className="flex-column justify-start items-center g4">
            <StyledNavLink to={'/tokens'}>Tokens</StyledNavLink>
            <StyledNavLink to={'/certs'}>Certificates</StyledNavLink>
        </div>
    </nav>
}
