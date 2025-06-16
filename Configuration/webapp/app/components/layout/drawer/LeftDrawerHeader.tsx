import { Toolbar, Typography } from '@mui/material';
import React from 'react';

const LeftDrawerHeader = () => {
  return (
    <Toolbar
      style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}
      className="left-drawer__header"
    >
      <Typography variant="h5">Configuration GUI</Typography>
    </Toolbar>
  );
};

export default LeftDrawerHeader;
