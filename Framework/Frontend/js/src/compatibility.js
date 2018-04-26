// Check ES6
try {
  eval('() => 1');
  eval('const a = 1');
  eval('class a {}');
} catch (e) {
  alert('Your browser does not support ES6. See browser requirements of O2 WebUi Framework.');
}

// Check ES7
try {
  eval('const [a, b] = [1, 2]');
  eval('const {a, b} = {a: 1, b: 2}');
} catch (e) {
  alert('Your browser does not support ES7. See browser requirements of O2 WebUi Framework.');
}

// Check ES8
try {
  eval('async () => 1');
} catch (e) {
  alert('Your browser does not support ES8. See browser requirements of O2 WebUi Framework.');
}

// Currently not supported by Safari
// // Check ES9
// try {
//   eval('const {a, ...rest} = {a: 1, b: 2}');
// } catch(e) {
//   alert('Your browser does not support ES9. See browser requirements of O2 WebUi Framework.');
// }

// Check Javascript Modules (firefox 58-59 has but needs to be enabled)
const script = document.createElement('script');
script.setAttribute('nomodule', '');
script.innerHTML = 'window.nomodules = true;';
document.head.insertBefore(script, document.head.firstChild);
script.remove();
if (window.nomodules) {
  alert(`Your browser does not support JS modules. 
         See browser requirements of O2 WebUi Framework.`);
}

