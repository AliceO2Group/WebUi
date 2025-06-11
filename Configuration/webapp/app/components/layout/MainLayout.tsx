import { Box } from '@mui/material';
import React, { type FC, type PropsWithChildren } from 'react';
import { Links, Meta, Scripts, ScrollRestoration } from 'react-router';
import LeftDrawer from './drawer/LeftDrawer';
import Content from './content/Content';

interface MainLayoutProps extends PropsWithChildren {}

const MainLayout: FC<MainLayoutProps> = ({ children }) => {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Box
          sx={{
            display: 'flex',
            height: '100vh',
          }}
        >
          <LeftDrawer />
          <Content>{children}</Content>
        </Box>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
};

export default MainLayout;
