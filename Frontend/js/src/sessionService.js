let sessionParameters = null;

export function loadAndHideSessionParameters() {
  // Get parameters from the query string



  // Replace the current URL with a new one without parameters


}

export function getSessionParameters() {
  if (!sessionParameters) {
    throw new Error('sessionParameters must be loaded first with loadAndHideSessionParameters()');
  }

  return sessionParameters;
}
