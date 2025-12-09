// will be used to fetch unbanning token
export async function clientAction({request}: Route.ClientActionArgs) {
    const formData = await request.formData();
    console.log('Unbanning token with data:', Object.fromEntries(formData.entries()));
    if (formData.has('filterInfo')) { // when additional filtering it is bulk operation
      return { success: true, bulk: true };
    }
    return { success: true };
}