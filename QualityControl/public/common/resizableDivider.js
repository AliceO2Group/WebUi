import { h } from '/js/src/index.js';

/**
 * Resizable divider component
 * @param {(newWidthPercent: number) => void} onResize - Callback to handle resizing
 * @returns {vnode} - Virtual node element
 */
export const resizableDivider = (onResize) =>
  h('.flex-column.justify-center.items-cente.divider', {
    style: {
      cursor: 'col-resize',
    },
    oncreate: (vnode) => {
      const handleMouseDown = (e) => {
        e.preventDefault();
        const container = vnode.dom.parentElement;
        const rect = container.getBoundingClientRect();
        const containerWidth = rect.width;

        const dividerRect = vnode.dom.getBoundingClientRect();
        const initialLeft = dividerRect.left - rect.left;
        const dragLine = document.createElement('div');
        dragLine.style.cssText = `
          position: absolute;
          top: 0;
          height: 100%;
          width: 6px;
          background: rgba(0, 123, 255, 0.8);
          pointer-events: none;
          z-index: 1001;
          left: ${initialLeft}px;
        `;
        container.appendChild(dragLine);

        const onMouseMove = (moveEvent) => {
          const newLeftWidth = moveEvent.clientX - rect.left;
          dragLine.style.left = `${newLeftWidth}px`;
        };

        const onMouseUp = (upEvent) => {
          const newLeftWidth = upEvent.clientX - rect.left;
          const newLeftPercent = newLeftWidth / containerWidth * 100;
          const clampedPercent = Math.min(80, Math.max(20, newLeftPercent));
          onResize(Math.round(clampedPercent));

          dragLine.remove();
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      };

      vnode.dom.addEventListener('mousedown', handleMouseDown);
    },
  }, [h('.bg-gray.h-100.divider')]);
