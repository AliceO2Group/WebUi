import {h} from '/js/src/index.js';

// SVG icon wrapper
export const icon = (svg) => h('svg.icon', {fill: 'currentcolor', viewBox: '0 0 8 8'}, svg);

// SVG icons
export const iconStar = () => icon(h('path', {d: 'M4 0l-1 3h-3l2.5 2-1 3 2.5-2 2.5 2-1-3 2.5-2h-3l-1-3z'}));
export const iconEdit = () => icon(h('path', {d: 'M6 0l-1 1 2 2 1-1-2-2zm-2 2l-4 4v2h2l4-4-2-2z'}));
export const iconCaretBottom = () => icon(h('path', {d: 'M0 2l4 4 4-4h-8z'}));
export const iconCaretRight = () => icon(h('path', {d: 'M2 0v8l4-4-4-4z'}));
export const iconBarChart = () => icon(h('path', {d: 'M0 0v7h8v-1h-7v-6h-1zm5 0v5h2v-5h-2zm-3 2v3h2v-3h-2z'}));
export const iconLayers = () => icon(h('path', {d: 'M0 0v4h4v-4h-4zm5 2v3h-3v1h4v-4h-1zm2 2v3h-3v1h4v-4h-1z'}));
export const iconPlus = () => icon(h('path', {d: 'M3 0v3h-3v2h3v3h2v-3h3v-2h-3v-3h-2z'}));
export const iconArrowLeft = () => icon(h('path', {d: 'M3 1l-3 2.531 3 2.469v-2h5v-1h-5v-2z'}));
export const iconArrowRight = () => icon(h('path', {d: 'M5 1v2h-5v1h5v2l3-2.531-3-2.469z'}));
export const iconArrowTop = () => icon(h('path', {d: 'M3.469 0l-2.469 3h2v5h1v-5h2l-2.531-3z'}));
export const iconArrowBottom = () => icon(h('path', {d: 'M3 0v5h-2l2.531 3 2.469-3h-2v-5h-1z'}));

