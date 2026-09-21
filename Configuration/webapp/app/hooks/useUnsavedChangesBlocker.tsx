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

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

interface UseUnsavedChangesBlockerOptions {
  isDirty: boolean;
  onSave: () => void | Promise<void>;
}

/**
 * Hook to block navigation when there are unsaved changes.
 * Intercepts Link clicks and programmatic navigation.
 * @param {UseUnsavedChangesBlockerOptions} options - The options for the blocker.
 * @param {boolean} options.isDirty - Whether the form has unsaved changes.
 * @param {() => void | Promise<void>} options.onSave - Callback to save the form.
 * @returns {object} Object containing modal state and handlers.
 */
export const useUnsavedChangesBlocker = ({ isDirty, onSave }: UseUnsavedChangesBlockerOptions) => {
  const [showModal, setShowModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const pendingNavigationRef = useRef<string | null>(null);
  const shouldBlockRef = useRef(false);

  // Intercept Link clicks
  useEffect(() => {
    if (!isDirty) {
      return;
    }

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a[href]');

      if (!link) {
        return;
      }

      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }

      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) {
          return;
        }

        if (url.pathname !== location.pathname) {
          event.preventDefault();
          event.stopPropagation();
          shouldBlockRef.current = true;
          pendingNavigationRef.current = href;
          setShowModal(true);
        }
      } catch {
        // Invalid URL, ignore
      }
    };

    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, [isDirty, location.pathname]);

  useEffect(() => {
    if (!isDirty) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  const handleProceed = useCallback(() => {
    setShowModal(false);
    const targetPath = pendingNavigationRef.current;
    pendingNavigationRef.current = null;
    shouldBlockRef.current = false;

    if (targetPath) {
      void navigate(targetPath);
    }
  }, [navigate]);

  const handleSaveAndProceed = useCallback(async () => {
    setShowModal(false);
    await onSave();
    const targetPath = pendingNavigationRef.current;
    pendingNavigationRef.current = null;
    shouldBlockRef.current = false;

    if (targetPath) {
      void navigate(targetPath);
    }
  }, [onSave, navigate]);

  const handleCancel = useCallback(() => {
    setShowModal(false);
    pendingNavigationRef.current = null;
    shouldBlockRef.current = false;
  }, []);

  return {
    showModal,
    handleProceed,
    handleSaveAndProceed,
    handleCancel,
  };
};
