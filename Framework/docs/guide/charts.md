# Frontend - Charts

The frontend allows plotting time series. See how to works in a [demo](https://aliceo2group.github.io/WebUi/Framework/docs/reference/chart.html).
Full API is available in the [Frontend reference](../reference/frontend-api.md#chartTimeSeries).

## Usage

Each chart consists of a name, array of timestamp-value pairs and a time window parameters.

- X axis represents the time, the most recent value is display on the right side. The sliding window ensures that only recent values are plotted.
- Y axis has a dynamic range and changes according to values.

```js
import {h, chartTimeSeries} from '../../Frontend/js/src/index.js';

h('div.m4', [
  chartTimeSeries({
    series: [{value: 10, timestamp: Date.now()}, ...],
    title: 'Temperature',
    colorPrimary: 'red',
    width: '800', // in pixels
    timeWindow: 100, // in ms
  }),
]),
```

## Performance

- Keep page drawing time under 15ms (60 FPS)
- Draw only what will be seen by user, use tabs if needed
