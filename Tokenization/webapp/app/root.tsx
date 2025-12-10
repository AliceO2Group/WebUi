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
import type { Route } from './+types/root';

import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration
} from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';

import { SessionProvider } from './feature/auth/contexts/sessionContext';
import { Spinner } from '~/ui/spinner';
import { queryClient } from './query/queryClient';

import '@aliceo2/web-ui/Frontend/css/src/bootstrap.css';
import './app.css';
import './styles/components-styles.css'
import './styles/ui-styles.css'

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <head>
        <meta charSet='utf-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts /> 
      </body>
    </html>
  );
}

export default function App() {
  
  return (
  <QueryClientProvider client={queryClient}>
    <SessionProvider>
      <Outlet/>
    </SessionProvider>
  </QueryClientProvider>);
}

export function HydrateFallback() {
  return <Spinner />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!';
  let details = 'An unexpected error occurred.';
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error';
    details =
      error.status === 404
        ? 'The requested page could not be found.'
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className='pt-16 p-4 container mx-auto'>
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className='w-full p-4 overflow-x-auto'>
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
