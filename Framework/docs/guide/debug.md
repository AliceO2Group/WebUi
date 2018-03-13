# Guide - Debugging with the browser's inspector

![Inspector inside Chrome](../images/inspector-chrome.png)

A good tool will always help you for good work. In the web development, the inspector is the right choice. It is included in most browsers and accessible by a right-click.

The two most useful tabs are *Console* and *Network* (depending on your browser). The first one allows you to communicate with the Javascript engine of the current page, for example to manipulate a model or view its data. The second one allows you to check all files loaded with their status and all calls to the server (ajax and websocket).

When things get wrong, the script stops and the error is shown in the *Console*. Click on it to show the source code with the associated error. You can also force the third tab *Source code* to be shown at some point by inserting the statement `debugger;` inside your source code. You will then be able to see the stack and variables value.

Finally, a fourth tab *Element* or *DOM* shows the DOM tree of the current page. This is the result produces by the hyperscript view. You can change values on-the-fly to see what happen in real time (class of elements or CSS values for example).

On Safari, follow this [guide](https://support.apple.com/fr-ch/guide/safari/use-the-safari-develop-menu-sfri20948/mac) to open the inspector.
