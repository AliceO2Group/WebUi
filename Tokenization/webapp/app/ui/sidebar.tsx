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
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';

type SidebarLink = {
  label: string;
  path: string;
};

type SidebarSection = {
  title: string;
  items: SidebarLink[];
};

const NAV_SECTIONS: SidebarSection[] = [
  {
    title: 'Tokens',
    items: [
      {
        label: 'Active Tokens',
        path: '/tokens/active',
      },
      {
        label: 'Archived Tokens',
        path: '/tokens/archived',
      },
    ],
  },
  {
    title: 'Services',
    items: [
      {
        label: 'Service Overview',
        path: '/services/overview',
      }, {
        label: 'Service Registration',
        path: '/services/new',
      },
    ],
  },
  {
    title: 'Routes',
    items: [
      {
        label: 'Routes Overview',
        path: '/routes/overview',
      },
    ],
  },
];

type AppSidebarProps = {
  width?: number;
};

/**
 * AppSidebar
 *
 * Material UI based sidebar that groups navigation targets by domain sections.
 * Highlights the active path using NavLink state and keeps footprint compact.
 */
export const AppSidebar = ({ width = 240 }: AppSidebarProps) => (
  <Box
    component="nav"
    sx={{
      width,
      position: 'fixed',
      top: 0,
      bottom: 0,
      left: 0,
      height: '100vh',
      borderRight: '1px solid',
      borderColor: 'divider',
      bgcolor: 'background.paper',
      py: 3,
      px: 2,
      display: 'flex',
      flexDirection: 'column',
      gap: 3,
      justifyContent: 'center',
    }}
  >
    {NAV_SECTIONS.map((section, sectionIndex) => (
      <Box key={section.title}>
        <Typography
          variant="caption"
          sx={{
            textTransform: 'uppercase',
            letterSpacing: 1,
            color: 'text.secondary',
            px: 1,
            mb: 1,
            display: 'block',
          }}
        >
          {section.title}
        </Typography>
        <List dense disablePadding>
          {section.items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={false}
              style={{ textDecoration: 'none' }}
            >
              {({ isActive }) => (
                <ListItemButton
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    bgcolor: isActive ? 'primary.main' : 'transparent',
                    color: isActive ? 'primary.contrastText' : 'text.primary',
                    '&:hover': {
                      bgcolor: isActive ? 'primary.dark' : 'action.hover',
                    },
                  }}
                >
                  <ListItemText
                    primary={item.label}
                    secondaryTypographyProps={{
                      color: isActive ? 'primary.contrastText' : 'text.secondary',
                    }}
                  />
                </ListItemButton>
              )}
            </NavLink>
          ))}
        </List>
        {sectionIndex < NAV_SECTIONS.length - 1 && <Divider sx={{ mt: 2 }} />}
      </Box>
    ))}
  </Box>
);
