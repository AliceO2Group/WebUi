import { useContext } from "react";
import { TokenTableContext } from "../../contexts/token-table";

export default function useTokenTableFetchers(
    fetcherName: 'ban' | 'unban'
) {
    const context = useContext(TokenTableContext);
    if (!context) {
        throw new Error('useTokenTableFetchers must be used inside TokenTableProvider');
    }
    return context.fetchers[fetcherName];
}