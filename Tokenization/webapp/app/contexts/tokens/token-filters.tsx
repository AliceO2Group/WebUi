import React, { useState } from "react";

import type { OptionType } from "~/utils/types";

type State = {
    services: OptionType[]
    firstSelectedService: string[]
    secondSelectedService: string[]
    httpMethods: string[]
    expirationDateMin: string
    expirationDateMax: string
    issueDateMin: string
    issueDateMax: string
    ordering: string[]
}

type Actions = {
    setServices: React.Dispatch<React.SetStateAction<OptionType[]>>
    setFirstSelectedService: React.Dispatch<React.SetStateAction<string[]>>
    setSecondSelectedService: React.Dispatch<React.SetStateAction<string[]>>
    setHttpMethods: React.Dispatch<React.SetStateAction<string[]>>
    setExpirationDateMin: React.Dispatch<React.SetStateAction<string>>
    setExpirationDateMax: React.Dispatch<React.SetStateAction<string>>
    setIssueDateMin: React.Dispatch<React.SetStateAction<string>>
    setIssueDateMax: React.Dispatch<React.SetStateAction<string>>
    setOrdering: React.Dispatch<React.SetStateAction<string[]>>
}

export const TokenFiltersContext = React.createContext<{ state: State; actions: Actions } | undefined>(undefined);

export function TokenFiltersProvider({ children }: { children: React.ReactNode }) {
    const [services, setServices] = useState<OptionType[]>([]);
    const [firstSelectedService, setFirstSelectedService] = useState<string[]>([]);
    const [secondSelectedService, setSecondSelectedService] = useState<string[]>([]);
    const [httpMethods, setHttpMethods] = useState<string[]>([]);
    const [expirationDateMin, setExpirationDateMin] = useState<string>('');
    const [expirationDateMax, setExpirationDateMax] = useState<string>('');
    const [issueDateMin, setIssueDateMin] = useState<string>('');
    const [issueDateMax, setIssueDateMax] = useState<string>('');
    const [ordering, setOrdering] = useState<string[]>([]);

    const state = React.useMemo(() => ({
        services,
        firstSelectedService,
        secondSelectedService,
        httpMethods,
        expirationDateMin,
        expirationDateMax,
        issueDateMin,
        issueDateMax,
        ordering
    }), [
        services,
        firstSelectedService,
        secondSelectedService,
        httpMethods,
        expirationDateMin,
        expirationDateMax,
        issueDateMin,
        issueDateMax,
        ordering
    ]) ;

    const actions = React.useMemo(() => ({
        setServices,
        setFirstSelectedService,
        setSecondSelectedService,
        setHttpMethods,
        setExpirationDateMin,
        setExpirationDateMax,
        setIssueDateMin,
        setIssueDateMax,
        setOrdering
    }), [
        setServices,
        setFirstSelectedService,
        setSecondSelectedService,
        setHttpMethods,
        setExpirationDateMin,
        setExpirationDateMax,
        setIssueDateMin,
        setIssueDateMax,
        setOrdering
    ])  ;

    return <TokenFiltersContext.Provider value={{ state,  actions }}>
        {children}
    </TokenFiltersContext.Provider>

}