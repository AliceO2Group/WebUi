# Tutorial - Pasta Timer

CSS and JS documentations have their own folders. The current file you are reading is a tutorial combining both of them. You should read the first two to be familiar but it is not mandatory to follow this tutorial.

Let's begin, we will create a pasta timer as a web application.

### Step 1 - preparation

* install [nodejs](https://nodejs.org/en/) first, version 7 or 8 is fine
* open a terminal
* clone this repo where you want `git clone ...`
* inside, do a `touch ./docs/tutorial/pasta-timer.html`
* open this file in your favorite editor
* start `node serve-folder.js`
* open a browser and go to `http://localhost:9000/docs/tutorial/pasta-timer.html`

You should now have a blank page 🗒

### Step 2 - import

First we need to say to the browser that we use the last web tools: HTML5.

Add this text in pasta-timer.html:
```html
<!doctype html>
<title>Pasta Timer</title>
```

This is a valid minimal web application.

Now let's import FrontEndKit, add this to the previous:
```html
<link rel="stylesheet" href="../css/src/bootstrap.css">
<script type="module">
import {Observable, h, mount} from '../js/src/index.js'
</script>
```

We imported the CSS and JS tools. On the browser, open the inspector with a right-click. The console and network tabs are your best friends to debug your application. There should be no error nor 404, only status 200.

### Step 3 - model

Always start with the data structure of your application. Then moves to the view. This is good practice.

We need:
* the remaining time, in seconds
* the cooking time for some common pasta suggested to the user
* the one selected by the user

```js
class PastaTimer extends Observable {
  constructor() {
    super();
    this.remaining = 0;
    this.times = {
      'penne': 11 * 60,
      'spaghetti': 9 * 60,
      'rotini': 8 * 60,
      'farfalle': 12 * 60,
      'macaroni': 11 * 60,
    };
    this.currentPasta = null;
  }
}
```

Put this code after the import statement. We created some attributes in the model by declaring them inside the constructor. The model is observable, if it changes, it will *notify()* others who have *observe()d* this model. Because we extends the Observable class, we need the `super()` statement. The cooking times are set inside an object used as a hashmap: string -> number.

To manipulate the model we also need:
* a method to start the timer
* a method to stop the timer
* a method to update the timer

```js
start(pastaName) {
  if (!this.timer) {
    this.timer = setInterval(this.update.bind(this), this.delta * 1000);
  }
  this.currentPasta = pastaName;
  this.remaining = this.times[pastaName];
  this.notify();
}

stop() {
  if (!this.timer) {
    return;
  }
  clearInterval(this.timer);
  this.timer = null;
  this.notify();
}

update() {
  this.remaining -= this.delta;

  if (this.remaining <= 0) {
    this.remaining = 0;
    this.stop();
  }

  this.notify();
}
```

Remember that everything is always public in Javascript. By convention things with underscore (\_) in front of their name are considered private.

So we added three methods to the model. The start method begins a Javascript timer which is part of the basic API and updates the pasta selected with the remaining time. Then we notify that the model has changed.

The stop method clears the interval timer and notify observers.

Fianally the update method decrease the remaining time by a delta set inside the interval timer (see start method). We need to define it in the constructor, let's say 1 second, because Javascript uses miliseconds the delta is multiplied by a factor of 1000 in the start method.

Let's declare those two new attributes in the constructor by adding this:
```js
this.timer = null;
this.delta = 1; // second
```

We can now test our model. After the declaration of the PastaTimer class, add this:
```js
const model = new PastaTimer();
window.model = model;
```

We create a new instance of our model and we inject it inside the global context. This will help us to debug. Refresh the page.

In the inspector (right-click), type `model` and press enter. You should see the content of this instance. Check that the remaining time is equal to zero by typing `model.remaining`. We will start the timer without its view by typing `model.start('penne')` and we check that it works by viewing the `remaining` attribute, does it decrease?

This was the easy part using traditional classes and the Observer pattern. Let's build a DOM view.

### Step 4 - view

The view is a functional representation of the DOM. We use hyperscript for this, see the full documentation inside the [../reference/frontend-js.md](../reference/frontend-js.md) folder.

```js
function view(model) {
  return h('div', 'Hello world');
}
```

It represents in HTML `<div>Hello World</div>`. We can translate it with the `mount()` function.

```js
function view(model) {
  return h('div', 'Hello world');
}

const model = new PastaTimer();
window.model = model;
mount(document.body, view, model);
```

This can be added before the end of the `<script>` tag. We can sum up the current script tag like this: import of the library, the model definition, the functional view and the controller which has instanciated a model and binded it with the view though `mount` for the whole page (document.body).

Refresh the page. You should see the Hello World.

Now we can add some more complex view. Replace the content by this:

```js
function view(model) {
  return h('div', [
    h('div', model.remaining),
    h('button', {onclick: e => model.start('penne')}, 'Start')
  ]);
}
```

We just put the same actions like previously in the debug part we did in the inspector. The view shows the remeaning time in seconds and a click on the button starts the penne timer. The second argument of the `h()` function is the attributes (optional), we put one `onclick attribute with an arrow function associated. The argument `e` is the event triggered by it, which we don't use here. Inside the arrow function we call the model to start the timer. See the [./js/docs/API.md](API) to understand the arguments, the concepts are also useful to understand in details what's going on.

Let's add some style with CSS, you will add a `.f1` class on the div which will tell its content to use the font size number one, the biggest.

Do you know how to add this class attribute?
Try it.
Is it fine?

Here is the anwser.

```js
m('div', {class: 'f1'}, ...)
```

The timer could have a better position in the center of the screen. We will use flexbox for this.

```js
function view(model) {
  return h('.fill-parent.flex-column.items-center.justify-center', [
    h('div.f1', model.remaining),
    h('button', {onclick: e => model.start('penne')}, 'Start')
  ]);
}
```

This tells:
* .fill-parent will take all space available inside the parent, which is the body here
* .flex-column tells to use a vertical layout
* .items-center centers the content horizontaly (only inside a flexbox)
* .justify-center  centers the content verticaly (only inside a flexbox)

You can see many possibilities of layout with flexbox inside the showroom here: [http://localhost:9000/css/docs/showroom.html#flex](http://localhost:9000/css/docs/showroom.html#flex).

We are missing two things: we need to transform the seconds into a readable content and we have more than just a penne pasta timer.

Transforming is easy in functional programming:

```js
function chrono(model) {
  const minutes = Math.floor(model.remaining / 60);
  const seconds = model.remaining % 60;
  return `${pad(minutes)}:${pad(seconds)}`;
}

function pad(number) {
  return number < 10 ? '0' + number : number;
}
```

The first function returns the chorno like this "00:00" and the second is a helper to always have two digits "00". We used templates strings to put two variables inside a string instead of concatenation, we could have done this `pad(minutes) + ':' + pad(seconds)`.

You can put those functions after the view and calls `chrono` instead of `model.remaining`. Don't forget to pass the `model` to `chrono`, it is easier to always pass the same variable so anywhere in your views you can access all the data from the model.

Finally, let's replace the *single button* by an *array of buttons* from the list `model.times`. To obtain the names of the pasta, we get the keys `Object.keys(model.times)`, this will give `['penne','spaghetti','rotini','farfalle','macaroni']` dynamically and we map it to produce for each one a new button.

```js
Object.keys(model.times).map(name => h('button.button.default', {onclick: e => model.start(name)}, name))
```

The functional way is well done here, we only have one expression and no side effect.

When a timer starts, the `currentPasta` is set, we can use it to *activate* the button concerned so the user has a feedback on which pasta he has clicked. This will change the class of the button to `active` (see the CSS framework) or nothing.

```js
Object.keys(model.times).map(name => [
  h('button.button.default', {class: model.currentPasta === name ? 'active' : '', onclick: e => model.start(name)}, name),
  ' '
])
```

Perfect, we can replace `h('button', ...)` by the above code. I also added a space `' '` to avoid collapsing the buttons, spaces are explicit with hyperscript, with HTML we would have just put a new line for the same job, creating a textNode with spaces. Notice the new array containing this space and the button.

This is the end. Congratulations! 🎉

The final tutorial result can be find here [http://localhost:9000/docs/tutorial/pasta-timer-final.html](http://localhost:9000/docs/tutorial/pasta-timer-final.html).

