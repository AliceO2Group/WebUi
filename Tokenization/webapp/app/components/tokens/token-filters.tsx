import { useEffect} from "react";

import { setStorageItem } from "~/utils/storage";

import { FormSelectMulti } from "../form/form-select";
import { FormInput } from "../form/form-input";
import { useTokenFilters } from "~/hooks/tokens/token-filters";
import { FlexGrowWrapper, FlexGrowWrapperElement } from "~/ui/flex";

const _applyFilters = ({services, ...filterStates}: any) => {
    console.log("Applying filters with state:", filterStates);
    setStorageItem('TKN_token-filters', filterStates); 
}


export function TokenFilters() {
    // deleting stored filters on component un-mount
    useEffect(() => {
        return () => {
            setStorageItem('TKN_token-filters', {});
        }
    }, [])

    const {state, actions} = useTokenFilters();
    const {
        services,
        firstSelectedService,
        secondSelectedService,
        httpMethods,
        expirationDateMin,
        expirationDateMax,
        issueDateMin,
        issueDateMax,
        ordering
    } = state;

    const {
        setServices,
        setFirstSelectedService,
        setSecondSelectedService,
        setHttpMethods,
        setExpirationDateMin,
        setExpirationDateMax,
        setIssueDateMin,
        setIssueDateMax,
        setOrdering,
        clearAllFilters
    } = actions;

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

    function applyFilters() {
        _applyFilters(state);        
    }

    return <div> 
            <FlexGrowWrapper>
                <FormSelectMulti id='first-selected-service' label="Service From:" options={services} value={firstSelectedService} setValue={setFirstSelectedService}/>
                <FormSelectMulti id='second-selected-service' label="Service To:" options={services} value={secondSelectedService} setValue={setSecondSelectedService} />
                <FormSelectMulti id='http-methods' label="HTTP Methods:" options={[
                    { value: 'GET', label: 'GET' },
                    { value: 'POST', label: 'POST' },
                    { value: 'PUT', label: 'PUT' },
                    { value: 'DELETE', label: 'DELETE' }
                ]} value={httpMethods} setValue={setHttpMethods} />
            </FlexGrowWrapper>
            <FlexGrowWrapper>
                <FormInput 
                labelText="Expiration Date (min):" 
                inputProps={{
                    type: "datetime-local"
                }}
                value={expirationDateMin}
                setValue={setExpirationDateMin}
                />
                <FormInput 
                labelText="Expiration Date (max):" 
                inputProps={{
                    type: "datetime-local"
                }}
                value={expirationDateMax}
                setValue={setExpirationDateMax}
                />
                <FormInput 
                labelText="Issue Date (min):"
                inputProps={{
                    type: "datetime-local"
                }}
                value={issueDateMin}
                setValue={setIssueDateMin}
                />
                <FormInput 
                labelText="Issue Date (max):"
                inputProps={{
                    type: "datetime-local"
                }}
                value={issueDateMax}
                setValue={setIssueDateMax}
                />
            </FlexGrowWrapper>
            <FlexGrowWrapper>
                <FormSelectMulti 
                        id='tags' 
                        label="Order by:" 
                        options={orderingOptions} 
                        value={ordering} 
                        setValue={setOrdering} 
                />
                <FlexGrowWrapperElement className="self-center">
                    <div className='flex-row g1 justify-end'>
                        <button className="btn btn-primary" onClick={applyFilters}>Apply Filters</button>
                        <button className="btn btn-danger" onClick={clearAllFilters}>Clear Filters</button>
                    </div>
                </FlexGrowWrapperElement>
            </FlexGrowWrapper>
        </div>

}