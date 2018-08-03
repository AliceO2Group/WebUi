# Frontend - Charts

The frontend allows plotting time series. See how to works in a [JSFiddle demo](http://jsfiddle.net/awegrzyn/mjyzcen9/).
Full API is available in the [Frontend reference](../reference/frontend-api.md#chartTimeSerie).

## Usage

Each chart consits of a name, array of timestamp-value paris and a time window parameters.

- X axis represents the time, the most recent value is display on the right. The sliding window ensures that only recent values are plotted.
- Y axis has a dynamic range and changes according to minimum and maximum values.

```js
import {h, chartTimeSerie} from '../../Frontend/js/src/index.js';

h('div.m4', [
  chartTimeSerie({
    serie: [{value: 10, timestamp: Date.now()}, ...],
    title: 'Temperature',
    colorPrimary: 'red',
    width: '800', // in pixels
    timeScale: 100, // in ms
  }),
]),
```

![Chart example](../images/charts-timeserie.png)

## Performance

Drawing is optimized for intensive use.

Recommandations:
- Keep page drawing time under 15ms (60 FPS)
- Draw only what will be seen by user, use tabs if needed
- Reduce number of points density
