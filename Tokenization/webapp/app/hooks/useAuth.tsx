import {useState, useEffect} from 'react';
import sessionService from '@aliceo2/web-ui/Frontend/js/src/sessionService'

export function useAuth(role: string): boolean {
    const [hasAccess, setHasAccess] = useState<boolean>(false)

    useEffect( () => {
        try {
            if(!sessionService.session) {
                setHasAccess(false)
            }
            setHasAccess(sessionService.hasAccess(role))
        }catch(e) {
            setHasAccess(false)
        }
    }, [role])

    return hasAccess

}
