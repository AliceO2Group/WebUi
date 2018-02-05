# Guide - Debugging with the inspector

A good tool will always help you for good work. In the web development, the inspector is the right choice. It is included in most browsers and accessible by a right-click.

The two most useful tabs are *Console* and *Network*. The first one allows you to communicate with the Javascript engine of the current page, for example to manipulate a model or view its data. The second one allows you to check all files loaded with their status and all calls to the server (ajax and websocket).

When things get wrong, the script stops and the error is shown in the *Console*. Click on it to show the source code with the associated error. You can also force the third tab *Source code* to be shown at some point by inserting the statement `debugger;` inside your Javascript code. You wil then be able to see the stack and values.

Finally, a fourth tab *Element* or *DOM* shown the DOM tree of the current page. You can see with it if the view is renderer as expected but also modify it on the fly to see what happens before coding it in your code. For example you can see if a layout is well by changing a class element or directly the CSS values of the page.
