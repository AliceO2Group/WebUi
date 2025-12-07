import { useFetcher } from "react-router"
import { FormInputFile } from "../form/form-input"
import type React from "react";



export function CertsForm({renew, fetcher}: {renew?: boolean, fetcher: ReturnType<typeof useFetcher>}) {

    return <div> 
      <div className='flex-row justify-center'>
        <span className='f3 pv4'>{renew ? 'Renew certificate by' : 'Register service by'} providing file with .crt extension</span>      
      </div> 
      <fetcher.Form 
      method='post' 
      action='/certs'
      onInput={(event: React.ChangeEvent<HTMLFormElement>) => {
        fetcher.submit(event.currentTarget);
      }}

      >
        <FormInputFile name='certFile'/>
      </fetcher.Form>
     </div>
}