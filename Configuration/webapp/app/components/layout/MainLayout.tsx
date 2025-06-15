import { Box } from '@mui/material';
import React, { type FC, type PropsWithChildren } from 'react';

interface MainLayoutProps extends PropsWithChildren {}

const MainLayout: FC<MainLayoutProps> = ({ children }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
      }}
    >
      {children}
    </Box>
  );
};

export default MainLayout;
