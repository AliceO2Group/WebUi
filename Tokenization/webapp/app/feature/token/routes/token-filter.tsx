import { tokensMock } from "../mocks/tokens";
// will be used to fetch filtered tokens
export async function clientAction({request}: Route.ClientActionArgs) {
    
    const formData = await request.formData();

    // Convert FormData -> plain object
    const raw: Record<string, any> = {};
    for (const key of formData.keys()) {
        const values = formData.getAll(key);
        raw[key] = values.length > 1 ? values : values[0];
    }

    // Normalize values: our select components serialize values as JSON strings in hidden inputs,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tryParse = (val: any) => {
        if (typeof val === 'string') {
            try {
                return JSON.parse(val);
            } catch (e) {
                return val;
            }
        }
        return val;
    };

    // if element is array, parse each item; else parse single value
    const normalized: Record<string, object> = {};
    for (const [k, v] of Object.entries(raw)) {
        if (Array.isArray(v)) {
            normalized[k] = v.map(tryParse);
        } else {
            normalized[k] = tryParse(v);
        }
    }

    // Remove empty values.
    const isEmptyValue = (v: any) => {
        if (v == null) return true; // removing nulls
        if (Array.isArray(v)) { // removing empty arrays
            return v.filter((x) => x != null && x !== '' && !(Array.isArray(x) && x.length === 0)).length === 0;
        }
        return v === ''; // removing empty strings
    };

    const data = Object.fromEntries(
        Object.entries(normalized).filter(([_, v]) => !isEmptyValue(v)),
    );

    function checkIfAnyFilterIsSet(obj: Record<string, any>): boolean {
        if(Object.keys(obj).length === 0) {
            return false;
        }
        return true;
    }

    function checkIfOnlyOrderingIsSet(obj: Record<string, any>): boolean {
        if(Object.keys(obj).length === 1) {
            if(Object.keys(obj)[0] === 'orderBy') {
                return true;
            }
        }
        return false;
    }

    console.log(data)

    // not filters are set so we return all tokens
    if(!checkIfAnyFilterIsSet(data)) { 
        const tokens = Array.from(tokensMock.values());
        return { success: true, filtered: false, tokens: tokens };
    }

    // this situation will not let user to bulk operate
    if(checkIfOnlyOrderingIsSet(data)) { 
        const tokens = Array.from(tokensMock.values());
        return { success: true, filtered: false, tokens: tokens };
    }

    const tokens = Array.from(tokensMock.values()).filter(token => token.id % 2 ); // we add some filtering mock
    return { success: true, filtered: true, tokens: tokens };
}