/**
 * Try to execute a string code with eval, on failure redirect to the compatibility page.
 * @param {string} stringCode - source code as a string
 */
function tryCompatibility(stringCode) {
  try {
    eval(stringCode);
  } catch (e) {
    // eslint-disable-next-line
    console.error(`Compatibility issue with: ${stringCode}`);
    // Goto compatibility page provided by default with WebUi/Framework/Frontend
    window.location.href = '/compatibility.html';
  }
}

tryCompatibility('() => 1');
tryCompatibility('const a = 1');
tryCompatibility('class a {}');
tryCompatibility('const [a, b] = [1, 2]');
tryCompatibility('const {a, b} = {a: 1, b: 2}');
tryCompatibility('async () => 1');
// tryCompatibility('const {a, ...rest} = {a: 1, b: 2}'); // Currently not supported by Safari, ES9

// Check Javascript Modules (firefox 58-59 has but needs to be enabled)
const script = document.createElement('script');
script.setAttribute('nomodule', '');
script.innerHTML = 'window.nomodules = true;';
document.head.insertBefore(script, document.head.firstChild);
script.remove();
if (window.nomodules) {
  // eslint-disable-next-line
  console.error(`Compatibility issue with: JS modules`);
  // Goto compatibility page provided by default with WebUi/Framework/Frontend
  window.location.href = '/compatibility.html';
}

