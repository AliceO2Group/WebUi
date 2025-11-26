import type { OptionType } from "~/utils/types";

import { useEffect, useState } from "react";
import { FormSelect, FormSelectMulti } from "../form/form-select";
import { FormInput } from "../form/form-input";

export function TokenFilters() {

    const [services, setServices] = useState<OptionType[]>([]);
    const [firstSelectedService, setFirstSelectedService] = useState<string[]>([]);
    const [secondSelectedService, setSecondSelectedService] = useState<string[]>([]);
    const [httpMethods, setHttpMethods] = useState<string[]>([]);
    const [expirationDateMin, setExpirationDateMin] = useState<string>('');
    const [expirationDateMax, setExpirationDateMax] = useState<string>('');
    const [issueDateMin, setIssueDateMin] = useState<string>('');
    const [issueDateMax, setIssueDateMax] = useState<string>('');
    const [ordering, setOrdering] = useState<string[]>([]);

    const columns = [
        "ID", "Issue Date", "Expiration Date"
    ]
    const orderingOptions = []
    for (const col of columns) {
        orderingOptions.push({value: col.toLowerCase().replace(/\s+/g, '_'), label: col});
        orderingOptions.push({value: `-${col.toLowerCase().replace(/\s+/g, '_')}`, label: `${col} (desc)`});
    }
    
    useEffect(() => {
        // load services from API mock
        setTimeout(() => {
            setServices([
                { value: 'service1', label: 'Service 1' },
                { value: 'service2', label: 'Service 2' },
                { value: 'service3', label: 'Service 3' },
                { value: 'service4', label: 'Service 4' },
            ]);
        }, 500);

    }, [setServices])

    return <div style={{transform: "scaleY(0.95)"}}> 
    <div className="flex-row g2">
        <div className="flex-grow ">
            <FormSelectMulti id='first-selected-service' label="Service From:" options={services} value={firstSelectedService} setValue={setFirstSelectedService}/>
        </div>
        <div className="flex-grow">
            <FormSelectMulti id='second-selected-service' label="Service To:" options={services} value={secondSelectedService} setValue={setSecondSelectedService} />
        </div>
        <div className='flex-grow'>
            <FormSelectMulti id='http-methods' label="HTTP Methods:" options={[
                { value: 'GET', label: 'GET' },
                { value: 'POST', label: 'POST' },
                { value: 'PUT', label: 'PUT' },
                { value: 'DELETE', label: 'DELETE' }
            ]} value={httpMethods} setValue={setHttpMethods} />
        </div>
    </div>
    <div className="flex-row g2">
        <div className="flex-grow">
            <FormInput 
            labelText="Expiration Date (min):" 
            inputProps={{
                type: "datetime-local"
            }}
            value={expirationDateMin}
            setValue={setExpirationDateMin}
            />
        </div>
            <div className="flex-grow">
            <FormInput 
            labelText="Expiration Date (max):" 
            inputProps={{
                type: "datetime-local"
            }}
            value={expirationDateMax}
            setValue={setExpirationDateMax}
            />
        </div>
        <div className="flex-grow">
            <FormInput 
            labelText="Issue Date (min):"
            inputProps={{
                type: "datetime-local"
            }}
            value={issueDateMin}
            setValue={setIssueDateMin}
            />
        </div>

        <div className="flex-grow">
            <FormInput 
            labelText="Issue Date (max):"
            inputProps={{
                type: "datetime-local"
            }}
            value={issueDateMax}
            setValue={setIssueDateMax}
            />
        </div>
    </div>
    <div className="flex-row justify-between">
        <div className="flex-row self-center">
            <div>
                <button className="btn btn-primary">Apply Filters</button>
                <button className="btn btn-danger">Clear Filters</button>
            </div>
        </div>
        <div className="w-85">
            <FormSelectMulti 
                    id='tags' 
                    label="Order by:" 
                    options={orderingOptions} 
                    value={ordering} 
                    setValue={setOrdering} 
            />
        </div>
    </div>

    </div>;
}