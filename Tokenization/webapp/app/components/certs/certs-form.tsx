import { useFetcher, useSubmit } from "react-router"
import { FormInputFile } from "../form/form-input"
import type React from "react";


export function CertsForm() {
    const fetcher = useFetcher();
    const submit = useSubmit(); 

    return <div> 
      <div className='flex-row justify-center'>
        <span className='f3 mv4'>Register service by providing file with .crt extension</span>      
      </div> 
      <fetcher.Form 
      method='post' 
      action='/certs'
      onInput={(event: React.ChangeEvent<HTMLFormElement>) => {
        submit(event.currentTarget);
      }}>
        <FormInputFile name='certFile'/>
     </fetcher.Form>
    </div>
}