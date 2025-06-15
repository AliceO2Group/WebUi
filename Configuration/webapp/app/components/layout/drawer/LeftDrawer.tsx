import React, { type FC, type PropsWithChildren } from 'react';
import { Box, Drawer, Toolbar, Typography } from '@mui/material';
import LeftDrawerFooter from './LeftDrawerFooter';

const DRAWER_WIDTH = 300;

interface LeftDrawerProps extends PropsWithChildren {}

const LeftDrawer: FC<LeftDrawerProps> = ({ children }) => {
  return (
    <Drawer
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
      variant="permanent"
      anchor="left"
    >
      <Toolbar style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
        <Typography variant="h5">Configuration GUI</Typography>
      </Toolbar>
      <Box sx={{ overflow: 'auto', flexGrow: 1 }}>{children}</Box>
      <LeftDrawerFooter />
    </Drawer>
  );
};

export default LeftDrawer;
