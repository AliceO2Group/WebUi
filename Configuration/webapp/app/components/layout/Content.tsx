import { Box, Toolbar, Typography } from '@mui/material';
import React, { type FC, type PropsWithChildren } from 'react';

interface ContentProps extends PropsWithChildren {}

const Content: FC<ContentProps> = ({ children }) => {
  return (
    <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default' }}>
      <Toolbar>
        <Typography variant="h5">Test</Typography>
      </Toolbar>
      <Box sx={{ p: 3 }}>{children}</Box>
    </Box>
  );
};

export default Content;
