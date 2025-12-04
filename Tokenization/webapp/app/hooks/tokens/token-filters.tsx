import { useContext } from "react";
import { TokenFiltersContext } from "~/contexts/tokens/token-filters";

/**
 * Used to access Token Filters context created for Token Filters component
 * in webapp/app/contexts/tokens/token-filters.tsx
 */
export function useTokenFilters() {
    const ctx = useContext(TokenFiltersContext);
    if (!ctx) {
        throw new Error('useTokenFilters must be used inside TokenFiltersProvider');
    }
    return ctx;
}