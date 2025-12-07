import { useState, useEffect } from "react";
import { useFetcher } from "react-router";

export function useOpenCertModal(fetcher: ReturnType<typeof useFetcher>) {

    const [certModalOpen, setCertModalOpen] = useState<boolean>(false);
    useEffect(() => { 
      console.log('Fetcher state changed:', fetcher.state);
      if(['submitting', 'loading'].includes(fetcher.state)) {
        setCertModalOpen(true);
      }
    },[fetcher, fetcher.state]);
    return [certModalOpen, setCertModalOpen];
}