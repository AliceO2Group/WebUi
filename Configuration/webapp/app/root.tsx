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

import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router';

import type { Route } from './+types/root';
import './app.css';
import '@aliceo2/web-ui/Frontend/css/src/bootstrap.css';
import { Spinner } from '~/ui/spinner';

import { MainLayout } from './components/layout/MainLayout';
import { LeftDrawer } from './components/layout/drawer/LeftDrawer';
import { Content } from './components/layout/content/Content';
import { ConfigNavigator } from './components/config-navigator/ConfigNavigator';

import queryClient, { persister } from './api/queryClient';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useState } from 'react';

/**
 * Root component
 * @param {{ children: React.ReactElement }} props Props of the component
 * @param {React.ReactElement} props.children React nodes to embed inside of this component
 * @returns {React.ReactElement} Root
 */
export function Layout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
          <MainLayout>
            <LeftDrawer isOpen={isOpen} setIsOpen={setIsOpen}>
              <ConfigNavigator />
            </LeftDrawer>
            <Content isOpen={isOpen}>
              <button onClick={() => setIsOpen(!isOpen)}>TOGGLE</button>
              {children}
            </Content>
          </MainLayout>
          <ScrollRestoration />
          <Scripts />
        </PersistQueryClientProvider>
      </body>
    </html>
  );
}

/**
 * App component
 * @returns {React.ReactElement} App
 */
export default function App() {
  return <Outlet />;
}

/**
 * HydrateFallback component
 * @returns {React.ReactElement} HydrateFallback
 */
export function HydrateFallback() {
  return <Spinner />;
}

/**
 * ErrorBoundary component
 * @param {React.FC.Props} props React props object
 * @returns {React.ReactElement} ErrorBoundary
 */
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!';
  let details = 'An unexpected error occurred.';
  let stack: string | undefined = undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error';
    details =
      error.status === 404 ? 'The requested page could not be found.' : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    ({ stack } = error);
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
