import React from 'react';

/**
 * One-line helper function which checks if a component is of a certain type
 * 
 * @param {React.ReactNode} c - component to check
 * @param {React.ElementType} otype - component type to check against
 * @returns {Boolean} true if component is of the specified type, false otherwise
 */
export const checkIsComponentOfType = (c: React.ReactNode, otype: React.ElementType): boolean => React.isValidElement(c) && c.type === otype;