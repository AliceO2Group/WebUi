# Full server approach

For the setup, we're basically going to repeat the steps from the tutorial.

### 1. Fetch project template

```bash
mkdir project
git clone https://github.com/AliceO2Group/WebUi.git
cp -R WebUi/Framework/docs/demo/project/* ./project
cd project
```

### 2. Add the framework to dependency list

```bash
npm init
npm install --save @aliceo2/web-ui
```

### 3. Launch the application

Start the server
```bash
node index.js
```

Then, open your browser and navigate to [http://localhost:8080](http://localhost:8080). This is the main demo page.

Navigate through available demos:
- [chart](http://localhost:8080/chart)
- [frontend](http://localhost:8080/frontend/)
- [notification](http://localhost:8080/notification/)
- [template-1](http://localhost:8080/template-1/)
- [template-2](http://localhost:8080/template-2/).
