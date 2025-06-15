import { Box } from '@mui/material';
import React, { type FC, type PropsWithChildren } from 'react';
import LeftDrawer from './drawer/LeftDrawer';
import Content from './content/Content';

interface MainLayoutProps extends PropsWithChildren {}

const MainLayout: FC<MainLayoutProps> = ({ children }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
      }}
    >
      <LeftDrawer />
      <Content>{children}</Content>
    </Box>
  );
};

export default MainLayout;
